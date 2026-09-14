import React, { useEffect, useState } from "react";
import { PanelSheet } from "../panel-sheet";
import { SheetHeader } from "../sheet-header";
import type { EditorCore } from "@kneecap/editor-core";
import type { SpeechVoice } from "@kneecap/native-bridge";
import {
	generateVoiceover,
	listVoiceoverVoices,
	supportsVoiceover,
} from "../../editor/voiceover-actions";
import { Mic, Loader2 } from "lucide-react";

interface VoiceoverPanelProps {
	editor: EditorCore;
	currentTimeSeconds: number;
	onClose: () => void;
}

/**
 * On-device voiceover. Renders narration with the OS speech synthesizer and
 * drops it on an audio track as a normal clip.
 *
 * Availability is probed up front rather than discovered on failure: in the
 * browser preview there is no way to render speech to a file, and a creator
 * tapping "Generate" only to get an error after typing a paragraph is a worse
 * experience than the control being clearly unavailable with the reason shown.
 */
export function VoiceoverPanel({ editor, currentTimeSeconds, onClose }: VoiceoverPanelProps) {
	const [text, setText] = useState("");
	const [voices, setVoices] = useState<SpeechVoice[]>([]);
	const [voiceId, setVoiceId] = useState<string>("");
	const [rate, setRate] = useState(1);
	const [busy, setBusy] = useState(false);
	const [supported, setSupported] = useState<boolean | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [done, setDone] = useState<string | null>(null);

	useEffect(() => {
		let alive = true;
		void (async () => {
			const ok = await supportsVoiceover();
			if (!alive) return;
			setSupported(ok);
			if (!ok) return;
			const list = await listVoiceoverVoices();
			if (!alive) return;
			setVoices(list);
			if (list.length > 0) setVoiceId(list[0].id);
		})();
		return () => {
			alive = false;
		};
	}, []);

	const handleGenerate = async () => {
		const trimmed = text.trim();
		if (!trimmed || busy) return;
		setBusy(true);
		setError(null);
		setDone(null);
		try {
			const res = await generateVoiceover({
				editor,
				text: trimmed,
				voiceId: voiceId || undefined,
				rate,
				startSeconds: currentTimeSeconds,
			});
			setDone(`Added ${res.durationSec.toFixed(1)}s of narration to an audio track.`);
			setText("");
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setBusy(false);
		}
	};

	return (
		<PanelSheet onScrimClick={onClose} header={<SheetHeader onClose={onClose} onConfirm={onClose} />}>
			<div className="flex items-center justify-between pb-2 border-b border-[#222]">
				<p className="cc-sheet-title">Voiceover</p>
			</div>

			{supported === false ? (
				<p className="cc-panel-note">
					Voiceover needs the iOS or Android app. The browser can play speech but can&apos;t
					render it to a file for the timeline.
				</p>
			) : (
				<div className="flex flex-col gap-3 py-3">
					<textarea
						value={text}
						onChange={(e) => setText(e.target.value)}
						rows={4}
						placeholder="Type what you want narrated…"
						className="w-full p-3 rounded-xl bg-[#1c1c1c] border border-[#2d2d2d] text-xs text-white placeholder-[#555] outline-none focus:border-[#00f2fe] resize-none"
					/>

					{voices.length > 0 && (
						<div className="flex flex-col gap-1">
							<label className="text-[11px] font-medium text-[#888]">Voice</label>
							<select
								value={voiceId}
								onChange={(e) => setVoiceId(e.target.value)}
								className="w-full h-9 px-2 rounded-lg bg-[#141414] border border-[#2d2d2d] text-xs text-white outline-none focus:border-[#00f2fe]"
							>
								{voices.map((v) => (
									<option key={v.id} value={v.id}>
										{v.name} · {v.language}
										{v.quality !== "standard" ? ` · ${v.quality}` : ""}
									</option>
								))}
							</select>
						</div>
					)}

					<div className="flex items-center justify-between text-xs">
						<span className="text-[#888]">Speed</span>
						<input
							type="range"
							min="0.5"
							max="2"
							step="0.05"
							value={rate}
							onChange={(e) => setRate(parseFloat(e.target.value))}
							className="w-40 accent-[#00f2fe]"
						/>
						<span className="text-white w-10 text-right font-mono">{rate.toFixed(2)}x</span>
					</div>

					{error && <p className="text-[11px] text-amber-300">{error}</p>}
					{done && <p className="text-[11px] text-[#00f2fe]">{done}</p>}

					<button
						type="button"
						onClick={handleGenerate}
						disabled={!text.trim() || busy || supported === null}
						className="w-full h-10 rounded-xl bg-[#00f2fe] disabled:opacity-40 text-black text-sm font-semibold flex items-center justify-center gap-2"
					>
						{busy ? <Loader2 size={15} className="animate-spin" /> : <Mic size={15} />}
						{busy ? "Rendering…" : "Generate voiceover"}
					</button>

					<p className="text-[10px] text-[#666] leading-relaxed">
						Runs on your device — offline, free, no account. The result lands on an audio
						track at the playhead and behaves like any other clip.
					</p>
				</div>
			)}
		</PanelSheet>
	);
}
