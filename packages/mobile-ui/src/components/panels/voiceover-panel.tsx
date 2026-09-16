import React, { useEffect, useState } from "react";
import { PanelSheet } from "../panel-sheet";
import { SheetHeader } from "../sheet-header";
import { ParamRow } from "../editor/param-row";
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
import { Mic, Loader2, Sparkles, Key, Check } from "lucide-react";
import { CC_ICON_STROKE } from "../../tokens";

interface VoiceoverPanelProps {
	editor: EditorCore;
	currentTimeSeconds: number;
	onClose: () => void;
}

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
		<PanelSheet
			onScrimClick={onClose}
			header={
				<SheetHeader
					title="Voiceover"
					onClose={onClose}
				/>
			}
		>
			<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
				{/* Key entry banner toggle */}
				<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
					<span className="cc-form-label" style={{ margin: 0 }}>Narration Engine</span>
					<button
						type="button"
						onClick={() => setShowKey(!showKey)}
						style={{
							background: showKey ? "var(--cc-accent)" : "rgba(255,255,255,0.08)",
							color: showKey ? "var(--cc-accent-contrast)" : "var(--cc-text-primary)",
							border: "none",
							borderRadius: "8px",
							padding: "4px 8px",
							fontSize: "11px",
							fontWeight: 600,
							display: "flex",
							alignItems: "center",
							gap: "4px",
							cursor: "pointer",
						}}
					>
						<Key size={11} strokeWidth={CC_ICON_STROKE} />
						<span>{elevenKey ? "Premium Active" : "ElevenLabs Key"}</span>
					</button>
				</div>

				{showKey && (
					<div className="cc-settings-drawer" style={{ borderRadius: "12px" }}>
						<p className="cc-panel-note" style={{ padding: 0 }}>
							Device voices are free and offline. For cloned or lifelike AI voices, paste an ElevenLabs API key.
						</p>
						<div style={{ display: "flex", gap: "8px" }}>
							<input
								type="password"
								value={elevenKey}
								onChange={(e) => setElevenKeyState(e.target.value)}
								placeholder="ElevenLabs API key"
								className="cc-text-content-input"
								style={{ flex: 1, height: "36px" }}
							/>
							<button
								type="button"
								onClick={async () => {
									setElevenLabsKey(elevenKey);
									setShowKey(false);
									setVoices(await listAllVoiceOptions());
								}}
								className="cc-panel-cta"
								style={{ margin: 0, width: "auto", minHeight: "36px", padding: "0 16px" }}
							>
								Save
							</button>
						</div>
					</div>
				)}

				{supported === false ? (
					<p className="cc-panel-note">
						Voiceover requires the iOS or Android app. In browser preview, speech cannot be rendered to an audio file for the timeline.
					</p>
				) : (
					<>
						{/* Script textarea */}
						<div>
							<label className="cc-form-label">Script</label>
							<textarea
								value={text}
								onChange={(e) => setText(e.target.value)}
								rows={3}
								placeholder="Type what you want narrated…"
								className="cc-text-content-input"
							/>
						</div>

						{/* Voice selector */}
						{voices.length > 0 && (
							<div>
								<label className="cc-form-label">Voice</label>
								<select
									value={voiceId}
									onChange={(e) => setVoiceId(e.target.value)}
									className="cc-select"
								>
									{voices.some((v) => v.engine === "elevenlabs") && (
										<optgroup label="Premium (ElevenLabs)">
											{voices
												.filter((v) => v.engine === "elevenlabs")
												.map((v) => (
													<option key={v.id} value={v.id}>
														{v.name} (Premium)
													</option>
												))}
										</optgroup>
									)}
									<optgroup label="On device (Free, Offline)">
										{voices
											.filter((v) => v.engine === "device")
											.map((v) => (
												<option key={v.id} value={v.id}>
													{v.name} {v.language ? `· ${v.language}` : ""}
													{v.quality !== "standard" ? ` · ${v.quality}` : ""}
												</option>
											))}
									</optgroup>
								</select>
							</div>
						)}

						{/* Speed slider */}
						<ParamRow
							label="Speed"
							value={Math.round(rate * 100)}
							min={50}
							max={200}
							step={5}
							formatValue={(v) => `${(v / 100).toFixed(2)}x`}
							onChange={(v) => setRate(v / 100)}
						/>

						{error && <p style={{ fontSize: "12px", color: "#ff4b4b", margin: 0 }}>{error}</p>}
						{done && <p style={{ fontSize: "12px", color: "var(--cc-accent)", margin: 0 }}>{done}</p>}

						{/* Generate button */}
						<button
							type="button"
							onClick={handleGenerate}
							disabled={!text.trim() || busy || supported === null}
							className="cc-panel-cta"
							style={{ marginTop: "6px" }}
						>
							{busy ? (
								<>
									<Loader2 size={16} className="animate-spin" />
									<span>Rendering voiceover…</span>
								</>
							) : (
								<>
									<Mic size={16} strokeWidth={CC_ICON_STROKE} />
									<span>Generate voiceover</span>
								</>
							)}
						</button>
					</>
				)}
			</div>
		</PanelSheet>
	);
}
