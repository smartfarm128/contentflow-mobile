/**
 * Offline placeholder imagery for motion-graphic templates.
 *
 * The ported templates shipped with ~480 remote placeholder URLs (Unsplash,
 * CDNs, avatar services) as their default control values. ContentFlow is a
 * local-first mobile editor: on a phone in airplane mode — or just a creator
 * on bad signal — every one of those renders as a broken image inside the
 * user's video. That is a visible defect burned into an export, not a
 * cosmetic one.
 *
 * These generators produce deterministic, self-contained SVG data URIs, so a
 * template's default state always looks intentional offline. Users still swap
 * in their own media through the template's `image` controls; this is only the
 * out-of-the-box value.
 *
 * Palette deliberately matches the app's dark CapCut surface + cyan accent so
 * placeholders read as designed, not as missing assets.
 */

const ACCENT = "#00f2fe";
const SURFACE_A = "#1b1d22";
const SURFACE_B = "#2a2f37";

/** Stable 0..n-1 hash so the same seed always yields the same placeholder. */
function hashIndex(seed: string, n: number): number {
	let h = 0;
	for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
	return h % n;
}

function svgToDataUri(svg: string): string {
	// encodeURIComponent (not base64) keeps these diffable and avoids the
	// ~33% size penalty; data: URIs are same-origin so no CSP change needed.
	return `data:image/svg+xml,${encodeURIComponent(svg.replace(/\s+/g, " ").trim())}`;
}

/** Neutral 16:9-ish image placeholder with a soft diagonal gradient. */
export function placeholderImage(seed = "cf", w = 800, h = 600): string {
	const hues = [188, 210, 265, 330, 25];
	const hue = hues[hashIndex(seed, hues.length)];
	return svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hue} 40% 22%)"/>
      <stop offset="100%" stop-color="${SURFACE_A}"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <circle cx="${w * 0.72}" cy="${h * 0.28}" r="${Math.min(w, h) * 0.18}"
          fill="hsl(${hue} 60% 55%)" opacity="0.20"/>
  <rect x="0" y="${h - 4}" width="${w}" height="4" fill="${ACCENT}" opacity="0.5"/>
</svg>`);
}

/** Circular avatar placeholder — initial glyph on a tinted disc. */
export function placeholderAvatar(seed = "cf", size = 256): string {
	const hues = [188, 210, 265, 330, 25, 150];
	const hue = hues[hashIndex(seed, hues.length)];
	const letter = (seed.trim()[0] ?? "C").toUpperCase();
	return svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${SURFACE_A}"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="hsl(${hue} 45% 32%)"/>
  <text x="50%" y="50%" dy=".35em" text-anchor="middle"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="${size * 0.42}" font-weight="600" fill="hsl(${hue} 70% 88%)">${letter}</text>
</svg>`);
}

/** Wordmark-style logo placeholder for logo-cloud / brand-strip templates. */
export function placeholderLogo(seed = "Brand", w = 240, h = 80): string {
	const label = seed.slice(0, 12) || "Brand";
	return svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" rx="10" fill="${SURFACE_B}"/>
  <circle cx="26" cy="${h / 2}" r="9" fill="${ACCENT}" opacity="0.85"/>
  <text x="46" y="50%" dy=".35em"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="20" font-weight="600" fill="#e8eaed">${label}</text>
</svg>`);
}

/** Square-ish icon tile placeholder (app-dock / icon-grid templates). */
export function placeholderIcon(seed = "cf", size = 128): string {
	const hues = [188, 210, 265, 330, 25, 150];
	const hue = hues[hashIndex(seed, hues.length)];
	return svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="hsl(${hue} 50% 40%)"/>
  <rect x="${size * 0.3}" y="${size * 0.3}" width="${size * 0.4}" height="${size * 0.4}"
        rx="${size * 0.08}" fill="hsl(${hue} 70% 82%)" opacity="0.9"/>
</svg>`);
}
