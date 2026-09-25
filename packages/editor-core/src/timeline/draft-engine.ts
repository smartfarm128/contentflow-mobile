/**
 * In-Memory Draft Engine for Human + AI Co-Editing.
 *
 * Inspired by OpenChatCut's makeDraft pattern:
 * Allows the AI Director (or preview operations) to execute edits against an
 * isolated, in-memory clone of SceneTracks WITHOUT mutating the live timeline.
 *
 * Once the user reviews and approves the proposal, all changes are committed
 * atomically to the live editor in a single TracksSnapshotCommand (1 undo step).
 *
 * Because full element metadata and source ranges are preserved, the human
 * retains 100% control after approval:
 * - 1-tap Undo reverts the entire proposal
 * - Any cut clip can be un-trimmed to restore footage
 * - Any placed title or motion graphic can be moved, resized, or deleted.
 */

import type { EditorCore } from "@/core";
import { TracksSnapshotCommand } from "@/commands/timeline/tracks-snapshot";
import type { SceneTracks, TimelineElement } from "./types";
import { calculateTotalDuration } from "./index";

export interface DraftDiff {
	addedElementIds: string[];
	removedElementIds: string[];
	modifiedElementIds: string[];
	totalDurationDeltaTicks: number;
}

export interface DraftProposal {
	id: string;
	title: string;
	summary: string;
	beforeTracks: SceneTracks;
	afterTracks: SceneTracks;
	diff: DraftDiff;
	commitCommand: TracksSnapshotCommand;
}

function cloneTracks(tracks: SceneTracks): SceneTracks {
	return JSON.parse(JSON.stringify(tracks));
}

function collectElementMap(tracks: SceneTracks): Map<string, TimelineElement> {
	const map = new Map<string, TimelineElement>();
	for (const el of tracks.main.elements) {
		map.set(el.id, el);
	}
	for (const track of tracks.overlay) {
		for (const el of track.elements) {
			map.set(el.id, el);
		}
	}
	for (const track of tracks.audio) {
		for (const el of track.elements) {
			map.set(el.id, el);
		}
	}
	return map;
}

export class DraftEngine {
	private baseTracks: SceneTracks;
	private currentTracks: SceneTracks;

	constructor(baseTracks: SceneTracks) {
		this.baseTracks = cloneTracks(baseTracks);
		this.currentTracks = cloneTracks(baseTracks);
	}

	getTracks(): SceneTracks {
		return this.currentTracks;
	}

	updateTracks(newTracks: SceneTracks): void {
		this.currentTracks = cloneTracks(newTracks);
	}

	computeDiff(): DraftDiff {
		const beforeMap = collectElementMap(this.baseTracks);
		const afterMap = collectElementMap(this.currentTracks);

		const addedElementIds: string[] = [];
		const removedElementIds: string[] = [];
		const modifiedElementIds: string[] = [];

		for (const [id, afterEl] of afterMap.entries()) {
			const beforeEl = beforeMap.get(id);
			if (!beforeEl) {
				addedElementIds.push(id);
			} else {
				if (
					beforeEl.startTime !== afterEl.startTime ||
					beforeEl.duration !== afterEl.duration ||
					beforeEl.trimStart !== afterEl.trimStart ||
					beforeEl.trimEnd !== afterEl.trimEnd ||
					JSON.stringify(beforeEl.params) !== JSON.stringify(afterEl.params)
				) {
					modifiedElementIds.push(id);
				}
			}
		}

		for (const id of beforeMap.keys()) {
			if (!afterMap.has(id)) {
				removedElementIds.push(id);
			}
		}

		const beforeDuration = calculateTotalDuration({ tracks: this.baseTracks });
		const afterDuration = calculateTotalDuration({ tracks: this.currentTracks });
		const totalDurationDeltaTicks = afterDuration - beforeDuration;

		return {
			addedElementIds,
			removedElementIds,
			modifiedElementIds,
			totalDurationDeltaTicks,
		};
	}

	createProposal(title: string, summary: string): DraftProposal {
		const diff = this.computeDiff();
		const commitCommand = new TracksSnapshotCommand({
			before: cloneTracks(this.baseTracks),
			after: cloneTracks(this.currentTracks),
		});

		const id =
			typeof crypto !== "undefined" && crypto.randomUUID
				? crypto.randomUUID()
				: `prop-${Date.now()}`;

		return {
			id,
			title,
			summary,
			beforeTracks: cloneTracks(this.baseTracks),
			afterTracks: cloneTracks(this.currentTracks),
			diff,
			commitCommand,
		};
	}

	applyToEditor(editor: EditorCore, proposal?: DraftProposal): void {
		const cmd =
			proposal?.commitCommand ??
			new TracksSnapshotCommand({
				before: cloneTracks(this.baseTracks),
				after: cloneTracks(this.currentTracks),
			});
		editor.command.execute({ command: cmd });
	}
}

export function makeDraft(baseTracks: SceneTracks): DraftEngine {
	return new DraftEngine(baseTracks);
}
