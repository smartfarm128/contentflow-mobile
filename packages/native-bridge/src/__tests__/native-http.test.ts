import { afterEach, describe, expect, test } from "bun:test";
import {
	nativeHttpRequest,
	NativeHttpError,
	responseFromNativeHttp,
	transportFailureKind,
	type NativeHttpTransport,
} from "../native-http";

const ORIGINAL_FETCH = globalThis.fetch;

afterEach(() => {
	globalThis.fetch = ORIGINAL_FETCH;
});

describe("native HTTP", () => {
	test("a browser request uses fetch and keeps the JSON body", async () => {
		const seen: Array<{ url: string; method: string; body: string }> = [];
		// eslint-disable-next-line opencut/prefer-object-params -- stand-in for global fetch
		const fetchMock = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
			seen.push({
				url: String(input),
				method: init?.method ?? "",
				body: typeof init?.body === "string" ? init.body : "",
			});
			return new Response(JSON.stringify({ ok: true }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			});
		};
		globalThis.fetch = Object.assign(fetchMock, { preconnect: ORIGINAL_FETCH.preconnect });

		const response = await nativeHttpRequest({
			url: "https://integrate.api.nvidia.com/v1/chat/completions",
			method: "POST",
			headers: { Authorization: "Bearer nvapi-test", "Content-Type": "application/json" },
			body: "{\"model\":\"nvidia/nemotron-3-ultra-550b-a55b\"}",
			timeoutMs: 180_000,
		});
		const data: unknown = await response.json();
		expect(response.status).toBe(200);
		expect(data).toEqual({ ok: true });
		expect(seen).toEqual([
			{
				url: "https://integrate.api.nvidia.com/v1/chat/completions",
				method: "POST",
				body: "{\"model\":\"nvidia/nemotron-3-ultra-550b-a55b\"}",
			},
		]);
	});

	test("a native transport receives the 180s budget and returns parsed JSON as text", async () => {
		const calls: Array<{ connectTimeout: number; readTimeout: number; data?: string }> = [];
		const transport: NativeHttpTransport = async (options) => {
			calls.push({
				connectTimeout: options.connectTimeout,
				readTimeout: options.readTimeout,
				data: options.data,
			});
			return {
				status: 200,
				data: { choices: [{ message: { content: "ready" } }] },
				headers: { "content-type": "application/json" },
			};
		};

		const response = await nativeHttpRequest({
			url: "https://integrate.api.nvidia.com/v1/chat/completions",
			method: "POST",
			body: "{\"ping\":1}",
			timeoutMs: 180_000,
			transport,
		});
		expect(calls).toEqual([{ connectTimeout: 180_000, readTimeout: 180_000, data: "{\"ping\":1}" }]);
		expect(await response.json()).toEqual({ choices: [{ message: { content: "ready" } }] });
	});

	test("a URLSession timeout is a timeout, and Load failed is a network error", async () => {
		const timeoutTransport: NativeHttpTransport = async () => {
			throw new Error("The request timed out.");
		};
		await expect(
			nativeHttpRequest({
				url: "https://integrate.api.nvidia.com/v1/models",
				timeoutMs: 180_000,
				transport: timeoutTransport,
			}),
		).rejects.toMatchObject({ name: "NativeHttpError", kind: "timeout" });

		const corsTransport: NativeHttpTransport = async () => {
			throw new TypeError("Load failed");
		};
		try {
			await nativeHttpRequest({
				url: "https://integrate.api.nvidia.com/v1/models",
				timeoutMs: 180_000,
				transport: corsTransport,
			});
			throw new Error("expected a network error");
		} catch (error) {
			expect(error).toBeInstanceOf(NativeHttpError);
			if (error instanceof NativeHttpError) {
				expect(error.kind).toBe("network");
				expect(error.message).toContain("Load failed");
			}
		}
	});

	test("status 0 from the native client is a network failure, not an HTTP status", async () => {
		const transport: NativeHttpTransport = async () => ({
			status: 0,
			data: "",
			headers: {},
		});
		await expect(
			nativeHttpRequest({
				url: "https://integrate.api.nvidia.com/v1/models",
				timeoutMs: 1_000,
				transport,
			}),
		).rejects.toMatchObject({ kind: "network" });
	});

	test("a native JSON object round-trips through Response.json", async () => {
		const response = responseFromNativeHttp({
			status: 403,
			data: { detail: "Authorization failed" },
			headers: { "content-type": "application/json" },
		});
		expect(response.ok).toBe(false);
		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({ detail: "Authorization failed" });
	});

	test("classifies the three transport shapes", () => {
		expect(transportFailureKind(new TypeError("Load failed"))).toBe("network");
		expect(transportFailureKind(new Error("The request timed out."))).toBe("timeout");
		expect(transportFailureKind(new Error("NVIDIA API 500"))).toBe(null);
	});
});
