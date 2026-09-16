/**
 * ContentFlow — editing Style Profiles.
 *
 * The core creative use case: a creator has a reference video whose editing
 * style they want, and their own raw footage. They cannot edit, but they can
 * point. A Style Profile is what the Director extracts from the reference —
 * pacing, cut rhythm, caption look, hook structure — so a later plan can be
 * written AGAINST that profile rather than against the model's generic taste.
 *
 * Persisted to localStorage: a profile extracted once should still be there
 * next week when the creator shoots the follow-up video. Zero network — the
 * profile is plain text the model wrote, stored on the device.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface StyleProfile {
	id: string;
	name: string;
	createdAt: number;
	/** How fast/energetic — "very fast, ~180wpm, no dead air". */
	pacing?: string;
	/** Cut frequency and where cuts land — "every 1.5-3s, on sentence ends". */
	cutRhythm?: string;
	/** How the opening seconds hook — "cold-open claim, flash-forward at 0-3s". */
	hookStructure?: string;
	/** Caption look: font, size, position, animation, highlight colors. */
	captionStyle?: string;
	/** Grade/look — "high contrast, teal shadows, warm skin". */
	colorGrade?: string;
	/** How often overlays/graphics appear and what kind. */
	motionGraphicDensity?: string;
	/** Music/SFX character. */
	audioFeel?: string;
	/** Anything else load-bearing. */
	notes?: string;
}

/** Stand-in for `localStorage` where the global is absent (tests, SSR). */
const memoryStorage: Storage = (() => {
	const map = new Map<string, string>();
	return {
		get length() {
			return map.size;
		},
		clear: () => map.clear(),
		getItem: (key: string) => map.get(key) ?? null,
		key: (index: number) => Array.from(map.keys())[index] ?? null,
		removeItem: (key: string) => void map.delete(key),
		setItem: (key: string, value: string) => void map.set(key, value),
	};
})();

interface StyleProfileState {
	profiles: StyleProfile[];
	saveProfile: (profile: Omit<StyleProfile, "id" | "createdAt"> & { id?: string }) => StyleProfile;
	removeProfile: (id: string) => void;
	getProfile: (id: string) => StyleProfile | undefined;
}

export const useStyleProfileStore = create<StyleProfileState>()(
	persist(
		(set, get) => ({
			profiles: [],
			saveProfile: (profile) => {
				const id = profile.id ?? `style-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
				const saved: StyleProfile = { ...profile, id, createdAt: Date.now() };
				set((s) => ({ profiles: [...s.profiles.filter((p) => p.id !== id), saved] }));
				return saved;
			},
			removeProfile: (id) => set((s) => ({ profiles: s.profiles.filter((p) => p.id !== id) })),
			getProfile: (id) => get().profiles.find((p) => p.id === id),
		}),
		{
			name: "cf-style-profiles",
			// Guarded rather than bare `localStorage`: this module is imported by
			// the headless test runtime and by any future SSR path, where the
			// global does not exist. A missing store degrades to in-memory
			// profiles (still usable this session) instead of warning on
			// every write.
			storage: createJSONStorage(() =>
				typeof localStorage !== "undefined" ? localStorage : memoryStorage,
			),
		},
	),
);

/** Renders a profile as the block of direction the model plans against. */
export function formatStyleProfile(profile: StyleProfile): string {
	const rows: string[] = [`STYLE PROFILE — "${profile.name}"`];
	const push = (label: string, value?: string) => {
		if (value?.trim()) rows.push(`${label}: ${value.trim()}`);
	};
	push("Pacing", profile.pacing);
	push("Cut rhythm", profile.cutRhythm);
	push("Hook structure", profile.hookStructure);
	push("Caption style", profile.captionStyle);
	push("Color grade", profile.colorGrade);
	push("Motion graphics", profile.motionGraphicDensity);
	push("Audio feel", profile.audioFeel);
	push("Notes", profile.notes);
	return rows.join("\n");
}
