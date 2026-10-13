/**
 * ContentFlow Mobile — Main Application Shell (Capacitor 8 + React 19).
 *
 * Implements the ContentFlow design system (SageOfSixStacks/contentFlow Expo UI):
 * - Light theme Home Screen (#F5F4F0 bg, #ECEAE4 cards, #1C1C1E text, #FF4D2E primary)
 * - CustomTabHeader with search and Key Vault quick-access
 * - Herocard ("Start Creating." + signature 3-stripe graphic column)
 * - ToolsSection with 4-up quick tool shortcuts (AI Director, Motion Graphics, Captions, etc.)
 * - RecentProjectsSection with 2-column thumbnail cards
 * - 4-Tab Bottom Navigation: Home, Templates (378 Motion Graphics catalog), Projects, Me (Settings & Key Vault)
 * - Transitions seamlessly into the dark-theme EditorShell (#0A0A0A / #161618 / #FF4D2E)
 *
 * Recoverability: Git tag `pre-expo-ui`, branch `feat/expo-ui`.
 */
import "@kneecap/mobile-ui/tokens.css";
import "@kneecap/mobile-ui/components.css";
import "./app-root.css";
import {
	Component,
	StrictMode,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from "react";
import { createRoot } from "react-dom/client";
import {
	EditorCore,
	mediaTimeToSeconds,
	registerNativeMediaPathResolver,
	registerNativeAudioRouter,
	type MediaTime,
	type NativeImportProgress,
} from "@kneecap/editor-core";
import { getNativeBridge } from "@kneecap/native-bridge";
import { loadFontAtlas, loadFonts } from "@kneecap/editor-core/fonts/local-fonts";
import { useEditor } from "@kneecap/editor-core/react";
import {
	EditorShell,
	ensurePreviewGpu,
	KeyVaultSheet,
	getAllHtmlTemplateMeta,
	TemplateThumbnail,
	insertHtmlTemplateElement,
	getActiveAnthropicKey,
	installVaultSessionLock,
	useVaultStore,
	createProjectFromPickedMedia,
	type SheetId,
	type HtmlTemplateMeta,
} from "@kneecap/mobile-ui";
import {
	Home as HomeIcon,
	LayoutGrid,
	Folder,
	User,
	Search,
	Lock,
	Plus,
	Sparkles,
	LayoutTemplate,
	Captions,
	Mic,
	Film,
	Type,
	Music,
	Cloud,
	X,
	Cpu,
} from "lucide-react";

const NOOP_BOOTSTRAP = async () => {};

/** CrashBoundary: Paints full component error stack if render throws. */
class CrashBoundary extends Component<
	{ children: ReactNode },
	{ error: unknown; stack: string | null }
> {
	state: { error: unknown; stack: string | null } = { error: null, stack: null };

	static getDerivedStateFromError(error: unknown) {
		return { error };
	}

	componentDidCatch(error: unknown, info: { componentStack?: string | null }) {
		console.error("ContentFlow crashed:", error, info.componentStack);
		this.setState({ stack: info.componentStack ?? null });
	}

	render() {
		if (this.state.error !== null) {
			const err = this.state.error;
			const detail = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
			return (
				<div className="kc-crash">
					<p className="kc-crash__title">ContentFlow crashed</p>
					<pre className="kc-crash__detail">
						{detail}
						{this.state.stack ? `\n${this.state.stack}` : ""}
					</pre>
					<button
						type="button"
						className="cf-btn-primary"
						onClick={() => this.setState({ error: null, stack: null })}
					>
						Try again
					</button>
				</div>
			);
		}
		return this.props.children;
	}
}

type Screen = { name: "home" } | { name: "editor"; initialSheet?: SheetId };
type TabId = "home" | "templates" | "projects" | "me";

/** Outside the dev server nothing bootstraps a project for the editor, so it
 *  needs one already active. A cold launch or WebView reload that lands on
 *  `#editor` has none and goes Home instead. */
function canShowEditor(): boolean {
	return EditorCore.getInstance().project.getActiveOrNull() !== null;
}

function App() {
	const [screen, setScreen] = useState<Screen>(() => {
		if (
			typeof window !== "undefined" &&
			window.location.hash.includes("editor") &&
			canShowEditor()
		) {
			return { name: "editor" };
		}
		return { name: "home" };
	});

	useEffect(() => {
		installVaultSessionLock();
		const handleHash = () => {
			if (window.location.hash.includes("editor")) {
				if (canShowEditor()) {
					setScreen((s) => (s.name === "editor" ? s : { name: "editor" }));
				}
			} else if (
				window.location.hash === "" ||
				window.location.hash === "#" ||
				window.location.hash === "#home"
			) {
				setScreen({ name: "home" });
			}
		};
		window.addEventListener("hashchange", handleHash);
		return () => window.removeEventListener("hashchange", handleHash);
	}, []);

	/** Pick media → create project → open editor.
	 *  The picker runs from Home; the project is created only once picked
	 *  media is ready.  Tapping Done switches to the editor, which shows
	 *  `preparing` progress until the project exists. App (not HomeScreen)
	 *  owns this because HomeScreen unmounts on that switch. */
	const [preparing, setPreparing] = useState<NativeImportProgress | null>(null);
	const [startError, setStartError] = useState<string | null>(null);
	const creatingRef = useRef(false);

	const startCreatingWithTool = async (initialSheet?: SheetId) => {
		if (creatingRef.current) return;
		creatingRef.current = true;
		setStartError(null);
		const editor = EditorCore.getInstance();
		const goHome = () => {
			window.location.hash = "#home";
			setScreen({ name: "home" });
		};
		try {
			const outcome = await createProjectFromPickedMedia({
				editor,
				name: nextProjectName(editor.project.getSavedProjects().map((p) => p.name)),
				onPicked: () => {
					setPreparing({ index: 0, total: 1, fileName: "", stage: "picking", fraction: 0 });
					window.location.hash = "#editor";
					setScreen({ name: "editor", initialSheet: initialSheet ?? "edit" });
				},
				onProgress: setPreparing,
			});
			if (outcome.kind === "failed") {
				setStartError(outcome.message);
				goHome();
			} else if (outcome.kind === "cancelled") {
				goHome();
			}
		} catch (err) {
			setStartError(err instanceof Error ? err.message : "Something went wrong");
			goHome();
		} finally {
			setPreparing(null);
			creatingRef.current = false;
		}
	};

	const startCreating = () => void startCreatingWithTool("edit");

	if (screen.name === "editor") {
		return (
			<EditorShell
				bootstrap={NOOP_BOOTSTRAP}
				initialSheet={screen.initialSheet}
				preparing={preparing}
				onBack={() => {
					void EditorCore.getInstance().project.saveCurrentProject();
					window.location.hash = "#home";
					setScreen({ name: "home" });
				}}
			/>
		);
	}

	return (
		<HomeScreen
			onOpenEditor={(initialSheet?: SheetId) => {
				window.location.hash = "#editor";
				setScreen({ name: "editor", initialSheet });
			}}
			onStartCreating={() => startCreating()}
			startWithTool={startCreatingWithTool}
			startError={startError}
		/>
	);
}

function HomeScreen({
	onOpenEditor,
	onStartCreating,
	startWithTool,
	startError,
}: {
	onOpenEditor: (initialSheet?: SheetId) => void;
	onStartCreating: () => void;
	startWithTool: (initialSheet?: SheetId) => void;
	startError: string | null;
}) {
	const editor = useEditor();
	const projects = useEditor((e) => e.project.getSavedProjects());
	const [activeTab, setActiveTab] = useState<TabId>("home");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showVault, setShowVault] = useState(false);
	const [showToolsExpanded, setShowToolsExpanded] = useState(false);
	const [templateSearch, setTemplateSearch] = useState("");
	const [templateCategory, setTemplateCategory] = useState("all");
	const [projectSearch, setProjectSearch] = useState("");

	const hasAnthropicKey = Boolean(getActiveAnthropicKey());
	const isVaultConfigured = useVaultStore((s) => s.isConfigured);

	useEffect(() => {
		void editor.project.loadAllProjects();
		useVaultStore.getState().checkConfigured();
	}, [editor]);

	const run = async (
		task: () => Promise<unknown>,
		{ open, initialSheet }: { open: boolean; initialSheet?: SheetId },
	) => {
		if (busy) return;
		setBusy(true);
		setError(null);
		try {
			await task();
			if (open) onOpenEditor(initialSheet);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Something went wrong");
		} finally {
			setBusy(false);
		}
	};

	const useTemplateInNewProject = async (tmpl: HtmlTemplateMeta) => {
		await run(
			async () => {
				await editor.project.createNewProject({
					name: `${tmpl.name} Edit`,
				});
				insertHtmlTemplateElement({
					editor,
					templateId: tmpl.id,
					startSeconds: 0,
					durationSec: tmpl.defaultDuration || 4,
				});
			},
			{ open: true },
		);
	};

	// ─── Templates Catalog ───────────────────────────────────────────────
	const allTemplates = useMemo(() => getAllHtmlTemplateMeta(), []);
	const categories = useMemo(() => {
		const cats = new Set<string>();
		cats.add("all");
		for (const t of allTemplates) {
			for (const tag of t.tags) {
				if (tag && tag.length > 2) cats.add(tag.toLowerCase());
			}
		}
		return Array.from(cats).slice(0, 10);
	}, [allTemplates]);

	const filteredTemplates = useMemo(() => {
		let list = allTemplates;
		if (templateCategory !== "all") {
			list = list.filter((t) =>
				t.tags.some((tag) => tag.toLowerCase() === templateCategory),
			);
		}
		if (templateSearch.trim()) {
			const q = templateSearch.toLowerCase().trim();
			list = list.filter(
				(t) =>
					t.name.toLowerCase().includes(q) ||
					t.description.toLowerCase().includes(q) ||
					t.tags.some((tag) => tag.toLowerCase().includes(q)),
			);
		}
		return list;
	}, [allTemplates, templateCategory, templateSearch]);

	const filteredProjects = useMemo(() => {
		if (!projectSearch.trim()) return projects;
		const q = projectSearch.toLowerCase().trim();
		return projects.filter((p) => p.name.toLowerCase().includes(q));
	}, [projects, projectSearch]);

	return (
		<div className="cf-home-layout">
			{/* Top Bar / Header */}
				{activeTab === "home" && (
			<header className="cf-tab-header">
				<div className="cf-tab-header__left">
					<h1 className="cf-tab-header__title">ContentFlow</h1>
				</div>
				<div className="cf-tab-header__actions">
					<button
						type="button"
						className={`cf-tab-header__circle-btn ${hasAnthropicKey ? "cf-tab-header__circle-btn--active" : ""}`}
						onClick={() => setShowVault(true)}
						aria-label="Open Key Vault"
						title={hasAnthropicKey ? "Anthropic Key Configured" : "Configure Anthropic Key in Vault"}
					>
						<Lock size={18} strokeWidth={2.2} />
						<span
							className={`cf-vault-indicator ${hasAnthropicKey ? "cf-vault-indicator--active" : "cf-vault-indicator--missing"}`}
						/>
					</button>
					<button
						type="button"
						className="cf-tab-header__circle-btn"
						onClick={() => setActiveTab("templates")}
						aria-label="Search templates and projects"
					>
						<Search size={18} strokeWidth={2.2} />
					</button>
				</div>
			</header>
				)}

			{(error ?? startError) && (
				<div className="cf-home-error">
					<div>{error ?? startError}</div>
					{startError?.startsWith("Import failed at ") && (
						<button type="button" className="cf-home-error__retry" onClick={() => onStartCreating()}>
							Retry
						</button>
					)}
				</div>
			)}

			{/* Main Scrollable View Area */}
			<main className="cf-home-content">
				{/* ════════════════════ TAB 1: HOME ════════════════════ */}
				{activeTab === "home" && (
					<div className="cf-home-view">
						{/* Herocard (Expo parity: 140px, #111, stripes) */}
						<section
							className="cf-herocard"
							onClick={onStartCreating}
							role="button"
							tabIndex={0}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") onStartCreating();
							}}
						>
							<div className="cf-herocard__content">
								<span className="cf-herocard__overline">NEW PROJECT</span>
								<div className="cf-herocard__headline">
									<span>Start</span>
									<span>Creating.</span>
								</div>
								<div className="cf-herocard__cta-row">
									<div className="cf-herocard__plus-pill">
										<Plus size={13} strokeWidth={3} />
									</div>
									<span className="cf-herocard__cta-text">New video</span>
								</div>
							</div>
							<div className="cf-herocard__stripes" aria-hidden="true">
								<div className="cf-herocard__stripe cf-herocard__stripe--1" />
								<div className="cf-herocard__stripe cf-herocard__stripe--2" />
								<div className="cf-herocard__stripe cf-herocard__stripe--3" />
							</div>
						</section>

						{/* Tools Section */}
						<section className="cf-tools-section">
							<div className="cf-section-header">
								<span className="cf-section-overline">TOOLS</span>
								<button
									type="button"
									className="cf-section-toggle"
									onClick={() => setShowToolsExpanded((prev) => !prev)}
								>
									{showToolsExpanded ? "Show less" : "Show more"}
								</button>
							</div>

							<div className="cf-tools-grid">
								{/* Row 1 */}
								<button
									type="button"
									className="cf-tool-btn"
									onClick={() => startWithTool("ai")}
								>
									<div className="cf-tool-btn__icon cf-tool-btn__icon--ai">
										<Sparkles size={20} strokeWidth={2.2} />
									</div>
									<span className="cf-tool-btn__label">AI Director</span>
								</button>

								<button
									type="button"
									className="cf-tool-btn"
									onClick={() => startWithTool("template")}
								>
									<div className="cf-tool-btn__icon">
										<LayoutTemplate size={20} strokeWidth={2.2} />
									</div>
									<span className="cf-tool-btn__label">Graphics</span>
								</button>

								<button
									type="button"
									className="cf-tool-btn"
									onClick={() => startWithTool("captions")}
								>
									<div className="cf-tool-btn__icon">
										<Captions size={20} strokeWidth={2.2} />
									</div>
									<span className="cf-tool-btn__label">Caption</span>
								</button>

								<button
									type="button"
									className="cf-tool-btn"
									onClick={() => startWithTool("voiceover")}
								>
									<div className="cf-tool-btn__icon">
										<Mic size={20} strokeWidth={2.2} />
									</div>
									<span className="cf-tool-btn__label">Voiceover</span>
								</button>

								{/* Row 2 (when expanded) */}
								{showToolsExpanded && (
									<>
										<button
											type="button"
											className="cf-tool-btn"
											onClick={() => startWithTool("stock")}
										>
											<div className="cf-tool-btn__icon">
												<Film size={20} strokeWidth={2.2} />
											</div>
											<span className="cf-tool-btn__label">B-Roll</span>
										</button>

										<button
											type="button"
											className="cf-tool-btn"
											onClick={() => startWithTool("text")}
										>
											<div className="cf-tool-btn__icon">
												<Type size={20} strokeWidth={2.2} />
											</div>
											<span className="cf-tool-btn__label">Text</span>
										</button>

										<button
											type="button"
											className="cf-tool-btn"
											onClick={() => startWithTool("audio")}
										>
											<div className="cf-tool-btn__icon">
												<Music size={20} strokeWidth={2.2} />
											</div>
											<span className="cf-tool-btn__label">Sound</span>
										</button>

										<button
											type="button"
											className="cf-tool-btn"
											onClick={() => setShowVault(true)}
										>
											<div className="cf-tool-btn__icon">
												<Lock size={20} strokeWidth={2.2} />
											</div>
											<span className="cf-tool-btn__label">Key Vault</span>
										</button>
									</>
								)}
							</div>
						</section>

						{/* Recent Projects Section */}
						<section className="cf-projects-section">
							<div className="cf-section-header">
								<h2 className="cf-section-title">Projects</h2>
								<div className="cf-section-cloud-badge">
									<Cloud size={13} strokeWidth={2.2} />
									<span>Local Storage</span>
								</div>
							</div>

							{projects.length === 0 ? (
								<div className="cf-projects-empty">
									<p>No projects yet.</p>
									<button
										type="button"
										className="cf-btn-primary"
										onClick={onStartCreating}
									>
										+ Start Creating
									</button>
								</div>
							) : (
								<ul className="cf-projects-grid">
									{projects.slice(0, 4).map((p) => (
										<ProjectCard
											key={p.id}
											name={p.name}
											thumbnail={p.thumbnail}
											duration={p.duration}
											updatedAt={p.updatedAt}
											disabled={busy}
											onOpen={() =>
												void run(() => editor.project.loadProject({ id: p.id }), {
													open: true,
												})
											}
											onDelete={() => {
												if (!window.confirm(`Delete “${p.name}”?`)) return;
												void run(
													() => editor.project.deleteProjects({ ids: [p.id] }),
													{ open: false },
												);
											}}
										/>
									))}
								</ul>
							)}
						</section>
					</div>
				)}

				{/* ════════════════════ TAB 2: TEMPLATES ════════════════════ */}
				{activeTab === "templates" && (
					<div className="cf-templates-view">
						<div className="cf-templates-header">
							<div>
								<h2 className="cf-view-title">Templates</h2>
								<p className="cf-view-subtitle">
									{allTemplates.length} Motion Graphics • Animated Charts, Titles & Overlays
								</p>
							</div>
						</div>

						{/* Search Bar */}
						<div className="cf-search-box">
							<Search size={16} color="#8E8E93" />
							<input
								type="text"
								placeholder="Search 378 motion templates…"
								value={templateSearch}
								onChange={(e) => setTemplateSearch(e.target.value)}
								className="cf-search-input"
							/>
							{templateSearch && (
								<button
									type="button"
									onClick={() => setTemplateSearch("")}
									className="cf-search-clear"
								>
									<X size={14} />
								</button>
							)}
						</div>

						{/* Category Pills */}
						<div className="cf-category-scroll">
							{categories.map((cat) => (
								<button
									key={cat}
									type="button"
									className={`cf-category-pill ${templateCategory === cat ? "cf-category-pill--active" : ""}`}
									onClick={() => setTemplateCategory(cat)}
								>
									{cat.charAt(0).toUpperCase() + cat.slice(1)}
								</button>
							))}
						</div>

						{/* Templates Grid */}
						<div className="cf-templates-grid">
							{filteredTemplates.map((tmpl) => (
								<div key={tmpl.id} className="cf-template-card">
									<div className="cf-template-card__thumb" data-kneecap-theme="capcut-mobile">
										<TemplateThumbnail template={tmpl} />
									</div>
									<div className="cf-template-card__badge-row">
										<span className="cf-template-card__tag">
											{tmpl.tags[0] ?? "Graphic"}
										</span>
										<span className="cf-template-card__aspect">
											{tmpl.aspectHint}
										</span>
									</div>
									<h3 className="cf-template-card__name">{tmpl.name}</h3>
									<p className="cf-template-card__desc">
										{tmpl.description || "Production-ready motion template"}
									</p>
									<button
										type="button"
										className="cf-template-card__use-btn"
										disabled={busy}
										onClick={() => void useTemplateInNewProject(tmpl)}
									>
										+ Use Template
									</button>
								</div>
							))}
						</div>
					</div>
				)}

				{/* ════════════════════ TAB 3: PROJECTS ════════════════════ */}
				{activeTab === "projects" && (
					<div className="cf-projects-view">
						<div className="cf-view-header-row">
							<div>
								<h2 className="cf-view-title">All Projects</h2>
								<p className="cf-view-subtitle">
									{projects.length} project(s) saved on this device
								</p>
							</div>
							<button
								type="button"
								className="cf-btn-primary"
								disabled={busy}
								onClick={onStartCreating}
							>
								+ New
							</button>
						</div>

						{/* Project Search */}
						<div className="cf-search-box">
							<Search size={16} color="#8E8E93" />
							<input
								type="text"
								placeholder="Search your projects…"
								value={projectSearch}
								onChange={(e) => setProjectSearch(e.target.value)}
								className="cf-search-input"
							/>
							{projectSearch && (
								<button
									type="button"
									onClick={() => setProjectSearch("")}
									className="cf-search-clear"
								>
									<X size={14} />
								</button>
							)}
						</div>

						{filteredProjects.length === 0 ? (
							<div className="cf-projects-empty">
								<p>No projects match your search.</p>
								<button
									type="button"
									className="cf-btn-primary"
									onClick={onStartCreating}
								>
									+ Start Creating
								</button>
							</div>
						) : (
							<ul className="cf-projects-grid">
								{filteredProjects.map((p) => (
									<ProjectCard
										key={p.id}
										name={p.name}
										thumbnail={p.thumbnail}
										duration={p.duration}
										updatedAt={p.updatedAt}
										disabled={busy}
										onOpen={() =>
											void run(() => editor.project.loadProject({ id: p.id }), {
												open: true,
											})
										}
										onDelete={() => {
											if (!window.confirm(`Delete “${p.name}”?`)) return;
											void run(
												() => editor.project.deleteProjects({ ids: [p.id] }),
												{ open: false },
											);
										}}
									/>
								))}
							</ul>
						)}
					</div>
				)}

				{/* ════════════════════ TAB 4: ME ════════════════════ */}
				{activeTab === "me" && (
					<div className="cf-me-view">
						<h2 className="cf-view-title">Profile & Settings</h2>

						{/* Creator Badge Card */}
						<div className="cf-card cf-profile-card">
							<div className="cf-profile-avatar">
								<span>CF</span>
							</div>
							<div className="cf-profile-info">
								<h3 className="cf-profile-name">ContentFlow Creator</h3>
								<p className="cf-profile-subtitle">
									Capacitor 8 • Hybrid Rust WASM Engine
								</p>
							</div>
						</div>

						{/* Key Vault Management Card */}
						<div className="cf-card cf-vault-card">
							<div className="cf-card-header">
								<div className="cf-card-title-group">
									<Lock size={18} color="#FF4D2E" />
									<h3 className="cf-card-title">AI Director Key Vault</h3>
								</div>
								<span
									className={`cf-status-pill ${hasAnthropicKey ? "cf-status-pill--active" : "cf-status-pill--missing"}`}
								>
									{hasAnthropicKey ? "Key Configured" : "Key Needed"}
								</span>
							</div>
							<p className="cf-card-body">
								The AI Director runs locally in your app using your Anthropic API
								key. The key is encrypted directly on your device using AES-GCM
								and never shared.
							</p>
							<button
								type="button"
								className="cf-btn-primary"
								onClick={() => setShowVault(true)}
							>
								{isVaultConfigured ? "Manage Key Vault" : "Set Up Key Vault"}
							</button>
						</div>

						{/* System Diagnostics */}
						<div className="cf-card cf-diagnostics-card">
							<div className="cf-card-title-group">
								<Cpu size={18} color="#1C1C1E" />
								<h3 className="cf-card-title">Engine Diagnostics</h3>
							</div>
							<div className="cf-diag-list">
								<div className="cf-diag-row">
									<span className="cf-diag-label">Compositor Engine</span>
									<span className="cf-diag-value">Rust WGPU 29 (WASM)</span>
								</div>
								<div className="cf-diag-row">
									<span className="cf-diag-label">Native Audio Router</span>
									<span className="cf-diag-value">Capacitor Native Bridge</span>
								</div>
								<div className="cf-diag-row">
									<span className="cf-diag-label">Offline Transcription</span>
									<span className="cf-diag-value">whisper.cpp (Local 16kHz)</span>
								</div>
								<div className="cf-diag-row">
									<span className="cf-diag-label">Motion Graphics</span>
									<span className="cf-diag-value">{allTemplates.length} Templates Active</span>
								</div>
								<div className="cf-diag-row">
									<span className="cf-diag-label">Saved Projects</span>
									<span className="cf-diag-value">{projects.length} on device</span>
								</div>
							</div>
						</div>
					</div>
				)}
			</main>

			{/* Fixed Bottom Tab Bar (Expo _layout.tsx parity) */}
			<nav className="cf-bottom-nav" aria-label="Main Navigation">
				<button
					type="button"
					className={`cf-bottom-nav__item ${activeTab === "home" ? "cf-bottom-nav__item--active" : ""}`}
					onClick={() => setActiveTab("home")}
				>
					<HomeIcon size={22} strokeWidth={activeTab === "home" ? 2.5 : 2} />
					<span className="cf-bottom-nav__label">Home</span>
				</button>

				<button
					type="button"
					className={`cf-bottom-nav__item ${activeTab === "templates" ? "cf-bottom-nav__item--active" : ""}`}
					onClick={() => setActiveTab("templates")}
				>
					<LayoutGrid
						size={22}
						strokeWidth={activeTab === "templates" ? 2.5 : 2}
					/>
					<span className="cf-bottom-nav__label">Templates</span>
				</button>

				<button
					type="button"
					className={`cf-bottom-nav__item ${activeTab === "projects" ? "cf-bottom-nav__item--active" : ""}`}
					onClick={() => setActiveTab("projects")}
				>
					<Folder
						size={22}
						strokeWidth={activeTab === "projects" ? 2.5 : 2}
					/>
					<span className="cf-bottom-nav__label">Projects</span>
				</button>

				<button
					type="button"
					className={`cf-bottom-nav__item ${activeTab === "me" ? "cf-bottom-nav__item--active" : ""}`}
					onClick={() => setActiveTab("me")}
				>
					<User size={22} strokeWidth={activeTab === "me" ? 2.5 : 2} />
					<span className="cf-bottom-nav__label">Me</span>
				</button>
			</nav>

			{/* Key Vault Modal Sheet */}
			{showVault && <KeyVaultSheet onClose={() => setShowVault(false)} />}
		</div>
	);
}

