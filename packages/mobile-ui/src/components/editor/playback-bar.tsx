import { Maximize2, Minimize2, Pause, Play, Redo2, SkipBack, SkipForward, Undo2 } from "lucide-react";
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
	/** True while the preview is expanded to fill the editor. */
	isPreviewFullscreen?: boolean;
	onToggleFullscreen?: () => void;
	className?: string;
}

/**
 * ContentFlow preview control bar (Expo PreviewArea parity):
 * Left: Undo / Redo in 32px card buttons
 * Center: Skip Prev / Play-Pause / Skip Next in 32px card buttons
 * Right: Expand / Fullscreen preview toggle
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
	isPreviewFullscreen = false,
	onToggleFullscreen,
	className,
}: PlaybackBarProps) {
	return (
		<div className={cn("cc-playbackbar", className)}>
			{/* Left: Undo / Redo */}
			<div className="cc-playbackbar__left">
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
			</div>

			{/* Center: Prev / Play-Pause / Next */}
			<div className="cc-playbackbar__center">
				<button
					type="button"
					className="cc-playbackbar__btn"
					onClick={onPrev}
					aria-label="Previous / Restart"
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
					aria-label="Next / End"
				>
					<SkipForward size={16} strokeWidth={CC_ICON_STROKE} />
				</button>
			</div>

			{/* Right: Expand / Fullscreen */}
			<div className="cc-playbackbar__right">
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
