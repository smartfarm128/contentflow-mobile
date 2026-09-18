/**
 * ContentFlow Mobile — Hardened Web Crypto API Vault Engine.
 *
 * Provides AES-256-GCM encryption at rest for sensitive provider API keys
 * (Anthropic, ElevenLabs, Pexels), with keys derived from a user-chosen
 * 4-digit PIN via PBKDF2 (SHA-256, 100,000 iterations).
 *
 * 100% offline, zero npm dependencies, using standard window.crypto.subtle.
 */

export const VAULT_STORAGE_KEY = "cf_vault_data";
const PBKDF2_ITERATIONS = 100_000;

export interface VaultKeys {
	anthropic?: string;
	elevenlabs?: string;
	pexels?: string;
}

export interface StoredVaultPayload {
	version: number;
	salt: string; // Base64 (16 bytes)
	iv: string; // Base64 (12 bytes)
	ciphertext: string; // Base64 (ciphertext + 128-bit GCM auth tag)
}

const memoryStorage: Storage = (() => {
	const map = new Map<string, string>();
	return {
		get length() {
			return map.size;
		},
		clear: () => map.clear(),
		getItem: (key: string) => map.get(key) ?? null,
		key: (index: number) => Array.from(map.keys())[index] ?? null,
		removeItem: (key: string) => void map.delete(key),
		setItem: (key: string, value: string) => void map.set(key, value),
	};
})();

export function getVaultStorage(): Storage {
	if (typeof localStorage !== "undefined") return localStorage;
	return memoryStorage;
}

function bufferToBase64(buf: ArrayBuffer | Uint8Array): string {
	const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
	let binary = "";
	for (let i = 0; i < bytes.byteLength; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

function base64ToBuffer(b64: string): Uint8Array {
	const binary = atob(b64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

async function deriveAesKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
	const pinBuffer = new TextEncoder().encode(pin);
	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		pinBuffer,
		"PBKDF2",
		false,
		["deriveKey"],
	);

	return await crypto.subtle.deriveKey(
		{
			name: "PBKDF2",
			salt: salt as unknown as BufferSource,
			iterations: PBKDF2_ITERATIONS,
			hash: "SHA-256",
		},
		keyMaterial,
		{ name: "AES-GCM", length: 256 },
		false,
		["encrypt", "decrypt"],
	);
}

export function isVaultConfigured(): boolean {
	const storage = getVaultStorage();
	const item = storage.getItem(VAULT_STORAGE_KEY);
	return Boolean(item && item.trim().length > 0);
}

export async function encryptAndSaveVault(pin: string, keys: VaultKeys): Promise<void> {
	if (!/^\d{4}$/.test(pin)) {
		throw new Error("PIN must be exactly 4 digits.");
	}

	const salt = crypto.getRandomValues(new Uint8Array(16));
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const aesKey = await deriveAesKey(pin, salt);

	const plaintext = new TextEncoder().encode(JSON.stringify(keys));
	const ciphertextBuffer = await crypto.subtle.encrypt(
		{ name: "AES-GCM", iv },
		aesKey,
		plaintext,
	);

	const payload: StoredVaultPayload = {
		version: 1,
		salt: bufferToBase64(salt),
		iv: bufferToBase64(iv),
		ciphertext: bufferToBase64(ciphertextBuffer),
	};

	getVaultStorage().setItem(VAULT_STORAGE_KEY, JSON.stringify(payload));
}

export async function unlockVault(pin: string): Promise<VaultKeys> {
	const raw = getVaultStorage().getItem(VAULT_STORAGE_KEY);
	if (!raw) {
		throw new Error("Vault is not configured");
	}

	let payload: StoredVaultPayload;
	try {
		payload = JSON.parse(raw);
	} catch {
		throw new Error("Corrupted vault data");
	}

	const salt = base64ToBuffer(payload.salt);
	const iv = base64ToBuffer(payload.iv);
	const ciphertext = base64ToBuffer(payload.ciphertext);

	const aesKey = await deriveAesKey(pin, salt);

	try {
		const decryptedBuffer = await crypto.subtle.decrypt(
			{ name: "AES-GCM", iv: iv as unknown as BufferSource },
			aesKey,
			ciphertext as unknown as BufferSource,
		);
		const jsonString = new TextDecoder().decode(decryptedBuffer);
		return JSON.parse(jsonString) as VaultKeys;
	} catch {
		// AES-GCM tag verification fails automatically on incorrect key
		throw new Error("Incorrect PIN");
	}
}

export function resetVaultStorage(): void {
	getVaultStorage().removeItem(VAULT_STORAGE_KEY);
}
