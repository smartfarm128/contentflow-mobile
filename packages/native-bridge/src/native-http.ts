/**
 * HTTP that does not depend on WKWebView CORS.
 *
 * Capacitor's webview origin is `capacitor://localhost`. A host that omits
 * `Access-Control-Allow-Origin` makes `fetch` throw `TypeError: Load failed`
 * before any status code exists, so a bad key and a blocked request look
 * the same. On a native shell this uses `@capacitor/core`'s `CapacitorHttp`,
 * which is URLSession on iOS and HttpURLConnection on Android. In a browser
 * (and in unit tests) it uses `fetch` with the same timeout.
 */
import type { HttpResponse } from "@capacitor/core";

export class NativeHttpError extends Error {
	readonly kind: "timeout" | "network";

	constructor({ kind, detail }: { kind: "timeout" | "network"; detail: string }) {
		super(detail);
		this.name = "NativeHttpError";
		this.kind = kind;
	}
}

export interface NativeHttpResult {
	status: number;
	data: unknown;
	headers: Record<string, string>;
}

export interface NativeHttpTransportOptions {
	url: string;
	method: string;
	headers: Record<string, string>;
	data?: string;
	connectTimeout: number;
	readTimeout: number;
}

export type NativeHttpTransport = (
	options: NativeHttpTransportOptions,
) => Promise<NativeHttpResult>;

let nativePlatform: boolean | null = null;

/** Test-only. The next call re-detects Capacitor. */
export function _resetNativeHttpPlatformForTests(): void {
	nativePlatform = null;
}

function errorDetail(error: unknown): string {
	if (error instanceof Error) return `${error.name}: ${error.message}`;
	if (typeof error === "object" && error !== null && "message" in error) {
		const message = error.message;
		if (typeof message === "string") return message;
	}
	return String(error);
}

/** Timeout first. "aborted" is the web AbortController; "timed out" is URLSession. */
export function transportFailureKind(error: unknown): "timeout" | "network" | null {
	const text = errorDetail(error).toLowerCase();
	if (
		text.includes("timed out") ||
		text.includes("timeout") ||
		text.includes("aborterror") ||
		text.includes("the operation was aborted") ||
		text.includes("aborted")
	) {
		return "timeout";
	}
	if (
		error instanceof TypeError ||
		text.includes("load failed") ||
		text.includes("failed to fetch") ||
		text.includes("networkerror") ||
		text.includes("network request failed") ||
		text.includes("offline") ||
		text.includes("could not connect") ||
		text.includes("network connection") ||
		text.includes("not connected") ||
		text.includes("unable to resolve") ||
		text.includes("unknownhost") ||
		text.includes("hostname") ||
		text.includes("cors") ||
		text.includes("access control") ||
		text.includes("internet connection")
	) {
		return "network";
	}
	return null;
}

function classified(error: unknown): Error {
	const kind = transportFailureKind(error);
	if (kind) return new NativeHttpError({ kind, detail: errorDetail(error) });
	return error instanceof Error ? error : new Error(errorDetail(error));
}

function headerRecord(value: unknown): Record<string, string> {
	if (typeof value !== "object" || value === null) return {};
	const out: Record<string, string> = {};
	for (const [key, item] of Object.entries(value)) {
		if (typeof item === "string") out[key] = item;
	}
	return out;
}

function bodyText(data: unknown): string {
	if (typeof data === "string") return data;
	if (data == null) return "";
	if (typeof data === "number" || typeof data === "boolean") return String(data);
	return JSON.stringify(data);
}

export function responseFromNativeHttp({ status, data, headers }: NativeHttpResult): Response {
	const responseHeaders = new Headers();
	for (const [key, value] of Object.entries(headers)) {
		responseHeaders.set(key, value);
	}
	return new Response(bodyText(data), { status, headers: responseHeaders });
}

async function runningOnNative(): Promise<boolean> {
	if (nativePlatform !== null) return nativePlatform;
	try {
		const { Capacitor } = await import("@capacitor/core");
		nativePlatform = Capacitor.isNativePlatform();
	} catch {
		nativePlatform = false;
	}
	return nativePlatform;
}

async function capacitorTransport(options: NativeHttpTransportOptions): Promise<NativeHttpResult> {
	const { CapacitorHttp } = await import("@capacitor/core");
	const result: HttpResponse = await CapacitorHttp.request({
		url: options.url,
		method: options.method,
		headers: options.headers,
		data: options.data,
		connectTimeout: options.connectTimeout,
		readTimeout: options.readTimeout,
		responseType: "text",
	});
	return {
		status: result.status,
		data: result.data,
		headers: headerRecord(result.headers),
	};
}

/**
 * `timeoutMs` is both the connection cap and the read cap. Capacitor's iOS
 * client uses `connectTimeout` as `URLRequest.timeoutInterval` when it is
 * set, so both fields carry the same budget.
 */
export async function nativeHttpRequest({
	url,
	method = "GET",
	headers = {},
	body,
	timeoutMs,
	transport,
}: {
	url: string;
	method?: string;
	headers?: Record<string, string>;
	body?: string;
	timeoutMs: number;
	/** Tests inject this. Production uses CapacitorHttp on device and fetch in a browser. */
	transport?: NativeHttpTransport;
}): Promise<Response> {
	if (transport || (await runningOnNative())) {
		const send = transport ?? capacitorTransport;
		try {
			const result = await send({
				url,
				method,
				headers,
				data: body,
				connectTimeout: timeoutMs,
				readTimeout: timeoutMs,
			});
			if (result.status < 200 || result.status > 599) {
				throw new NativeHttpError({
					kind: "network",
					detail: `HTTP status ${result.status}`,
				});
			}
			return responseFromNativeHttp(result);
		} catch (error) {
			if (error instanceof NativeHttpError) throw error;
			throw classified(error);
		}
	}

	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		return await fetch(url, {
			method,
			headers,
			body,
			signal: controller.signal,
		});
	} catch (error) {
		if (controller.signal.aborted) {
			throw new NativeHttpError({ kind: "timeout", detail: "The operation was aborted" });
		}
		throw classified(error);
	} finally {
		clearTimeout(timer);
	}
}
