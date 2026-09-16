import React from "react";

/**
 * Fixed, centered playhead (corpus 05 §1a). Positioned entirely by CSS
 * (`.cc-timeline__playhead`, `left: 50%`) — it never moves horizontally;
 * timeline-view.tsx moves the SCROLL CONTENT instead so the time under this
 * line stays `currentTimeSec`.
 *
 * Includes a top handle positioned over the ruler for tactile dragging/seeking.
 */
export function TimelinePlayhead({
	onPointerDown,
}: {
	onPointerDown?: (event: React.PointerEvent) => void;
}) {
	return (
		<div
			className="cc-timeline__playhead"
			onPointerDown={onPointerDown}
			aria-label="Timeline playhead"
		>
			<div className="cc-timeline__playhead-handle" />
		</div>
	);
}