/** Thumbnail-first project card for the two-column grid */
function ProjectCard({
	name,
	thumbnail,
	duration,
	updatedAt,
	disabled,
	onOpen,
	onDelete,
}: {
	name: string;
	thumbnail?: string;
	duration: MediaTime;
	updatedAt: Date | string;
	disabled: boolean;
	onOpen: () => void;
	onDelete: () => void;
}) {
	return (
		<li className="cf-project-card">
			<button
				type="button"
				className="cf-project-card__open-btn"
				disabled={disabled}
				onClick={onOpen}
			>
				<span className="cf-project-card__thumb-frame">
					{thumbnail ? (
						<img
							src={thumbnail}
							alt=""
							className="cf-project-card__thumb"
							draggable={false}
						/>
					) : (
						<span
							className="cf-project-card__thumb cf-project-card__thumb--empty"
							aria-hidden="true"
						>
							<svg
								viewBox="0 0 24 24"
								width="28"
								height="28"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.6"
							>
								<rect x="3" y="5" width="18" height="14" rx="2.5" />
								<path
									d="M10 9.5v5l4.5-2.5z"
									fill="currentColor"
									stroke="none"
								/>
							</svg>
						</span>
					)}
					<span className="cf-project-card__duration">
						{formatDuration(duration)}
					</span>
				</span>
				<span className="cf-project-card__meta">
					<span className="cf-project-card__name">{name}</span>
					<span className="cf-project-card__date">
						{new Date(updatedAt).toLocaleDateString()}
					</span>
				</span>
			</button>
			<button
				type="button"
				className="cf-project-card__more-btn"
				aria-label={`Delete ${name}`}
				disabled={disabled}
				onClick={onDelete}
			>
				⋯
			</button>
		</li>
	);
}

