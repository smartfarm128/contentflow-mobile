/**
 * React 19 + @react-three/fiber v8 JSX bridge.
 *
 * R3F v8 augments the LEGACY global `JSX.IntrinsicElements` namespace (see its
 * three-types.d.ts `declare global { namespace JSX { ... } }`). React 19 moved
 * the JSX namespace to `React.JSX`, so TypeScript resolves `<mesh>`,
 * `<planeGeometry>`, `<ambientLight>` etc. against `React.JSX.IntrinsicElements`
 * — which R3F v8 never augments. Result: every three.js intrinsic element in a
 * template errors with TS2339 ("Property 'mesh' does not exist").
 *
 * This re-applies R3F's own `ThreeElements` interface to the namespace React 19
 * actually reads. It adds no new types of its own — it forwards R3F's, so the
 * three.js intrinsics stay exactly as strongly typed as they are upstream, and
 * this file becomes a no-op the moment R3F v9 (React 19 native) lands.
 */
import type { ThreeElements } from "@react-three/fiber";

declare global {
	namespace React {
		namespace JSX {
			interface IntrinsicElements extends ThreeElements {}
		}
	}
}

export {};
