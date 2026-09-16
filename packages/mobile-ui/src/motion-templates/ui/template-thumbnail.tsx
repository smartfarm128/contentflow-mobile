import React, { Component, useEffect, useRef, useState, useMemo, type ReactNode } from "react";
import type { HtmlTemplate } from "../types";
import { Sparkles, Play } from "lucide-react";

class ThumbnailErrorBoundary extends Component<
	{ fallback: ReactNode; children: ReactNode },
	{ hasError: boolean }
> {
	state = { hasError: false };
	static getDerivedStateFromError() {
		return { hasError: true };
	}
	componentDidCatch() {}
	render() {
		if (this.state.hasError) return this.props.fallback;
		return this.props.children;
	}
}

export function TemplateThumbnail({
	template,
	isLivePreview = false,
}: {
	template: HtmlTemplate;
	isLivePreview?: boolean;
}) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [isVisible, setIsVisible] = useState(false);
	const [scale, setScale] = useState(0.5);
	const [progress, setProgress] = useState(0.5);

	const VIRTUAL_WIDTH = 360;
	const VIRTUAL_HEIGHT = 202; // 16:9

	// Lazy mount via IntersectionObserver
	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		const obs = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) {
					setIsVisible(true);
				}
			},
			{ rootMargin: "150px" },
		);
		obs.observe(el);
		return () => obs.disconnect();
	}, []);

	// Dynamic scaling to fit thumbnail card width
	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		const updateScale = () => {
			const w = el.clientWidth || 170;
			setScale(w / VIRTUAL_WIDTH);
		};
		updateScale();
		const ro = new ResizeObserver(updateScale);
		ro.observe(el);
		return () => ro.disconnect();
	}, []);

	// Live loop animation when active
	useEffect(() => {
		if (!isLivePreview || !isVisible) {
			setProgress(0.5);
			return;
		}
		let rafId: number;
		const startTime = performance.now();
		const durationMs = (template.defaultDuration || 4) * 1000;

		const loop = (now: number) => {
			const elapsed = (now - startTime) % durationMs;
			setProgress(elapsed / durationMs);
			rafId = requestAnimationFrame(loop);
		};
		rafId = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(rafId);
	}, [isLivePreview, isVisible, template.defaultDuration]);

	const defaultValues = useMemo(() => {
		const vals: Record<string, any> = {};
		for (const ctrl of template.controls) {
			vals[ctrl.id] = ctrl.defaultValue;
		}
		return vals;
	}, [template.controls]);

	const Component = template.Component;

	const fallbackBadge = (
		<div className="cc-motion-card__fallback">
			<Sparkles size={16} color="var(--cc-accent)" />
			<span style={{ fontSize: "10px", color: "var(--cc-text-secondary)" }}>Motion Graphic</span>
		</div>
	);

	return (
		<div ref={containerRef} className="cc-motion-card__preview">
			{isVisible ? (
				<ThumbnailErrorBoundary fallback={fallbackBadge}>
					<div
						className="cc-motion-card__preview-scaler"
						style={{
							width: `${VIRTUAL_WIDTH}px`,
							height: `${VIRTUAL_HEIGHT}px`,
							transform: `scale(${scale})`,
							transformOrigin: "top left",
						}}
					>
						<Component
							progress={progress}
							time={progress * (template.defaultDuration || 4)}
							width={VIRTUAL_WIDTH}
							height={VIRTUAL_HEIGHT}
							values={defaultValues}
						/>
					</div>
				</ThumbnailErrorBoundary>
			) : (
				fallbackBadge
			)}
			{isLivePreview && (
				<div className="cc-motion-card__playing-badge">
					<Play size={8} fill="currentColor" />
					<span>Previewing</span>
				</div>
			)}
		</div>
	);
}
