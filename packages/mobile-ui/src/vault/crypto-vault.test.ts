import { describe, it, expect, beforeEach } from "bun:test";
import {
	encryptAndSaveVault,
	unlockVault,
	isVaultConfigured,
	resetVaultStorage,
	getVaultStorage,
	VAULT_STORAGE_KEY,
	type VaultKeys,
} from "./crypto-vault";
import {
	useVaultStore,
	readLegacyPlaintextKeys,
	eraseLegacyPlaintextKeys,
	hasLegacyPlaintextKeys,
	LEGACY_KEY_ANTHROPIC,
	LEGACY_KEY_ELEVENLABS,
	LEGACY_KEY_PEXELS,
	getActiveAnthropicKey,
	getActiveElevenLabsKey,
	getActivePexelsKey,
} from "./vault-store";

describe("crypto-vault engine", () => {
	beforeEach(() => {
		resetVaultStorage();
		eraseLegacyPlaintextKeys();
		useVaultStore.getState().lock();
	});

	it("validates that PIN must be exactly 4 digits", async () => {
		let caught = false;
		try {
			await encryptAndSaveVault("123", { anthropic: "key1" });
		} catch (err: any) {
			caught = true;
			expect(err.message).toContain("4 digits");
		}
		expect(caught).toBe(true);
	});

	it("encrypts keys at rest using AES-GCM and stores ciphertext payload", async () => {
		const sampleKeys: VaultKeys = {
			anthropic: "sk-ant-api03-test-12345",
			elevenlabs: "xi-test-67890",
			pexels: "pexels-sample-key",
		};

		await encryptAndSaveVault("7429", sampleKeys);
		expect(isVaultConfigured()).toBe(true);

		const raw = getVaultStorage().getItem(VAULT_STORAGE_KEY);
		expect(raw).not.toBeNull();
		const payload = JSON.parse(raw!);
		expect(payload.version).toBe(1);
		expect(payload.salt).toBeDefined();
		expect(payload.iv).toBeDefined();
		expect(payload.ciphertext).toBeDefined();

		// Ensure raw keys NEVER appear in plaintext anywhere in the payload
		expect(raw).not.toContain("sk-ant-api03");
		expect(raw).not.toContain("xi-test");
		expect(raw).not.toContain("pexels-sample");
	});

	it("unlocks cleanly with the correct 4-digit PIN", async () => {
		const sampleKeys: VaultKeys = {
			anthropic: "sk-ant-secret",
			elevenlabs: "xi-voice-secret",
			pexels: "pexels-secret",
		};

		await encryptAndSaveVault("1984", sampleKeys);
		const decrypted = await unlockVault("1984");

		expect(decrypted.anthropic).toBe("sk-ant-secret");
		expect(decrypted.elevenlabs).toBe("xi-voice-secret");
		expect(decrypted.pexels).toBe("pexels-secret");
	});

	it("rejects an incorrect PIN with an authentication failure", async () => {
		await encryptAndSaveVault("2026", { anthropic: "my-key" });

		let errorThrown = false;
		try {
			await unlockVault("0000");
		} catch (err: any) {
			errorThrown = true;
			expect(err.message).toBe("Incorrect PIN");
		}
		expect(errorThrown).toBe(true);
	});
});

describe("vault-store and legacy migration", () => {
	beforeEach(() => {
		resetVaultStorage();
		eraseLegacyPlaintextKeys();
		useVaultStore.getState().lock();
	});

	it("automatically migrates legacy plaintext keys into encrypted vault on PIN setup", async () => {
		// Plant legacy plaintext keys
		const storage = getVaultStorage();
		storage.setItem(LEGACY_KEY_ANTHROPIC, "sk-ant-legacy-key");
		storage.setItem(LEGACY_KEY_ELEVENLABS, "xi-legacy-key");
		storage.setItem(LEGACY_KEY_PEXELS, "pexels-legacy-key");

		expect(hasLegacyPlaintextKeys()).toBe(true);

		// Setup vault with PIN 5555
		const ok = await useVaultStore.getState().setupVault("5555");
		expect(ok).toBe(true);

		// Verify state is unlocked in memory
		const state = useVaultStore.getState();
		expect(state.isUnlocked).toBe(true);
		expect(state.keys.anthropic).toBe("sk-ant-legacy-key");
		expect(state.keys.elevenlabs).toBe("xi-legacy-key");
		expect(state.keys.pexels).toBe("pexels-legacy-key");

		// Verify legacy plaintext keys were completely erased from storage
		expect(hasLegacyPlaintextKeys()).toBe(false);
		expect(storage.getItem(LEGACY_KEY_ANTHROPIC)).toBeNull();
		expect(storage.getItem(LEGACY_KEY_ELEVENLABS)).toBeNull();
		expect(storage.getItem(LEGACY_KEY_PEXELS)).toBeNull();

		// Verify bridge getters return the active decrypted keys
		expect(getActiveAnthropicKey()).toBe("sk-ant-legacy-key");
		expect(getActiveElevenLabsKey()).toBe("xi-legacy-key");
		expect(getActivePexelsKey()).toBe("pexels-legacy-key");
	});

	it("clears memory keys upon lock() and prevents retrieval", () => {
		useVaultStore.setState({
			isConfigured: true,
			isUnlocked: true,
			activePin: "1234",
			keys: { anthropic: "secret-key" },
		});

		expect(getActiveAnthropicKey()).toBe("secret-key");

		// Lock
		useVaultStore.getState().lock();

		expect(useVaultStore.getState().isUnlocked).toBe(false);
		expect(useVaultStore.getState().keys.anthropic).toBeUndefined();
		expect(getActiveAnthropicKey()).toBe("");
	});
});
