import type { OverlayFrame } from "@kneecap/editor-core/export/overlay-frames";
import type { NativeBridge } from "@kneecap/native-bridge";

/**
 * Writes one finished overlay PNG into the native sandbox and returns a
 * frame that names the path. The JS heap keeps the ticks, not the pixels.
 * On the web fallback the frame stays inline — export there is unsupported
 * anyway, and there is no sandbox to write to.
 */
export async function spillOverlayFrame({
	bridge,
	frame,
}: {
	bridge: Pick<NativeBridge, "platform" | "writeOverlayPng">;
	frame: OverlayFrame;
}): Promise<OverlayFrame> {
	if (bridge.platform === "web" || frame.pngBase64.length === 0) return frame;
	const { path } = await bridge.writeOverlayPng({ pngBase64: frame.pngBase64 });
	return {
		startTicks: frame.startTicks,
		endTicks: frame.endTicks,
		pngBase64: "",
		pngPath: path,
	};
}

/** Best-effort delete of sandbox overlay PNGs after the exporter is done. */
export async function clearSpilledOverlayPngs({
	bridge,
}: {
	bridge: Pick<NativeBridge, "platform" | "clearOverlayPngs">;
}): Promise<void> {
	if (bridge.platform === "web") return;
	try {
		await bridge.clearOverlayPngs();
	} catch {
		// An older binary without the method must not hide the export result.
	}
}
