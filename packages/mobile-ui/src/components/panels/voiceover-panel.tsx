import React, { useEffect, useState } from "react";
import { PanelSheet } from "../panel-sheet";
import { SheetHeader } from "../sheet-header";
import type { EditorCore } from "@kneecap/editor-core";
import {
	generateVoiceover,
	listAllVoiceOptions,
	supportsVoiceover,
	type VoiceOption,
} from "../../editor/voiceover-actions";
import {
	getElevenLabsKey,
	setElevenLabsKey,
} from "../../editor/elevenlabs-voice";
import { Mic, Loader2, Sparkles, Key } from "lucide-react";

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
	const [voices, setVoices] = useState<VoiceOption[]>([]);
	const [elevenKey, setElevenKeyState] = useState(getElevenLabsKey());
	const [showKey, setShowKey] = useState(false);
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
			const list = await listAllVoiceOptions();
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
			const selected = voices.find((v) => v.id === voiceId);
			const res = await generateVoiceover({
				editor,
				text: trimmed,
				voiceId: voiceId || undefined,
				rate,
				startSeconds: currentTimeSeconds,
				engine: selected?.engine ?? "device",
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
				<button
					type="button"
					onClick={() => setShowKey(!showKey)}
					className="text-xs text-[#888] hover:text-white flex items-center gap-1"
				>
					<Key size={12} />
					<span>{elevenKey ? "Premium on" : "Premium voices"}</span>
				</button>
			</div>

			{showKey && (
				<div className="py-2.5 px-3 my-2 rounded-xl bg-[#1c1c1c] border border-[#2d2d2d] flex flex-col gap-2">
					<p className="text-[11px] text-[#888] leading-relaxed">
						Device voices are free and offline, but sound synthetic. For broadcast-quality
						narration (or your own cloned voice), add an ElevenLabs key — renders then spend
						credits on <span className="text-[#00f2fe]">your</span> ElevenLabs account.
					</p>
					<div className="flex items-center gap-2">
						<input
							type="password"
							value={elevenKey}
							onChange={(e) => setElevenKeyState(e.target.value)}
							placeholder="ElevenLabs API key"
							className="flex-1 h-8 px-2.5 rounded-lg bg-[#111] border border-[#333] text-xs text-white outline-none focus:border-[#00f2fe]"
						/>
						<button
							type="button"
							onClick={async () => {
								setElevenLabsKey(elevenKey);
								setShowKey(false);
								setVoices(await listAllVoiceOptions());
							}}
							className="px-3 h-8 rounded-lg bg-[#00f2fe] text-black text-xs font-semibold"
						>
							Save
						</button>
					</div>
				</div>
			)}

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
								{voices.some((v) => v.engine === "elevenlabs") && (
									<optgroup label="Premium (ElevenLabs — uses your credits)">
										{voices
											.filter((v) => v.engine === "elevenlabs")
											.map((v) => (
												<option key={v.id} value={v.id}>
													{v.name}
												</option>
											))}
									</optgroup>
								)}
								<optgroup label="On device (free, offline)">
									{voices
										.filter((v) => v.engine === "device")
										.map((v) => (
											<option key={v.id} value={v.id}>
												{v.name}
												{v.language ? ` · ${v.language}` : ""}
												{v.quality !== "standard" ? ` · ${v.quality}` : ""}
											</option>
										))}
								</optgroup>
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

					{voices.find((v) => v.id === voiceId)?.engine === "elevenlabs" ? (
						<p className="text-[10px] text-[#666] leading-relaxed flex items-start gap-1">
							<Sparkles size={11} className="mt-0.5 shrink-0 text-[#00f2fe]" />
							<span>
								Premium voice — rendered by ElevenLabs over the network and billed to your
								account. The clip lands on an audio track like any other.
							</span>
						</p>
					) : (
						<p className="text-[10px] text-[#666] leading-relaxed">
							Runs on your device — offline, free, no account. The result lands on an audio
							track at the playhead and behaves like any other clip.
						</p>
					)}
				</div>
			)}
		</PanelSheet>
	);
}