function formatDuration(duration: MediaTime): string {
	const total = Math.max(0, Math.floor(mediaTimeToSeconds({ time: duration })));
	const h = Math.floor(total / 3600);
	const m = Math.floor((total % 3600) / 60);
	const s = total % 60;
	const ss = String(s).padStart(2, "0");
	return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

function nextProjectName(existing: string[]): string {
	const taken = new Set(existing);
	let n = 1;
	while (taken.has(`Project ${n}`)) n += 1;
	return `Project ${n}`;
}

export function mountApp() {
	const container = document.getElementById("app");
	if (!container) throw new Error("app-root: #app container missing from index.html");

	(window as unknown as Record<string, unknown>).__kneecap = {
		editor: EditorCore.getInstance(),
	};

	void ensurePreviewGpu().then(() => loadFontAtlas());
	void loadFonts({ families: ["Albert Sans"] });

	void getNativeBridge().then(async (bridge) => {
		const root = await bridge.getMediaRoot();
		if (root) {
			registerNativeMediaPathResolver({
				root,
				toPlaybackUri: bridge.toPlaybackUri,
			});
		}
		registerNativeAudioRouter({
			start: (params) => bridge.audioStart(params),
			stop: () => bridge.audioStop(),
			level: () => bridge.audioLevel(),
			toNativePath: (url) => {
				const marker = "/_capacitor_file_";
				const index = url.indexOf(marker);
				return index === -1 ? null : url.slice(index + marker.length);
			},
		});
	});

	container.innerHTML = "";
	createRoot(container).render(
		<StrictMode>
			<CrashBoundary>
				<App />
			</CrashBoundary>
		</StrictMode>,
	);
}
