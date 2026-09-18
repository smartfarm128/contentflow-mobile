import React, { useState } from "react";
import { PanelSheet } from "../panel-sheet";
import { SheetHeader } from "../sheet-header";
import { SegmentedControl } from "../segmented-control";
import type { EditorCore } from "@kneecap/editor-core";
import {
	searchPexelsVideos,
	searchPexelsPhotos,
	importPexelsMediaToTimeline,
	getPexelsApiKey,
	setPexelsApiKey,
	type PexelsMediaItem,
} from "../../editor/stock-media-actions";
import { Film, Image as ImageIcon, Plus, Loader2, Key, Lock } from "lucide-react";
import { CC_ICON_STROKE } from "../../tokens";
import { useVaultStore } from "../../vault/vault-store";

interface StockMediaPanelProps {
	editor: EditorCore;
	currentTimeSeconds: number;
	onClose: () => void;
	/** Opens the encrypted Key Vault — the ONLY place an API key is entered. */
	onOpenVault?: () => void;
}

export function StockMediaPanel({ editor, currentTimeSeconds, onClose, onOpenVault }: StockMediaPanelProps) {
	const [tab, setTab] = useState<string>("video");
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<PexelsMediaItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [addingId, setAddingId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const vaultConfigured = useVaultStore((s) => s.isConfigured);
	const vaultUnlocked = useVaultStore((s) => s.isUnlocked);
	const vaultPexelsKey = useVaultStore((s) => s.keys.pexels);
	const hasKey = Boolean(getPexelsApiKey() || (vaultUnlocked && vaultPexelsKey));
	const apiKey = getPexelsApiKey();

	const handleSearch = async (overrideQuery?: string) => {
		const q = (overrideQuery ?? query).trim();
		if (!q || loading) return;
		setLoading(true);
		setError(null);
		setResults([]);

		try {
			const items =
				tab === "video"
					? await searchPexelsVideos({ query: q, apiKey: apiKey.trim() })
					: await searchPexelsPhotos({ query: q, apiKey: apiKey.trim() });
			setResults(items);
			if (items.length === 0) {
				setError(`No ${tab}s found for "${q}". Try another search.`);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Search failed");
		} finally {
			setLoading(false);
		}
	};

	const handleAdd = async (item: PexelsMediaItem) => {
		if (addingId) return;
		setAddingId(item.id);
		try {
			await importPexelsMediaToTimeline({
				editor,
				downloadUrl: item.downloadUrl,
				name: item.title,
				type: item.type,
				durationSec: item.durationSec,
				startSeconds: currentTimeSeconds,
			});
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to add media");
		} finally {
			setAddingId(null);
		}
	};

	const mediaTabs = [
		{ id: "video", label: "Stock Videos" },
		{ id: "image", label: "Stock Photos" },
	];

	return (
		<PanelSheet
			onScrimClick={onClose}
			header={
				<SheetHeader
					searchPlaceholder={`Search ${tab === "video" ? "videos (coffee, city, tech…)" : "photos…"}`}
					onSearchChange={(v) => setQuery(v)}
					onConfirm={() => handleSearch()}
					onClose={onClose}
				/>
			}
		>
			<div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
				{/* Top bar: Type Switcher + API Key Toggle */}
				<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
					<div style={{ flex: 1 }}>
						<SegmentedControl
							segments={mediaTabs}
							activeId={tab}
							onSelect={(id) => {
								setTab(id);
								setResults([]);
							}}
							aria-label="Stock media type"
						/>
					</div>
<button
						type="button"
						onClick={onOpenVault}
						style={{
							background: hasKey ? "rgba(245, 158, 11, 0.15)" : "rgba(255, 255, 255, 0.08)",
							color: hasKey ? "#f59e0b" : "var(--cc-text-primary)",
							border: "none",
							borderRadius: "8px",
							padding: "6px 10px",
							fontSize: "11px",
							fontWeight: 600,
							display: "flex",
							alignItems: "center",
							gap: "4px",
							cursor: "pointer",
							flexShrink: 0,
						}}
					>
						<Lock size={12} strokeWidth={CC_ICON_STROKE} />
						<span>{hasKey ? "Pexels Active" : "Add Key in Vault"}</span>
					</button>
				</div>

				{error && <p style={{ fontSize: "12px", color: "#ffaa00", margin: "4px 0" }}>{error}</p>}
				{loading && (
					<div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "20px 0" }}>
						<Loader2 size={16} className="animate-spin text-[#00cae0]" />
						<span style={{ fontSize: "12px", color: "var(--cc-text-secondary)" }}>Searching Pexels…</span>
					</div>
				)}

				{/* 2-Column CapCut Thumbnail Grid */}
				<div className="cc-motion-grid" style={{ paddingTop: 0, maxHeight: "360px", overflowY: "auto" }}>
					{results.map((item) => (
						<div
							key={item.id}
							className="cc-motion-card"
							style={{ minHeight: "auto", padding: 0, overflow: "hidden" }}
						>
							<div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9" }}>
								<img
									src={item.thumbnailUrl}
									alt={item.title}
									style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
								/>
								{item.durationSec && (
									<span
										style={{
											position: "absolute",
											bottom: "6px",
											right: "6px",
											fontSize: "10px",
											fontWeight: 600,
											background: "rgba(0,0,0,0.75)",
											color: "#fff",
											padding: "2px 5px",
											borderRadius: "4px",
											fontVariantNumeric: "tabular-nums",
										}}
									>
										{item.durationSec}s
									</span>
								)}
							</div>
							<div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: "6px" }}>
								<span
									style={{
										fontSize: "11px",
										color: "var(--cc-text-secondary)",
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
									}}
								>
									{item.author ? `by ${item.author}` : item.title}
								</span>
								<button
									type="button"
									onClick={() => handleAdd(item)}
									disabled={addingId === item.id}
									className="cc-motion-card__btn"
								>
									{addingId === item.id ? (
										<Loader2 size={12} className="animate-spin" />
									) : (
										<Plus size={12} strokeWidth={CC_ICON_STROKE} />
									)}
									<span>{addingId === item.id ? "Adding…" : "Add B-Roll"}</span>
								</button>
							</div>
						</div>
					))}
				</div>
			</div>
		</PanelSheet>
	);
}
