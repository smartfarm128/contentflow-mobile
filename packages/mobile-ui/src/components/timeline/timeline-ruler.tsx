import React, { useMemo, useRef, useCallback } from "react";
import { rulerTickIntervalSec, rulerTicks, formatRulerTimecode } from "../../timeline/ruler";
import { timeToPixels, pixelsToTime } from "../../timeline/time-scale";

export function TimelineRuler({
	durationSec,
	pixelsPerSecond,
	onSeek,
	onScrubBy,
}: {
	durationSec: number;
	pixelsPerSecond: number;
	onSeek?: (params: { timeSec: number }) => void;
	onScrubBy?: (params: { deltaPx: number }) => void;
}) {
	const intervalSec = rulerTickIntervalSec({ pixelsPerSecond });
	const ticks = useMemo(
		() => rulerTicks({ durationSec, intervalSec }),
		[durationSec, intervalSec],
	);

	const dragRef = useRef<{ pointerId: number; lastX: number; moved: boolean } | null>(null);

	const handlePointerDown = useCallback(
		(event: React.PointerEvent<HTMLDivElement>) => {
			event.stopPropagation();
			const target = event.currentTarget;
			try {
				target.setPointerCapture(event.pointerId);
			} catch {}

			dragRef.current = {
				pointerId: event.pointerId,
				lastX: event.clientX,
				moved: false,
			};

			const rect = target.getBoundingClientRect();
			const clickX = event.clientX - rect.left;
			const timeSec = Math.max(0, Math.min(durationSec, pixelsToTime({ px: clickX, pixelsPerSecond })));
			onSeek?.({ timeSec });
		},
		[durationSec, pixelsPerSecond, onSeek],
	);

	const handlePointerMove = useCallback(
		(event: React.PointerEvent<HTMLDivElement>) => {
			const drag = dragRef.current;
			if (!drag || drag.pointerId !== event.pointerId) return;

			const deltaX = event.clientX - drag.lastX;
			if (Math.abs(deltaX) > 1) {
				drag.moved = true;
				drag.lastX = event.clientX;
				onScrubBy?.({ deltaPx: deltaX });
			}
		},
		[onScrubBy],
	);

	const handlePointerEnd = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
		const drag = dragRef.current;
		if (!drag || drag.pointerId !== event.pointerId) return;
		dragRef.current = null;
		try {
			event.currentTarget.releasePointerCapture(event.pointerId);
		} catch {}
	}, []);

	return (
		<div
			className="cc-timeline__ruler"
			style={{
				width: timeToPixels({ timeSec: durationSec, pixelsPerSecond }),
				cursor: "ew-resize",
				pointerEvents: "auto",
			}}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerEnd}
			onPointerCancel={handlePointerEnd}
			role="slider"
			aria-label="Timeline ruler"
			aria-valuemin={0}
			aria-valuemax={durationSec}
		>
			{ticks.map((tickSec) => {
				const leftPx = timeToPixels({ timeSec: tickSec, pixelsPerSecond });
				return (
					<div
						key={tickSec}
						className="cc-timeline__ruler-tick"
						style={{ left: leftPx, pointerEvents: "none" }}
					>
						<span className="cc-timeline__ruler-label">
							{formatRulerTimecode({ timeSec: tickSec })}
						</span>
					</div>
				);
			})}
		</div>
	);
}
