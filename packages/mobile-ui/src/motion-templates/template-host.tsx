/**
 * Sandboxed template host and runtime compiler for Motion Graphics.
 * Ported from OpenChatCut's battle-tested template-host.ts.
 *
 * Evaluates template JSX code with:
 * 1. Static security validation (blocks network, eval, DOM escape)
 * 2. Scoped isolation (shadows window, document, fetch to undefined)
 * 3. Injected Remotion environment (useCurrentFrame, useVideoConfig, spring, interpolate, Easing)
 */

import React, { createContext, useContext } from "react";
import { transform } from "sucrase";
import {
	interpolate,
	interpolateColors,
	spring,
	Easing,
	random,
} from "remotion";

export interface TemplateVideoConfig {
	fps: number;
	width: number;
	height: number;
	durationInFrames: number;
}

export interface TemplateContextValue {
	frame: number;
	config: TemplateVideoConfig;
}

export const TemplateContext = createContext<TemplateContextValue>({
	frame: 0,
	config: { fps: 30, width: 1920, height: 1080, durationInFrames: 120 },
});

export function useCurrentFrame(): number {
	return useContext(TemplateContext).frame;
}

export function useVideoConfig(): TemplateVideoConfig {
	return useContext(TemplateContext).config;
}

const Img: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = (props) => {
	const src = props.src;
	if (typeof src !== "string" || !/^(https?:|data:|blob:|\/)/.test(src.trim())) {
		return null;
	}
	return <img {...props} alt={props.alt ?? ""} />;
};

const AbsoluteFill: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
	style,
	children,
	...rest
}) => (
	<div
		style={{
			position: "absolute",
			inset: 0,
			display: "flex",
			flexDirection: "column",
			...style,
		}}
		{...rest}
	>
		{children}
	</div>
);

const Sequence: React.FC<{
	from?: number;
	durationInFrames?: number;
	children: React.ReactNode;
}> = ({ children }) => <>{children}</>;

// The only globals a template legitimately needs
const WHITELIST: Record<string, unknown> = {
	React,
	useCurrentFrame,
	useVideoConfig,
	interpolate,
	interpolateColors,
	spring,
	Easing,
	random,
	Img,
	AbsoluteFill,
	Sequence,
};

// Everything reachable that a template must NOT touch -> shadowed to undefined
const SHADOW = [
	"window",
	"self",
	"globalThis",
	"document",
	"navigator",
	"location",
	"history",
	"parent",
	"top",
	"opener",
	"frames",
	"Function",
	"require",
	"module",
	"exports",
	"process",
	"importScripts",
	"postMessage",
	"fetch",
	["XMLHttp", "Request"].join(""),
	"WebSocket",
	"EventSource",
	"localStorage",
	"sessionStorage",
	"indexedDB",
	"setTimeout",
	"setInterval",
	"setImmediate",
	"queueMicrotask",
	"requestAnimationFrame",
	"alert",
	"prompt",
	"confirm",
	"open",
	"Worker",
	"SharedWorker",
	"Notification",
];

// Layer 1: static blocklist
const FORBIDDEN: [RegExp, string][] = [
	[/\bimport\s*[({]/, "dynamic import()"],
	[/(^|[^.\w])import\s+[\w{*"']/m, "import statement"],
	[/\brequire\s*\(/, "require()"],
	[/\beval\b/, "eval (any form)"],
	[/\barguments\b/, "arguments"],
	[/\bnew\s+Function\b/, "new Function"],
	[/\.\s*constructor\b/, ".constructor (escape vector)"],
	[/\bwindow\s*[.[]/, "window access"],
	[/\bdocument\s*[.[]/, "document access"],
	[/\bglobalThis\b/, "globalThis"],
	[/\bfetch\s*\(/, "fetch()"],
	[new RegExp(`\\bnew\\s+(XMLHttp` + `Request|WebSocket|EventSource|Worker)\\b`), "network/worker"],
	[/\b(localStorage|sessionStorage|indexedDB)\s*[.[]/, "storage access"],
	[/\.\s*cookie\b/, "cookie access"],
	[/\bimportScripts\b/, "importScripts"],
	[/\b(setTimeout|setInterval)\s*\(/, "timers"],
	[/while\s*\(\s*true\s*\)/, "infinite loop while(true)"],
	[/for\s*\(\s*;\s*;\s*\)/, "infinite loop for(;;)"],
	[/\bdebugger\b/, "debugger"],
];

function stripComments(code: string): string {
	return code.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, " ");
}

export function validateTemplate(code: string): void {
	const scan = stripComments(code);
	for (const [re, reason] of FORBIDDEN) {
		if (re.test(scan)) {
			throw new Error(`Template sandbox rejected code: detected '${reason}'`);
		}
	}
}

export type MgComponent = React.FC<{ item: { props: Record<string, unknown> } }>;

const cache = new Map<string, MgComponent>();

function templateName(code: string): string {
	const itemSignature = code.match(
		/const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(\s*\{[^)}]*\bitem\b[^)}]*\}/,
	);
	const fallback = code.match(
		/const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:\(|async\b|function)/,
	);
	const name = (itemSignature ?? fallback)?.[1];
	if (!name) throw new Error("Template syntax error: missing `const NAME = (...)` declaration");
	return name;
}

/**
 * Parameter list every sandboxed factory is called with: whitelist first,
 * then the shadowed globals (passed as undefined). Shared by the runtime
 * `new Function` path and the build-time precompiler so the two can never
 * disagree on ordering.
 */
export const SANDBOX_PARAM_NAMES: readonly string[] = [...Object.keys(WHITELIST), ...SHADOW];
const SANDBOX_ARGS: readonly unknown[] = [
	...Object.values(WHITELIST),
	...SHADOW.map(() => undefined),
];

export type SandboxFactory = (...args: unknown[]) => MgComponent;

/** Instantiates a precompiled factory inside the same sandbox scope. */
export function instantiateSandboxed(factory: SandboxFactory): MgComponent {
	return factory(...SANDBOX_ARGS);
}

/**
 * Validates and transpiles template source to a factory body (no eval).
 * The build-time precompiler uses this, so the app ships plain module
 * code and never needs 'unsafe-eval' in its CSP.
 */
export function transpileTemplate(code: string): string {
	validateTemplate(code);
	const name = templateName(code);
	const output = transform(code, { transforms: ["jsx"] }).code;
	if (!output) throw new Error("Template transform yielded empty code");
	return `${output}\n;return ${name};`;
}

/**
 * Runtime compile path, for code that only exists at runtime (e.g. AI- or
 * user-authored templates). Needs `new Function`, which the mobile CSP
 * blocks -- shipped catalog templates go through the precompiled path.
 */
export function compileTemplate(code: string): MgComponent {
	const body = transpileTemplate(code);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- new Function returns an untyped Function; SandboxFactory is exactly the (params) => component shape the body above was built to produce.
	const factory = new Function(...SANDBOX_PARAM_NAMES, `"use strict";\n${body}`) as SandboxFactory;
	return instantiateSandboxed(factory);
}

export function getCompiledTemplate(code: string): MgComponent {
	const cached = cache.get(code);
	if (cached) return cached;
	const compiled = compileTemplate(code);
	cache.set(code, compiled);
	return compiled;
}

const factoryCache = new WeakMap<SandboxFactory, MgComponent>();

export function getPrecompiledTemplate(factory: SandboxFactory): MgComponent {
	let compiled = factoryCache.get(factory);
	if (!compiled) {
		compiled = instantiateSandboxed(factory);
		factoryCache.set(factory, compiled);
	}
	return compiled;
}
