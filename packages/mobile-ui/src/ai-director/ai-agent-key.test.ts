import { afterEach, beforeEach, describe, expect, it, jest } from "bun:test";
import { askAIDirector } from "./ai-agent";
import { useAIDirectorStore } from "./ai-store";
import type { ToolContext } from "./ai-executors";
import { resetVaultStorage } from "../vault/crypto-vault";
import {
	eraseLegacyPlaintextKeys,
	getActiveAnthropicKey,
	noteVaultAppVisibility,
	useVaultStore,
	VAULT_IDLE_LOCK_MS,
} from "../vault/vault-store";

/**
 * The vault used to lock 60s after unlock, and the Director re-read the key
 * on every turn, so a run longer than a minute sent `x-api-key: ""`. These
 * tests pin the two halves of the fix: idle is 20 minutes, and one run keeps
 * the key it started with even after the vault locks.
 */

// Unknown-tool turns return before touching the editor. A real EditorCore
// boots IndexedDB, which these cases do not need.
// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-explicit-any -- empty on purpose; see above
const context: ToolContext = { editor: {} as any };

const ORIGINAL_FETCH = globalThis.fetch;

function apiKeyFrom(init: RequestInit | undefined): string {
	const headers = init?.headers;
	if (typeof headers !== "object" || headers === null) return "";
	if (headers instanceof Headers) return headers.get("x-api-key") ?? "";
	if (Array.isArray(headers)) {
		for (const pair of headers) {
			if (pair[0].toLowerCase() === "x-api-key") return String(pair[1]);
		}
		return "";
	}
	return headers["x-api-key"] ?? "";
}

function jsonResponse(body: unknown): Response {
	return new Response(JSON.stringify(body), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
}

function disarmIdleTimer(): void {
	const timer = useVaultStore.getState().autoLockTimer;
	if (timer) clearTimeout(timer);
	useVaultStore.setState({ autoLockTimer: null });
}

beforeEach(() => {
	resetVaultStorage();
	eraseLegacyPlaintextKeys();
	useVaultStore.getState().lock();
	useAIDirectorStore.setState({
		messages: [],
		isStreaming: false,
		pendingPlan: null,
		selectedProvider: "anthropic",
	});
});

afterEach(() => {
	jest.useRealTimers();
	globalThis.fetch = ORIGINAL_FETCH;
	disarmIdleTimer();
	useVaultStore.getState().lock();
});

describe("vault idle lock", () => {
	it("stays unlocked past the old 60s timer and locks after 20 minutes idle", async () => {
		const ok = await useVaultStore.getState().setupVault("2468", { anthropic: "sk-session" });
		expect(ok).toBe(true);
		disarmIdleTimer();
		jest.useFakeTimers();
		useVaultStore.getState().touchActivity();

		jest.advanceTimersByTime(61_000);
		expect(useVaultStore.getState().isUnlocked).toBe(true);
		expect(getActiveAnthropicKey()).toBe("sk-session");

		jest.advanceTimersByTime(VAULT_IDLE_LOCK_MS);
		expect(useVaultStore.getState().isUnlocked).toBe(false);
		expect(getActiveAnthropicKey()).toBe("");
	});

	it("resets the idle window when the session is still in use", async () => {
		await useVaultStore.getState().setupVault("2468", { anthropic: "sk-session" });
		disarmIdleTimer();
		jest.useFakeTimers();
		useVaultStore.getState().touchActivity();

		jest.advanceTimersByTime(VAULT_IDLE_LOCK_MS - 1_000);
		useVaultStore.getState().touchActivity();
		jest.advanceTimersByTime(VAULT_IDLE_LOCK_MS - 1_000);
		expect(useVaultStore.getState().isUnlocked).toBe(true);

		jest.advanceTimersByTime(2_000);
		expect(useVaultStore.getState().isUnlocked).toBe(false);
	});

	it("locks when the app is backgrounded", async () => {
		await useVaultStore.getState().setupVault("2468", { anthropic: "sk-session" });
		expect(useVaultStore.getState().isUnlocked).toBe(true);
		noteVaultAppVisibility({ state: "hidden" });
		expect(useVaultStore.getState().isUnlocked).toBe(false);
		expect(getActiveAnthropicKey()).toBe("");
		noteVaultAppVisibility({ state: "visible" });
		expect(useVaultStore.getState().isUnlocked).toBe(false);
	});
});

describe("Director run key snapshot", () => {
	it("keeps the same key on a turn that happens after 60s and after the vault locks", async () => {
		await useVaultStore.getState().setupVault("2468", { anthropic: "sk-director-run" });
		disarmIdleTimer();
		jest.useFakeTimers();
		useVaultStore.getState().touchActivity();

		const sent: string[] = [];
		globalThis.fetch = async (_input, init) => {
			sent.push(apiKeyFrom(init));
			if (sent.length === 1) {
				// Past the old 60s lock, the vault is still open.
				jest.advanceTimersByTime(61_000);
				expect(useVaultStore.getState().isUnlocked).toBe(true);
				// Then the idle lock fires mid-run. Later turns must not re-read.
				jest.advanceTimersByTime(VAULT_IDLE_LOCK_MS);
				expect(useVaultStore.getState().isUnlocked).toBe(false);
				expect(getActiveAnthropicKey()).toBe("");
				return jsonResponse({
					stop_reason: "tool_use",
					content: [
						{
							type: "tool_use",
							id: "toolu_1",
							name: "definitely_not_a_tool",
							input: {},
						},
					],
				});
			}
			return jsonResponse({
				stop_reason: "end_turn",
				content: [{ type: "text", text: "Finished." }],
			});
		};

		const reply = await askAIDirector("Make a longer cut", context);
		expect(reply).toContain("Finished.");
		expect(sent).toEqual(["sk-director-run", "sk-director-run"]);
		expect(useVaultStore.getState().isUnlocked).toBe(false);
	});
});
