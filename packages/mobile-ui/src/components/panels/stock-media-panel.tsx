import React, { useState } from "react";
import { PanelSheet } from "../panel-sheet";
import { SheetHeader } from "../sheet-header";
import type { EditorCore } from "@kneecap/editor-core";
import {
	searchPexelsVideos,
	searchPexelsPhotos,
	importPexelsMediaToTimeline,
	getPexelsApiKey,
	setPexelsApiKey,
	type PexelsMediaItem,
} from "../../editor/stock-media-actions";
import { Search, Film, Image as ImageIcon, Plus, Loader2, Key } from "lucide-react";

interface StockMediaPanelProps {
	editor: EditorCore;
	currentTimeSeconds: number;
	onClose: () => void;
}

export function StockMediaPanel({ editor, currentTimeSeconds, onClose }: StockMediaPanelProps) {
	const [tab, setTab] = useState<"video" | "image">("video");
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<PexelsMediaItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [addingId, setAddingId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [showKeyInput, setShowKeyInput] = useState(!getPexelsApiKey());
	const [apiKey, setKey] = useState(getPexelsApiKey());

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

	return (
		<PanelSheet onScrimClick={onClose} header={<SheetHeader onClose={onClose} onConfirm={onClose} />}>
			<div className="flex items-center justify-between pb-2 border-b border-[#222]">
				<p className="cc-sheet-title">Stock B-Roll</p>
				<button
					type="button"
					onClick={() => setShowKeyInput(!showKeyInput)}
					className="text-xs text-[#888] hover:text-white flex items-center gap-1"
				>
					<Key size={12} />
					<span>{apiKey ? "API Key Set" : "Add Key"}</span>
				</button>
			</div>

			{showKeyInput && (
				<div className="py-2.5 px-3 mb-2 rounded-xl bg-[#1c1c1c] border border-[#2d2d2d] flex flex-col gap-2">
					<p className="text-[11px] text-[#888]">
						Pexels API Key (Free at <span className="text-[#00f2fe]">pexels.com/api</span>):
					</p>
					<div className="flex items-center gap-2">
						<input
							type="password"
							value={apiKey}
							onChange={(e) => setKey(e.target.value)}
							placeholder="Pexels API Key"
							className="flex-1 h-8 px-2.5 rounded-lg bg-[#111] border border-[#333] text-xs text-white outline-none focus:border-[#00f2fe]"
						/>
						<button
							type="button"
							onClick={() => {
								setPexelsApiKey(apiKey.trim());
								setShowKeyInput(false);
							}}
							className="px-3 h-8 rounded-lg bg-[#00f2fe] text-black text-xs font-semibold"
						>
							Save
						</button>
					</div>
				</div>
			)}

			{/* Tab Switcher: Video vs Photos */}
			<div className="flex items-center py-2 gap-2 border-b border-[#222]">
				<button
					type="button"
					onClick={() => {
						setTab("video");
						setResults([]);
					}}
					className={`flex-1 py-1.5 text-xs font-semibold rounded-full flex items-center justify-center gap-1.5 transition-colors ${
						tab === "video" ? "bg-[#333] text-white" : "text-[#888] hover:text-[#bbb]"
					}`}
				>
					<Film size={12} />
					Videos
				</button>
				<button
					type="button"
					onClick={() => {
						setTab("image");
						setResults([]);
					}}
					className={`flex-1 py-1.5 text-xs font-semibold rounded-full flex items-center justify-center gap-1.5 transition-colors ${
						tab === "image" ? "bg-[#333] text-white" : "text-[#888] hover:text-[#bbb]"
					}`}
				>
					<ImageIcon size={12} />
					Photos
				</button>
			</div>

			{/* Search input */}
			<form
				onSubmit={(e) => {
					e.preventDefault();
					handleSearch();
				}}
				className="flex items-center gap-2 py-2"
			>
				<div className="flex-1 relative">
					<input
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder={`Search ${tab === "video" ? "stock footage" : "photos"} (e.g. coffee, technology, sky)…`}
						className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#1c1c1c] border border-[#2c2c2c] text-xs text-white outline-none focus:border-[#00f2fe]"
					/>
					<Search size={14} className="absolute left-3 top-2.5 text-[#666]" />
				</div>
				<button
					type="submit"
					disabled={loading || !query.trim()}
					className="px-3.5 h-9 rounded-xl bg-[#00f2fe] text-black text-xs font-semibold disabled:opacity-40"
				>
					{loading ? <Loader2 size={14} className="animate-spin" /> : "Search"}
				</button>
			</form>

			{error && <p className="text-[11px] text-amber-300 py-1">{error}</p>}

			{/* Results Grid */}
			<div className="flex-1 overflow-y-auto py-2 grid grid-cols-2 gap-2.5 max-h-[360px]">
				{results.map((item) => (
					<div
						key={item.id}
						className="group relative rounded-xl overflow-hidden bg-[#1a1a1a] border border-[#2a2a2a] flex flex-col"
					>
						<img src={item.thumbnailUrl} alt={item.title} className="w-full h-24 object-cover" />
						<div className="p-2 flex flex-col gap-1 bg-[#141414] flex-1 justify-between">
							<span className="text-[10px] text-[#aaa] truncate">{item.title}</span>
							<button
								type="button"
								onClick={() => handleAdd(item)}
								disabled={addingId === item.id}
								className="w-full py-1.5 rounded-lg bg-[#242424] hover:bg-[#00f2fe] hover:text-black text-white text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
							>
								{addingId === item.id ? (
									<Loader2 size={12} className="animate-spin" />
								) : (
									<Plus size={12} />
								)}
								<span>{addingId === item.id ? "Adding…" : "Add B-Roll"}</span>
							</button>
						</div>
					</div>
				))}
			</div>
		</PanelSheet>
	);
}
