/**
 * Composites HTML motion templates as DOM above the preview canvas.
 *
 * Reads template clips off the ENGINE (`editor.scenes.getActiveScene()`),
 * not the old parallel Zustand store. See engine-bridge.ts for why that
 * changed; the short version is that a store the engine couldn't see meant no
 * timeline row, no selection box, no drag and no export.
 *
 * This layer owns PIXELS only. Timing, placement, transform and selection are
 * the engine's — the same `preview-renderer` gesture system that drives every
 * other element type drives these too, which is why the layer is deliberately
 * `pointerEvents: none`. It used to carry its own `onClick` and nothing else,
 * so a drag was half-owned by two systems and rendered the smeared duplicate
 * the founder screenshotted (2026-09-22).
 */
import React, { useMemo } from "react";
import { useEditor } from "@kneecap/editor-core/react";
import { mediaTimeToSeconds } from "@kneecap/editor-core";
import type { TimelineElement } from "@kneecap/editor-core/timeline";
import {
	buildTransformFromParams,
	readOpacityFromParams,
} from "@kneecap/editor-core/rendering";
import { getHtmlTemplate } from "./registry";
import {
	isHtmlTemplateGraphic,
	registerHtmlTemplateGraphics,
	templateIdFromDefinitionId,
} from "./engine-bridge";
import type { EditingTemplatePrimitive } from "./types";

interface HtmlMotionLayerProps {
	time: number;
	canvasWidth: number;
	canvasHeight: number;
	isPlaying?: boolean;
}

/** A template clip resolved from an engine graphic element. */
interface ActiveTemplateClip {
	id: string;
	templateId: string;
	progress: number;
	values: Record<string, EditingTemplatePrimitive>;
	/** Canvas-space box, already transform-resolved. */
	left: number;
	top: number;
	width: number;
	height: number;
	rotation: number;
	opacity: number;
}

export const HtmlMotionLayer: React.FC<HtmlMotionLayerProps> = ({
	time,
	canvasWidth,
	canvasHeight,
	isPlaying = false,
}) => {
	registerHtmlTemplateGraphics();

	// Selector subscription: re-renders whenever the engine's scene changes,
	// so edits/drags/undo land here without any store of our own.
	const tracks = useEditor((editor) => editor.scenes.getActiveScene().tracks);

	const activeClips = useMemo<ActiveTemplateClip[]>(() => {
		const out: ActiveTemplateClip[] = [];
		const collect = (elements: readonly TimelineElement[]) => {
			for (const element of elements) {
				if (element.type !== "graphic") continue;
				if (!isHtmlTemplateGraphic({ definitionId: element.definitionId })) continue;

				const startSec = mediaTimeToSeconds({ time: element.startTime });
				const durationSec = mediaTimeToSeconds({ time: element.duration });
				if (time < startSec || time >= startSec + durationSec) continue;

				const templateId = templateIdFromDefinitionId({
					definitionId: element.definitionId,
				});
				if (!templateId) continue;

				const transform = buildTransformFromParams({ params: element.params });
				// Engine transform is canvas-centred; the DOM box is top-left
				// anchored, hence the half-size offsets.
				const width = canvasWidth * transform.scaleX;
				const height = canvasHeight * transform.scaleY;

				out.push({
					id: element.id,
					templateId,
					progress:
						durationSec > 0
							? Math.max(0, Math.min(1, (time - startSec) / durationSec))
							: 0,
					values: element.params as Record<string, EditingTemplatePrimitive>,
					left: canvasWidth / 2 + transform.position.x - width / 2,
					top: canvasHeight / 2 + transform.position.y - height / 2,
					width,
					height,
					rotation: transform.rotate,
					opacity: readOpacityFromParams({ params: element.params }),
				});
			}
		};

		for (const track of tracks.overlay) {
			if ("hidden" in track && track.hidden) continue;
			collect(track.elements);
		}
		return out;
	}, [tracks, time, canvasWidth, canvasHeight]);

	if (activeClips.length === 0) return null;

	return (
		<div
			style={{
				position: "absolute",
				inset: 0,
				// NEVER interactive: selection, drag and resize belong to
				// preview-renderer's gesture system, which hit-tests engine
				// element bounds. Taking pointer events here is what left a
				// drag half-owned and smearing.
				pointerEvents: "none",
				overflow: "hidden",
				zIndex: 20,
			}}
			data-playing={isPlaying ? "true" : "false"}
		>
			{activeClips.map((clip) => {
				const template = getHtmlTemplate(clip.templateId);
				if (!template) return null;

				const { Component } = template;
				const mergedValues = {
					...Object.fromEntries(template.controls.map((c) => [c.id, c.defaultValue])),
					...clip.values,
				};

				return (
					<div
						key={clip.id}
						data-html-template-clip={clip.id}
						style={{
							position: "absolute",
							left: `${(clip.left / canvasWidth) * 100}%`,
							top: `${(clip.top / canvasHeight) * 100}%`,
							width: `${(clip.width / canvasWidth) * 100}%`,
							height: `${(clip.height / canvasHeight) * 100}%`,
							transform: clip.rotation ? `rotate(${clip.rotation}deg)` : undefined,
							opacity: clip.opacity,
						}}
					>
						<Component
							progress={clip.progress}
							time={time}
							width={clip.width}
							height={clip.height}
							values={mergedValues}
						/>
					</div>
				);
			})}
		</div>
	);
};
