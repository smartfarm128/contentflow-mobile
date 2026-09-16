import type { ReactNode } from "react";
import { Bookmark, Check, Search, X } from "lucide-react";
import { CC_ICON_STROKE } from "../tokens";
import { cn } from "../lib/cn";
import { TabBar, type TabDef } from "./tab-bar";

export interface SheetHeaderProps {
	/** Sheet title shown prominently on the left when there is no search bar */
	title?: string;
	/** Search row — matches iphone_shots/ip_7.jpg's Effects sheet: a search
	 *  input with a placeholder-as-suggestion pattern ("People are
	 *  searching Zoom lens") plus a checkmark confirm button. Omit for
	 *  sheets that don't have one. */
	searchPlaceholder?: string;
	onSearchChange?: (value: string) => void;
	onConfirm?: () => void;
	/** Close (X) button */
	onClose?: () => void;
	/** Bookmark/saved shortcut — seen to the left of the tab row in
	 *  ip_7.jpg's Effects sheet. */
	showBookmark?: boolean;
	onBookmarkClick?: () => void;
	tabs?: TabDef[];
	activeTabId?: string;
	onTabSelect?: (id: string) => void;
	className?: string;
	children?: ReactNode;
}

export function SheetHeader({
	title,
	searchPlaceholder,
	onSearchChange,
	onConfirm,
	onClose,
	showBookmark,
	onBookmarkClick,
	tabs,
	activeTabId,
	onTabSelect,
	className,
	children,
}: SheetHeaderProps) {
	const hasSearch = searchPlaceholder !== undefined;
	const hasTitleRow = title !== undefined || (!hasSearch && (onClose !== undefined || onConfirm !== undefined));
	const hasTabs = tabs && tabs.length > 0;

	return (
		<div className={cn("cc-sheet-header-group", className)}>
			{/* Title row (or Search row) */}
			{hasSearch ? (
				<div className="cc-sheet-header">
					<label className="cc-sheet-header__search">
						<Search
							size={18}
							strokeWidth={CC_ICON_STROKE}
							color="var(--cc-text-secondary)"
							aria-hidden="true"
						/>
						<input
							type="text"
							placeholder={searchPlaceholder}
							onChange={(e) => onSearchChange?.(e.target.value)}
						/>
					</label>
					{onConfirm && (
						<button
							type="button"
							className="cc-sheet-header__icon-btn cc-sheet-header__icon-btn--confirm"
							onClick={onConfirm}
							aria-label="Confirm"
						>
							<Check size={20} strokeWidth={CC_ICON_STROKE} />
						</button>
					)}
					{onClose && (
						<button
							type="button"
							className="cc-sheet-header__icon-btn"
							onClick={onClose}
							aria-label="Close"
						>
							<X size={20} strokeWidth={CC_ICON_STROKE} />
						</button>
					)}
				</div>
			) : hasTitleRow ? (
				<div className="cc-sheet-header">
					{title && <span className="cc-sheet-title" style={{ margin: 0 }}>{title}</span>}
					<span className="cc-sheet-header__spacer" style={{ flex: 1 }} />
					{onConfirm && (
						<button
							type="button"
							className="cc-sheet-header__icon-btn cc-sheet-header__icon-btn--confirm"
							onClick={onConfirm}
							aria-label="Confirm"
						>
							<Check size={20} strokeWidth={CC_ICON_STROKE} />
						</button>
					)}
					{onClose && (
						<button
							type="button"
							className="cc-sheet-header__icon-btn"
							onClick={onClose}
							aria-label="Close"
						>
							<X size={20} strokeWidth={CC_ICON_STROKE} />
						</button>
					)}
				</div>
			) : null}

			{/* Tab bar row */}
			{hasTabs && (
				<div className="cc-sheet-header" style={{ paddingTop: 0 }}>
					{showBookmark && (
						<button
							type="button"
							className="cc-sheet-header__icon-btn"
							onClick={onBookmarkClick}
							aria-label="Saved"
							style={{ width: "auto", flexShrink: 0 }}
						>
							<Bookmark size={18} strokeWidth={CC_ICON_STROKE} />
						</button>
					)}
					<TabBar
						tabs={tabs}
						activeId={activeTabId ?? tabs[0].id}
						onSelect={(id) => onTabSelect?.(id)}
						className="cc-sheet-header__tabbar"
					/>
					{!hasSearch && !hasTitleRow && onClose && (
						<button
							type="button"
							className="cc-sheet-header__icon-btn"
							onClick={onClose}
							aria-label="Close"
							style={{ width: "auto", flexShrink: 0 }}
						>
							<X size={20} strokeWidth={CC_ICON_STROKE} />
						</button>
					)}
				</div>
			)}
			{children}
		</div>
	);
}
