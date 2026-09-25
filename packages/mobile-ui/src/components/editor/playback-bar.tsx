import { Gauge, Maximize2, Minimize2, Pause, Play, Redo2, SkipBack, SkipForward, Undo2 } from "lucide-react";
import { CC_ICON_STROKE } from "../../tokens";
import { cn } from "../../lib/cn";

interface PlaybackBarProps {
	isPlaying: boolean;
	onPlayPause: () => void;
	onUndo?: () => void;
	onRedo?: () => void;
	onPrev?: () => void;
	onNext?: () => void;
	canUndo?: boolean;
	canRedo?: boolean;
	currentTimeSec?: number;
	durationSec?: number;
	onOpenSpeed?: () => void;
	/** True while the preview is expanded to fill the editor. */
	isPreviewFullscreen?: boolean;
	onToggleFullscreen?: () => void;
	className?: string;
}

/**
 * VN Editor parity transport bar:
 * Left: Timecode readout (e.g. 2.85 / 26.55) or Undo/Redo
 * Center: Skip Prev Cut / Play-Pause / Skip Next Cut
 * Right: Speed/Curve, Undo, Redo, Fullscreen toggle
 */
export function PlaybackBar({
	isPlaying,
	onPlayPause,
	onUndo,
	onRedo,
	onPrev,
	onNext,
	canUndo,
	canRedo,
	currentTimeSec,
	durationSec,
	onOpenSpeed,
	isPreviewFullscreen = false,
	onToggleFullscreen,
	className,
}: PlaybackBarProps) {
	const formatSec = (sec: number) => {
		const total = Math.max(0, sec);
		const m = Math.floor(total / 60);
		const s = (total % 60).toFixed(2);
		return m > 0 ? `${m}:${s.padStart(5, "0")}` : s;
	};

	return (
		<div className={cn("cc-playbackbar", className)}>
			{/* Left: Timecode readout */}
			<div className="cc-playbackbar__left">
				{currentTimeSec !== undefined && durationSec !== undefined ? (
					<span className="cc-playbackbar__timecode">
						{formatSec(currentTimeSec)} / {formatSec(durationSec)}
					</span>
				) : (
					<>
						<button
							type="button"
							className="cc-playbackbar__btn"
							onClick={onUndo}
							disabled={!canUndo}
							aria-label="Undo"
						>
							<Undo2 size={16} strokeWidth={CC_ICON_STROKE} />
						</button>
						<button
							type="button"
							className="cc-playbackbar__btn"
							onClick={onRedo}
							disabled={!canRedo}
							aria-label="Redo"
						>
							<Redo2 size={16} strokeWidth={CC_ICON_STROKE} />
						</button>
					</>
				)}
			</div>

			{/* Center: Prev cut / Play-Pause / Next cut */}
			<div className="cc-playbackbar__center">
				<button
					type="button"
					className="cc-playbackbar__btn"
					onClick={onPrev}
					aria-label="Previous cut"
				>
					<SkipBack size={16} strokeWidth={CC_ICON_STROKE} />
				</button>
				<button
					type="button"
					className="cc-playbackbar__btn cc-playbackbar__btn--play"
					onClick={onPlayPause}
					aria-label={isPlaying ? "Pause" : "Play"}
				>
					{isPlaying ? (
						<Pause size={18} strokeWidth={CC_ICON_STROKE} />
					) : (
						<Play size={18} strokeWidth={CC_ICON_STROKE} />
					)}
				</button>
				<button
					type="button"
					className="cc-playbackbar__btn"
					onClick={onNext}
					aria-label="Next cut"
				>
					<SkipForward size={16} strokeWidth={CC_ICON_STROKE} />
				</button>
			</div>

			{/* Right: Speed, Undo, Redo, Fullscreen */}
			<div className="cc-playbackbar__right">
				{onOpenSpeed && (
					<button
						type="button"
						className="cc-playbackbar__btn"
						onClick={onOpenSpeed}
						aria-label="Speed / Curve"
					>
						<Gauge size={16} strokeWidth={CC_ICON_STROKE} />
					</button>
				)}
				{currentTimeSec !== undefined && (
					<>
						<button
							type="button"
							className="cc-playbackbar__btn"
							onClick={onUndo}
							disabled={!canUndo}
							aria-label="Undo"
						>
							<Undo2 size={16} strokeWidth={CC_ICON_STROKE} />
						</button>
						<button
							type="button"
							className="cc-playbackbar__btn"
							onClick={onRedo}
							disabled={!canRedo}
							aria-label="Redo"
						>
							<Redo2 size={16} strokeWidth={CC_ICON_STROKE} />
						</button>
					</>
				)}
				<button
					type="button"
					className="cc-playbackbar__btn"
					onClick={onToggleFullscreen}
					aria-pressed={isPreviewFullscreen}
					aria-label={isPreviewFullscreen ? "Exit fullscreen preview" : "Fullscreen preview"}
				>
					{isPreviewFullscreen ? (
						<Minimize2 size={16} strokeWidth={CC_ICON_STROKE} />
					) : (
						<Maximize2 size={16} strokeWidth={CC_ICON_STROKE} />
					)}
				</button>
			</div>
		</div>
	);
}
