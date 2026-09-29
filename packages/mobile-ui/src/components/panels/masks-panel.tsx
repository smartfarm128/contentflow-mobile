import { PanelSheet } from "../panel-sheet";
import { SheetHeader } from "../sheet-header";
import { ThumbnailGrid } from "../thumbnail-grid";
import { ParamRow, ToggleRow, readNumberParam } from "../editor/param-row";
import type { EditorCore } from "@kneecap/editor-core";
import type { ElementRef, VisualElement } from "@kneecap/editor-core/timeline";
import { getMaskDefinitionsForMenu } from "@kneecap/editor-core/masks";
import {
	getElementMask,
	removeElementMask,
	setElementMask,
	updateElementMaskParam,
} from "../../editor/actions";

interface MasksPanelProps {
	editor: EditorCore;
	elementRef: ElementRef;
	element: VisualElement;
	onClose: () => void;
}

/**
 * Mobile Masks panel — the engine's full mask module (split, cinematic
 * bars, rectangle, ellipse, heart, diamond, star, text; feather/invert/
 * stroke params) was previously reachable only from the web masks-tab.
 * Same one-mask-per-element rule as the web panel; every change is one
 * undoable `UpdateElementsCommand`, and the renderer's scene-builder
 * already composites `element.masks`, so edits are live in the preview.
 *
 * Freeform is deliberately absent from the grid: its point-editing
 * interaction needs on-preview handles that don't exist on mobile yet
 * (and `getMaskDefinitionsForMenu` only returns registered builtins).
 */
export function MasksPanel({ editor, elementRef, element, onClose }: MasksPanelProps) {
	// Re-read on every render: the panel re-renders through useLiveEditor's
	// subscription in the shell whenever a command lands.
	const activeMask = getElementMask({ editor, ref: elementRef });
	const definitions = getMaskDefinitionsForMenu();
	const activeDefinition = activeMask
		? definitions.find((def) => def.type === activeMask.type) ?? null
		: null;
	// element is accepted (and required) so the shell's visual-only gating
	// applies; the mask read itself goes through the engine by ref.
	void element;

	return (
		<PanelSheet onScrimClick={onClose} header={<SheetHeader onClose={onClose} />}>
			<ThumbnailGrid
				items={definitions.map((def) => ({ id: def.type, label: def.name }))}
				selectedId={activeMask?.type ?? null}
				onSelect={(maskType) => {
					if (activeMask?.type === maskType) {
						removeElementMask({ editor, ref: elementRef });
						return;
					}
					// The grid's ids ARE the registry's own definition types, so
					// resolve the definition rather than asserting the string.
					const definition = definitions.find((def) => def.type === maskType);
					if (!definition) return;
					setElementMask({ editor, ref: elementRef, maskType: definition.type });
				}}
			/>
			{activeMask && activeDefinition && (
				<>
					<ToggleRow
						label="Invert"
						active={Boolean(activeMask.params.inverted)}
						onToggle={() =>
							updateElementMaskParam({
								editor,
								ref: elementRef,
								key: "inverted",
								value: !activeMask.params.inverted,
							})
						}
					/>
					{activeDefinition.params.map((param) =>
						param.type === "number" ? (
							<ParamRow
								key={param.key}
								label={param.label}
								value={readNumberParam({
									// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- generic param read: the registry's own ParamDefinition keys index the union's variant-specific params.
									raw: (activeMask.params as unknown as Record<string, unknown>)[param.key],
									fallback: param.default,
								})}
								min={param.min}
								max={param.max ?? 100}
								step={param.step}
								onChange={(value) =>
									updateElementMaskParam({ editor, ref: elementRef, key: param.key, value })
								}
							/>
						) : null,
					)}
				</>
			)}
		</PanelSheet>
	);
}
