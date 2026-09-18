/**
 * ContentFlow Mobile — In-Memory Key Vault Store & Consumer Bridge.
 *
 * Keeps decrypted keys in memory only while unlocked.
 * Automatically clears decrypted keys after 60s idle timeout or on lock().
 * Handles seamless one-way migration of legacy plaintext localStorage keys.
 */
import { create } from "zustand";
import {
	encryptAndSaveVault,
	unlockVault,
	isVaultConfigured,
	getVaultStorage,
	type VaultKeys,
} from "./crypto-vault";

export const LEGACY_KEY_ANTHROPIC = "cf_anthropic_api_key";
export const LEGACY_KEY_ELEVENLABS = "cf_elevenlabs_api_key";
export const LEGACY_KEY_PEXELS = "cf_pexels_api_key";

const DEFAULT_AUTO_LOCK_MS = 60_000;

interface VaultStoreState {
	isConfigured: boolean;
	isUnlocked: boolean;
	keys: VaultKeys;
	activePin: string | null;
	error: string | null;
	autoLockTimer: ReturnType<typeof setTimeout> | null;

	checkConfigured: () => boolean;
	setupVault: (pin: string, initialKeys?: VaultKeys) => Promise<boolean>;
	unlock: (pin: string) => Promise<boolean>;
	lock: () => void;
	updateKeys: (keys: VaultKeys) => Promise<boolean>;
	changePin: (oldPin: string, newPin: string) => Promise<boolean>;
	touchActivity: () => void;
	clearError: () => void;
}

export function readLegacyPlaintextKeys(): VaultKeys {
	const storage = getVaultStorage();
	return {
		anthropic: storage.getItem(LEGACY_KEY_ANTHROPIC) ?? "",
		elevenlabs: storage.getItem(LEGACY_KEY_ELEVENLABS) ?? "",
		pexels: storage.getItem(LEGACY_KEY_PEXELS) ?? "",
	};
}

export function eraseLegacyPlaintextKeys(): void {
	const storage = getVaultStorage();
	storage.removeItem(LEGACY_KEY_ANTHROPIC);
	storage.removeItem(LEGACY_KEY_ELEVENLABS);
	storage.removeItem(LEGACY_KEY_PEXELS);
}

export function hasLegacyPlaintextKeys(): boolean {
	const legacy = readLegacyPlaintextKeys();
	return Boolean(
		(legacy.anthropic && legacy.anthropic.trim().length > 0) ||
		(legacy.elevenlabs && legacy.elevenlabs.trim().length > 0) ||
		(legacy.pexels && legacy.pexels.trim().length > 0),
	);
}

export const useVaultStore = create<VaultStoreState>()((set, get) => ({
	isConfigured: isVaultConfigured(),
	isUnlocked: false,
	keys: {},
	activePin: null,
	error: null,
	autoLockTimer: null,

	checkConfigured: () => {
		const configured = isVaultConfigured();
		set({ isConfigured: configured });
		return configured;
	},

	setupVault: async (pin: string, initialKeys?: VaultKeys) => {
		try {
			// Pull legacy plaintext keys if any exist and merge with provided keys
			const legacy = readLegacyPlaintextKeys();
			const merged: VaultKeys = {
				anthropic: initialKeys?.anthropic ?? legacy.anthropic ?? "",
				elevenlabs: initialKeys?.elevenlabs ?? legacy.elevenlabs ?? "",
				pexels: initialKeys?.pexels ?? legacy.pexels ?? "",
			};

			await encryptAndSaveVault(pin, merged);
			eraseLegacyPlaintextKeys();

			set({
				isConfigured: true,
				isUnlocked: true,
				keys: merged,
				activePin: pin,
				error: null,
			});
			get().touchActivity();
			return true;
		} catch (err) {
			set({ error: err instanceof Error ? err.message : String(err) });
			return false;
		}
	},

	unlock: async (pin: string) => {
		try {
			const keys = await unlockVault(pin);
			set({
				isUnlocked: true,
				keys,
				activePin: pin,
				error: null,
			});
			get().touchActivity();
			return true;
		} catch (err) {
			set({ error: err instanceof Error ? err.message : String(err) });
			return false;
		}
	},

	lock: () => {
		const timer = get().autoLockTimer;
		if (timer) clearTimeout(timer);
		set({
			isUnlocked: false,
			keys: {},
			activePin: null,
			autoLockTimer: null,
		});
	},

	updateKeys: async (updatedKeys: VaultKeys) => {
		const pin = get().activePin;
		if (!pin) {
			set({ error: "Vault must be unlocked to update keys." });
			return false;
		}
		try {
			await encryptAndSaveVault(pin, updatedKeys);
			set({ keys: updatedKeys, error: null });
			get().touchActivity();
			return true;
		} catch (err) {
			set({ error: err instanceof Error ? err.message : String(err) });
			return false;
		}
	},

	changePin: async (oldPin: string, newPin: string) => {
		try {
			const keys = await unlockVault(oldPin);
			await encryptAndSaveVault(newPin, keys);
			set({
				activePin: newPin,
				keys,
				error: null,
			});
			get().touchActivity();
			return true;
		} catch (err) {
			set({ error: err instanceof Error ? err.message : String(err) });
			return false;
		}
	},

	touchActivity: () => {
		const oldTimer = get().autoLockTimer;
		if (oldTimer) clearTimeout(oldTimer);

		const timer = setTimeout(() => {
			get().lock();
		}, DEFAULT_AUTO_LOCK_MS);

		set({ autoLockTimer: timer });
	},

	clearError: () => set({ error: null }),
}));

// ──────────────── Consumer Bridges ────────────────
// External subsystems call these helpers to read the active key seamlessly:

export function getActiveAnthropicKey(): string {
	const vault = useVaultStore.getState();
	if (vault.isConfigured) {
		return vault.keys.anthropic ?? "";
	}
	return getVaultStorage().getItem(LEGACY_KEY_ANTHROPIC) ?? "";
}

export function getActiveElevenLabsKey(): string {
	const vault = useVaultStore.getState();
	if (vault.isConfigured) {
		return vault.keys.elevenlabs ?? "";
	}
	return getVaultStorage().getItem(LEGACY_KEY_ELEVENLABS) ?? "";
}

export function getActivePexelsKey(): string {
	const vault = useVaultStore.getState();
	if (vault.isConfigured) {
		return vault.keys.pexels ?? "";
	}
	return getVaultStorage().getItem(LEGACY_KEY_PEXELS) ?? "";
}
