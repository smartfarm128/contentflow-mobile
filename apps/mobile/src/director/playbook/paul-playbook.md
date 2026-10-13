---
name: paul-playbook
description: >-
  Paul Funchious's single source of truth for content and editing (AI Labs channel, @funpaul_ai). Everything we
  researched and decided, merged into one file: hard rules from Paul, the long-form format (Mode A on camera,
  Mode B avatar/faceless), the Kaye.creates / Satori Graphics / Money Degree teardown, the Red Bull deep-dive,
  62 editing techniques, reel formats, hooks and memes, caption styles, sound rules + a full sound-design system with a CC0 SFX kit, a transitions & VFX catalogue with filming directions, cutting rules, packaging
  (titles, thumbnails, descriptions, resource PDFs), content-idea formulas, assets, tools and open decisions.
  Use it whenever you edit any of Paul's videos (long-form, reels, Shorts, intros), plan or script content, give
  content ideas, write titles, thumbnails, descriptions or captions, or design graphics for his videos.
  Trigger: /paul-playbook
---

# Paul Funchious: content and editing playbook

Single source of truth, created 2026-10-03 by merging every research note, rule and format we built together.
**Add new research and decisions to this file.** Don't start separate notes. Raw evidence (videos, frame strips,
measurements, scripts) stays in `~/hyperframes-student-kit/research/` and is indexed in §16.

## How to use this file
| You are asked to… | Read |
|---|---|
| Edit a long-form video | §1 → §2 → §5 → §6 → §7 → §10 → §11 → §12 → §13 |
| Edit a reel / Short / intro | §1 → §2 → §8 → §9 → §10 → §11 → §12 |
| Give content ideas / plan a video / script | §1 → §4 → §5 → §6 → §14 → §13 |
| Title, thumbnail, description, resource PDF, posting | §13 |
| Channel growth / why videos aren't picked up | §18 |
| What's trending in AI-design videos; S1–S4 series | §19 |
| **Choosing, placing and mixing sound effects** | §20 (with §10) |
| **Transitions & VFX: what to use, how Paul films it, how we build it** | §21 |
| **Voiceover-driven shorts** (narrator hook + curiosity over footage; unlimited shorts from B-roll) | §22 |
| **Writing any script** (hooks, story arc, loops, story flow, CTAs, view ceilings) | **§23 first**, then §22 / §8 / §5 |
| Design a graphic or motion component | §5 (design world) → §7 → §9 → §15 |
| Study a new creator ("edit it like @x") | §4 method → §16 → add the findings here |

---

## 1. Who Paul is and how to work with him

- **Paul Funchious**: video creator and graphic designer; AI educator.
  - Brand: **Funchious AI Lab** (YouTube channel renamed 2026-10).
  - Handles **differ by platform**: YouTube **@funpaul_ai**, TikTok **@funchiousai**, Instagram **@paulfunchious**, Linktree linktr.ee/funpaulai.
    Never write "@funpaul_ai on TikTok/IG".
  - Site: funchiousailab.com, with the toolkit at /toolkit.
  - Name spelling: **Paul Funchious**.
  - Intro line: "Hi, my name is Paul Funchious and I'm an AI educator… scale your business, save time, boost your productivity."
- **Channel promise:** *I show you how to do professional creative work with AI, and give you the exact prompts.*
  Niche: AI graphic design (flyers, product shots, ads, logos, restoration, mockups) for designers and small businesses.
- **Tools on his side:** DaVinci Resolve (free tier, no scripting), no After Effects, iPhone camera. Higgsfield (MCP, uses credits).
  Records talking-head + screen recordings. Can use his **own avatar** for faceless videos.

**How he wants me to work:**
- **His reference is the bar, not inspiration.** When he shows a reference, match it. A hollow UI or a half-working result is worse than nothing.
- **Default to my recommendation and proceed.** Don't ask on every choice. Ask only when the decision is genuinely his
  (spending credits, licensing risk, his likeness, posting anything).
- **All video edits go through the HyperFrames student kit** (`~/hyperframes-student-kit`), never an ad-hoc pipeline.
  Work in `video-projects/<slug>/` and read the kit's `CLAUDE.md` routing, `MOTION_PHILOSOPHY.md` and the project `DESIGN.md` first.
  Use the kit skills: `edit-video` (long-form), `short-form-edit` (reels), `cut-silences`, `cut-mistakes`,
  `video-storytelling`, `hyperframes-video-beats`, `style-library`, and its validators and quality gates.
- **ContentFlow app (CLI-connected):** when the `contentflow` MCP is connected and he says "edit", call the
  `mcp__contentflow__*` tools on the live timeline in that turn, and verify with `get_timeline` / `render_frame`. No side work.
  (Rules in `~/contentflow/CLAUDE.md`.)
- **He listens closely.** A clipped syllable, a wrong SFX or a stuck caption is the first thing he notices.
- **Deliver** to the Desktop folder of that project (e.g. `Desktop/graphic designer video  /`, `Desktop/ai labs /`) with clear
  filenames ("… - EDIT v3.mp4"), plus a posting guide or description when relevant.
- **I can't listen.** Audio checks are measurements. List SFX cues in the reply (no HTML review pages: Paul, 2026-10-05, save tokens).

## 2. Hard rules (never break)

1. **Cut on measured pauses, never on transcript timestamps.**
   - Whisper DTW word times run ~0.5 s late; using them clipped sentences in long-form v2.
   - Place boundaries with audio energy (10 ms RMS pauses) and snap editorial cuts into a pause, or drop them.
   - ASR-snippet-test both sides of each join, measure the breath at every join, and read a fresh ASR of the final audio across every join.
2. **Never put text over a face.** End cards included. Masking puts text *behind* the head, which is allowed and wanted.
3. **No generic music beds on reels.**
   - Deliver **voice + SFX only**, plus notes on the trending sound to add in-app (name, start offset, ~15–20% under voice).
   - Never deliver a "with music: free-to-use bed" version. Don't rip copyrighted trending audio.
4. **SFX must match the on-screen physical action.**
   - Name the action first (marker stroke, paper slide, click, punch, whoosh with real motion).
   - Search Freesound by that action and pick by the recordist's *description*. CC0, logged in `audio-ledger.json`.
   - Re-score after any restyle; never carry old cues over.
   - Keep SFX off consonants, and send a per-cue review page.
5. **Never draw, trace or generate a brand logo.**
   - Use official files only (`asset-library/brand/`, `scripts/capture.mjs` → Simple Icons/official) or plain text.
   - Never imply endorsement. Thumbnails avoid trademarked logos entirely.
6. **Avatars and face tools: only Paul's own likeness** (or with consent), with an AI disclosure.
   Never generate a real person's likeness as if authentic.
7. **Meme/hook clips:** safe sources first (Pexels, original Higgsfield after quoting the cost).
   - Use hook-site clips only when nothing else fits, and flag the licensing risk every time.
   - Never TV, film or sports footage.
8. **One accent colour per video.** Red only for warnings or "don't" words.
9. **Every edit needs a reason** (story, emotion, attention, clarity, brand). No purpose, no caption, animation, zoom or B-roll.
10. **Downloads of other people's videos need Paul's permission** (state the file, source and size).
    Never print API keys; never open his credential files.
    Deletions go to the Trash only, with approval. Don't work around blocked commands.
11. **Clean up after yourself in timelines:** remove empty or orphan tracks after deleting clips.

## 3. Tools, paths and assets

**Pipeline routing:**

| Job | Tool |
|---|---|
| Cut / pauses / mistakes | kit `cut-silences` → `cut-mistakes`, with the energy method in `video-projects/image-generation-ai/scripts/cut_plan.py` |
| Cut approval page | `python3 scripts/cut-review.py video-projects/<slug> --verify --open` → `qa/cut-review/cut-check.html` |
| Motion graphics | HyperFrames compositions (GSAP, `window.__timelines`, seekable only), `npx hyperframes lint` then `render` (`--format mov` = ProRes 4444 alpha) |
| Ready-made overlays | `~/contentflow/motion-library/` (378 templates, `gallery.html`, `node render.mjs render --id … --out x.webm`) |
| Logos, icons, real web screenshots | `node scripts/capture.mjs <dir with visuals.json>` (official logos, Lucide icons, scroll + highlight) |
| Person matte (text masking) | `swift scripts/matte/person_matte.swift <frames> <alphas>` (Apple Vision, on-device) |
| OCR + faces per frame | `scripts/matte/frame_scan.swift` (compiled at `research/longform-teardown/scan/frame_scan`) |
| Stock B-roll / photos | `python3 ~/.claude/skills/broll/scripts/pexels.py --query … --orientation …` |
| SFX | Freesound API (CC0 filter, HQ previews), log provenance |
| AI images / video | Higgsfield MCP (credits: quote first); prompt skills `banana-pro-director-2.0`, `cinema-worldbuilder-pro-2.0` |
| Trending TikTok sounds | Higgsfield `tiktok_music_trending` (needs Paul to connect TikTok via `tiktok_connect`) |
| PDFs | HTML → Chrome headless `--print-to-pdf` (see `video-projects/image-generation-ai/resources/build_toolkit.py`) |
| Creator teardown | §16 scripts + `tools/nextwork-ai-video-editor/plugins/creator-teardown` |
| **Russian / mixed-language speech** | `video-projects/aij-shorts/scripts/asr_bilingual.py` (multilingual Whisper `small`, language per speech chunk; run with `DYLD_LIBRARY_PATH=/opt/homebrew/Cellar/protobuf/35.0/lib /opt/homebrew/Cellar/openai-whisper/20250625_5/libexec/bin/python`, because the brew torch links an older protobuf). `scripts/ru_snippet.py file:start:end` re-decodes a key line with beam search. Machine Russian needs a human pass: correct from context, then translate |
| **Separate audio recorder ↔ clips** | match by clock (recorder file mtime = end of recording, Mac in GMT vs iPhone +03:00; aac durations from ffprobe are off by up to 20 s) **and** by onset-envelope cross-correlation (`work/audio_sync.json` in aij-shorts); trust peak/std > 15 |

- **Storage rule (Paul, 2026-10-12): keep only finals; intermediates are temporary.** Finals always go to the Desktop delivery folder.
  `scripts/cleanup_intermediates.py` runs daily at 10:00 (LaunchAgent `com.paulfunchious.cleanup-intermediates`). When a project has been untouched for 15 days, its media intermediates go to the Trash:
  matte frames, renders, work/qa/scan media, re-encoded cuts and voice stems.
  It never touches notes/json/scripts, assets/audio SFX or music, the hook library, raw*/originals, or projects with a `.keep` file. Log: `~/hyperframes-student-kit/cleanup.log`.
  Before delivering, always copy the final to the Desktop: anything left only in `renders/` will be cleared.
- **API keys:** `~/.claude/skills/.media-secrets.env` holds Pexels, Freesound, Gemini and Anthropic keys (verified 2026-10-02). Never print them.
- **Audio targets:**
  - Long-form master: two-pass loudnorm to −14 LUFS / −1 dBTP.
  - Reels: voice normalised to −16 LUFS before mixing, master around −14.
- **HyperFrames rules:**
  - No CSS infinite keyframes, `setInterval`, `repeat:-1`, `Math.random` or async timeline building.
  - Use `gsap.set` (not `tl.set` at 0) for initial hidden states, and `immediateRender:false` on late `fromTo` tweens.
  - Don't put a CSS `transform` on elements that GSAP moves.
  - Animate the footage wrapper, not the `<video>`.
  - Hide a video element with `clipPath`, not opacity.

**Asset library** (`~/hyperframes-student-kit/asset-library/`):

| Folder | What | Use | Licence |
|---|---|---|---|
| `overlays/scribbles/` | 7 white hand-drawn doodles, ProRes 4444 alpha, ~2.7 s | playful callouts, arrows on demos | Studio Dusk pack |
| `luts/vivid/` | 5 `.cube` LUTs | on Paul's camera: **4** = clean contrast (best skin), **1** = warm; 3 over-saturates reds | Studio Dusk |
| `html-comps/` | 25 HyperFrames comps (hook_slam, thesis_pop, fear_callout, the_rule, triumph_text, benefits_list, end_card, subscribe_cta, lower_third, callout, data_viz, saas_demo, ui_animation…) | starting points: restyle with the project tokens, don't ship old copy | Paul's own |
| `sfx/` | UI pop (Pixabay), shimmer sting (Paul's generation) | keyword pops, logo reveal | commercial OK |
| `subscribe/` | **Paul's like + subscribe card** `paul-subscribe.mov` (1400×400, 6 s, alpha + click SFX) + preview | once per video at 60–80% runtime, ~25–30% frame width, top/bottom-right in the safe zone, never over the face or the end CTA, click SFX ≤10% under voice | own + official YouTube icon |
| `brand/youtube/` | official YouTube icon pack | unaltered only | brand.youtube |
| `brand/logos/` | official SVGs: Photoshop, Illustrator, CorelDRAW, OpenAI/ChatGPT, Gemini, Pinterest | a logo pop (~1.2 s) when a tool is named | Simple Icons (CC0 data) |
| `fonts/` | Conthrax, Ethnocentric, Nasalization, Neuropol, Game Of Squids | tech display headlines only | commercial OK |
| `editing-techniques/strips/` | 21 evidence sheets (8 frames per row at technique moments) | see §7 | research |

- **Subscribe card beats:**
  - card rises 0.05–0.6 s
  - like click 1.38 s
  - Subscribed 2.40 s
  - bell 3.30 s
  - exit 5.45–5.9 s
  - Source: `video-projects/subscribe-card/index.html`.
- **Reference only, can't run in our pipeline:** DaVinci `.drfx` packs (sliding words, typewriter dot cursor, peephole, credits) and Premiere/AE packs.
  Rebuild the look in GSAP.
- **Don't use** personal-use fonts (Space Age, 911 Porscha, Star Jedi, Batman Forever) or another channel's badges.
- **Meme starter library:** `video-projects/reels-shared/hook-library/catalog.json` has 15 Pexels clips tagged by mood
  (shocked, facepalm, celebrate, mind-blown, laughing, embarrassed, shocked-at-screen…).

---

## 4. The research: three reference channels (2026-10-03)

Paul's long-form follows **@Kaye.creates**, **@SatoriGraphics** and **@MoneyDegree**. Measured over 12 videos (4 each):
- full transcripts
- an Apple Vision scan of every second (faces + on-screen text)
- cut detection
- audio signal analysis (bed level and changes, transient sync to cuts, voice pitch)
- motion strips at every kind of picture change

Limits: audio was measured, not heard. At 360p, tiny UI text isn't read. Emotion is inferred from delivery, script and frames.

| | Kaye.creates (41K) | Satori Graphics (1.6M) | Money Degree (79K) |
|---|---|---|---|
| Top recent | Red Bull F1 AI ad 268K (2.6× median), 11M-views workflow 263K | Design teachings 128K (6×), Design thinking 123K (5.8×) | Stickman course 120K (7.2×), Fruit drama 119K (7.2×) |
| Length | 8–18 min (median 11) | 10–28 (median 11) | 11–24 (median 18.5) |
| Presenter | her, on camera, styled room, 2 angles | **faceless** VO; face ~20% in some | **AI avatar** (neon studio) + corner bubble |
| Hook | **result first** (40 s of the finished ad), then "See that video? I made it…" | contrarian teaching, visualised from frame 1 | 60 s of pure motion graphics: money counters, view counts, examples |
| Speech | ~176–190 wpm | ~165–169 wpm | 210–228 wpm |
| Visual change | hook 51 cuts/min, body every 3–5 s | one designed world; shots 9–16 s but motion never stops | hook 10 cuts/min + constant motion; body 4–8 s |
| Look | warm styled set, italic-serif accents, painted chapter cards, white doodles, blue word cards, scrapbook proof | electric-blue gradient or off-white world + one accent (orange), glass numeral tiles, 3D posters/busts, frosted NOTE cards, "RULE NO.1" on grid paper | light-blue/dark UI world, YouTube-UI mockups, rolling counters, flying cash, faceless "BEGINNER" mannequin, chalkboard mind-map, heavy yellow condensed headlines |
| Structure | STEP 1…4, final reveal, how to pitch it | named concepts as chapters (Visual Debt, Explanation Tax…) | niche proof → full process (STEPs) → free method vs faster route |
| Description | prompts link (blog/Notion) + tool link + spec-ad disclaimer | sponsor link + related video + SEO paragraph | long SEO paragraph + what you'll learn |

**Measured profile:**

| | Kaye (Mode A model) | Satori (Mode B calm) | Money Degree (Mode B energetic) |
|---|---|---|---|
| Talking head on screen | 37% | 9% | 9% (avatar) |
| Designed text cards | 15% | 31% | 13% |
| Longest head hold | 23 s (usually 8–15) | 18 s (usually ≤9) | 12 s (usually ≤8) |
| New big on-screen text | 8.4/min | 9.6/min | 5.4/min |
| Voice pitch movement | 3.7 st (animated, warm) | 2.7 st (calm authority) | 3.9 st (excited) |
| Music bed under voice | −19 dB | −25 dB | −19 dB |
| Music changes at chapters | 36% | 66% | 74% |
| SFX synced to cuts | light (1.1× chance) | none (0.9×) | yes (1.6×) |

**Emotion:**
- **Kaye: "come into my creative space."** Lamp-lit room, a soft voice that rises on reveals, personal ("I", "my").
  Wonder plus "I can do this too". Peaks on the result reveal and the stat.
- **Satori: calm expert, stakes then relief.** Cool blue or off-white, a slow steady voice, classical busts.
  It raises fear ("low-end designers will be removed") then reassures. Sounds premium because it never rushes.
- **Money Degree: opportunity rush.** Counters, flying cash, fast narration. FOMO plus "this is easy and it's free".
  Every chapter re-promises ease.

**The shared engine (copy this):**
1. **Proof in the first 3 s, with a number.** The result on screen plus "11M views / $10K a month / Apple commented".
2. **Frame → promise → roadmap inside 60 s.**
3. **A series or stakes device** ("episode 2 of fake commercials for billion-dollar brands until they notice me").
4. **Numbered STEP chapters**, each opened by a designed card. YouTube chapters go in the description.
5. **Every claim gets a visual.** Never a talking head alone for long.
6. **One designed world per channel**, used every video.
7. **Resource payoff:** the exact prompts as a link/PDF. The video is the demo; the doc is the take-away.
8. **The editing lives inside shots.** About 90% of transitions are hard cuts; motion comes from crops, zooms, overlays, typing and objects.

---

## 5. Paul's long-form format: "AI Labs"

**Length:** 10–16 min (courses up to 24 only when the steps need it).

**Design world (fixed for every video):**
- **Graphics ground:** deep electric-blue gradient `#0B1BFF → #050A3A`. Evidence cards on off-white `#F4F3EE`.
- **Accent: lime `#D8F34A`** (one accent only). Red `#FF3B30` only for warnings or "don't".
- **Type:**
  - Anton (heavy condensed) for chapter numbers and headlines
  - Plus Jakarta Sans for body
  - Playfair Display *italic* for accent words
  - Never Inter/Roboto as the display face.
- **Recurring objects:** glass numeral tiles (chapter openers), lime highlighter boxes, real tool logos, and
  **Paul's cartoon self** (from /cartoon) as the viewer-stand-in mascot.
- **Captions:** phrase captions with lime italic-serif accent words, and **text masking** for the one keyword per chapter (Mode A).
- **History:** the first long-form (v3) and the 5 reels shipped in Kallaway "Aurora Glass" (`#0A0E14` glass, `#37BDF8` blue, Plus Jakarta/Inter).
  - The "Skill Wall" (12 glass sockets that fill as the video goes) and a `5/12` progress badge come from that edit.
  - Keep Aurora Glass only to continue that series. New work uses the lime/blue world above.

**Episode skeleton (12 min example):**

| Time | Beat | On screen |
|---|---|---|
| 0:00–0:05 | **Result + number** | the finished thing full-screen + the stat ("this flyer took 40 seconds") |
| 0:05–0:20 | Frame / stakes / series | Mode A: Paul, masked headline behind him · Mode B: avatar + motion graphics |
| 0:20–0:45 | Promise + roadmap | "By the end…", glass tiles 1–4 build in |
| 0:45–1:00 | Credibility / why now | proof collage (comments, view counts, before/after) |
| 1:00–10:30 | **STEP 1…n** | chapter card → screen demo (tool UI cropped, face/avatar bubble) → result reveal → one designed explainer card per idea |
| 10:30–11:30 | Final reveal + how to use it (sell, pitch, post) | before/after, money/brand angle |
| 11:30–12:00 | CTA | prompts PDF link card + subscribe card |

**Pace targets:**
- Speech 170–190 wpm (Paul), ~200 wpm (avatar VO).
- A visual change every 3–5 s in minute 1 and every 4–8 s in demos.
- Head alone at most ~10 s (A) or ~8 s (B).
- One designed card every 30–60 s.
- 6–10 big text moments per minute.
- At least one *result/evidence* shot per minute.

**Script devices, in order:**
1. **0–3 s: proof + number.**
2. **3–30 s: stakes / series frame / contrarian claim.**
3. **≤60 s: promise + roadmap** ("by the end you'll be able to… four steps").
4. **~1:00–1:30: completeness + early ask** ("everything is in this one video, all I ask is a like and a comment").
5. **Every chapter: a bridge line** ("Now that we have X, the next thing is Y") **+ an importance flag** ("watch closely").
6. **Micro open loops every 2–3 min**, and close them.
7. **The resource at the moment of need** ("the exact prompt is in the PDF").
8. **A mid-video re-hook at 40–60%:** a surprising result, a new number, or "the part that feels like cheating".
9. **Final reveal + a one-line recap** + "you can do this today" + a next-video pointer. Subscribe ask near the end.
10. **One whole-video visual loop:** a corner counter pill (cost, credits, time, designs made) that ticks up at every step.
    - It gets named as a question mid-video and is closed by the final reveal.
    - Pair it with a **result reprise** at 50–60%. See §6.

### Mode A: on camera (Kaye model, with Satori cards)
- **Set:** warm practical lamp, layered background (shelf, plants, art), two angles (wide + close) or punch-in crops (1.0 ↔ 1.35).
  The close angle is for emphasis lines, about once a minute.
- **Picture mix:** talking head ~35%, demos with a face bubble ~25%, results/B-roll ~25%, designed cards ~15%.
- **Text:** phrase captions (lime italic-serif accents), one masked keyword per chapter, chapter cards, white doodle arrows on demos, proof collages.
- **Voice:** 170–185 wpm, warm, rising on reveals.
- **Workflow:**
  1. Film plus screen-record every step at 1080p+.
  2. Kit cut with the energy method, then `cut-review.py` for Paul's approval.
  3. HyperFrames design pass.
  4. SFX matched to actions.
  5. Master + chapters + description + resource PDF.

### Mode B: avatar / faceless (Satori world + Money Degree drive)
- **Picture mix:** avatar ~10–25% (intro, chapter openers, outro) + a corner bubble over demos; cards ~30%; demos ~35%; results/B-roll ~25%.
- **World:** the electric-blue gradient (calm topics) or a bright UI-mockup world (money/tool topics).
  Glass tiles, frosted NOTE cards, rolling counters, YouTube-UI mockups, cartoon mascot.
- **Script first** (~1,900–2,300 words for 12 min, written for the ear: short sentences, bridge lines).
  **Paul's real voice** in one take is best. A clone only from his own consented samples.
- **Avatar:** from his own photos/footage only, with an AI disclosure.
  - Options: ChatCut digital human (`chatcut-digital-human`), Higgsfield (credits), HeyGen (separate subscription).
  - **Test 60 s with one tool before a full episode.**
- **Sound:** bed −20 to −24 dB, a change per chapter, SFX synced to cuts and graphic actions (energetic topics).

---

## 6. Deep-dive: Kaye's Red Bull video (zZ1bgIaoPas), editing style

18:00 · 268K views · 230 shots · 12.8 cuts/min overall. The YouTube chapters don't match the on-screen STEP cards, so the structure below follows the cards.

| Section | What | Shots | Cuts/min | Median shot |
|---|---|---|---|---|
| 0:00–0:40 | **Cold open: the finished ad, no talking** | 45 | 67.5 | 0.5 s |
| 0:40–1:25 | host intro + series hook | 13 | 17.4 | 4.0 s |
| 1:25–2:59 | why Red Bull + the plan | 21 | 13.3 | 2.7 s |
| 2:59–8:21 | STEP 1 assets | 42 | 7.8 | 5.1 s |
| 8:21–10:49 | STEP 2 video prompting | 19 | 7.7 | 6.6 s |
| 10:49–11:00 | **ad reprise: scenes 1–3** | 10 | 54 | 0.7 s |
| 11:00–12:08 | credit-saver tip ("99% of creators…") | 8 | 7.1 | 7.7 s |
| 12:08–14:37 | STEP 3 Blender + Opus | 25 | 10.0 | 5.5 s |
| 14:37–15:26 | STEP 4 Genjutsu match cuts | 7 | 8.6 | 5.9 s |
| 15:26–15:36 | **scene-5 payoff: bull ↔ car strobe** | 23 | 137 | 0.2 s |
| 15:36–18:00 | assembly, **credit reveal**, how to pitch, CTA | 17 | 7.1 | 9.7 s |

**The shape:**
- The video alternates a burst with calm teaching three times, then ends calm.
- **The bursts are always the product.** Teaching never goes faster than ~8 cuts/min. Its energy comes from layers (cards, memes, UI, the counter).

**Cold open, built shot by shot:**
- an 8.6 s sensual hold on the driver
- 1–1.7 s hand close-ups doing one action each (can on ice, ring-pull macro, pour into the fuel cap)
- the livery charging with lightning: energy shown as **light on the brand mark**
- one 4.4 s human beat (her in the cockpit)
- a **strobe cross-cut** of car POV ↔ charging bull every 0.1–0.2 s, which is the whole video's thesis in 2 s
- the climax at 0.2–0.3 s
- exit via a ~0.3 s **dissolve into the room**, the only dissolve in the video
- **The first words:** "See that video right there?"

**Presenter world:**
- One styled set (ochre couch, orange arc lamp, poster, plants) with two angles.
- **The topic is composited into the room:** last episode's giant pink Apple sits beside her, and the Red Bull logo card is on the wall.

**Tools, results and proof:**
- Dark UI crops with the lime Generate button.
- Long prompt pages full-frame. These are unreadable, and show effort; don't copy them, zoom to the one line instead.
- Result cards **float over the blurred room**.
- Asset sheets as quick 1–3 s grids; Blender viewport on white.
- Film frames in a row as the reference.
- The edit timeline as a lower box over the wide shot.
- YouTube comments full-frame; credit usage cards as a lower box.

**Retention devices:**
1. **A result-first cold open**, so the question becomes "how did she do that?"
2. **The running credit counter.**
   - A yellow pill top-right appears at 2:14 at 000 and climbs at each spend: 20 → 30 → 40 → 79 → 118 → 892 → 1,292 → 1,448 → **1,547**.
   - At 12:00 she asks "what number will we land on at the end of the video?"
   - It closes with the "grand credit reveal" at 16:43: a 14-minute open loop that needs no words. **The single most reusable device.**
3. **Ad reprises as progress checks** (10:49 scenes 1–3; 15:26 the finale).
   The full ad is **not** replayed at the end; the payoff is the *cost number*.
4. **STEP cards on a hero still** of what that step produces ("#STEP 1 ASSET" small, lower-left).
5. **Stakes lines at breaks:**
   - "I've wasted hundreds of dollars in credits testing this so you don't have to"
   - "99% of creators get completely wrong"
   - "trust me, you do not want to skip this reveal"
6. **Memes every 1.5–2 min, 1–3 s.** Framed small on brand blue for asides; full-frame for loud reactions.
7. **A mid-video commitment ask** (4:55). Hers is a guilt trip ("if you're just here to passively watch…"); **don't copy the guilt**.
8. **A series frame + a next-episode tease:** a row of brand logos at the end ("who's next?").

**Text:**
- **Italic serif pop words** beside the face, word by word in sync with speech.
- **Blue word cards:**
  - royal-blue full-frame, with a faint line-drawing pattern that **matches the topic** (race cars behind "rule #1")
  - words appear one per spoken word, with a 2-line subtitle and a slow drift
  - 5–10 s, every 2–3 min, for rules and section turns only
- **Brand slam:** "RED BULL" frame-filling with torn edges, shrinks to a small label in ~0.3 s.
- **Labelled brand B-roll:** one lowercase word per clip ("breakdancing"), with a media credit.
- **Bullet checklist** beside her for a step's plan.
- **Single big words** ("raw" … "unstoppable") before the climax.

**Sound (measured):**
- A continuous bed at −19 dB: quieter in teaching minutes (−23), louder in hype (−17).
- Inserts carry their own audio.
- Only 20% of chapter starts change the music.
- **No SFX on cuts** (0.9× chance).
- Very animated voice (pitch σ 4.25 st), 160–190 wpm.

**What to steal for Paul:**
- Open on his finished piece (20–40 s, no talking) → "See that right there?" → a soft dissolve into the set.
- A two-angle set with italic-serif words in the negative space.
- Composite the topic into the room.
- A **counter pill** across the video, closed by a reveal.
- A mid-video result reprise; end on a number.
- STEP cards on hero stills.
- Blue word cards with topic sketches (AI Labs blue + lime).
- Memes framed on brand colour.
- A next-episode logo tease (official files only).
- All of it except the room works for Mode B.

---

## 7. Editing technique library (62 techniques)

From frame-by-frame study. Evidence codes:
- **K#n / S#n / M#n** = row n in `asset-library/editing-techniques/strips/<Channel>-NN.jpg` (8 rows per sheet).
- **RB** = Red Bull timestamp (`research/longform-teardown/redbull/`).

Mode: **A** = on camera, **B** = avatar/faceless. ✅ = we have it · 🔨 = to build as a HyperFrames component.

> Almost every transition is a hard cut. The editing lives inside the shots.

### 7.1 Transitions
| # | Technique | Seen | What / when | Mode | Build |
|---|---|---|---|---|---|
| T1 | **Hard cut (default)** | all | face→screen→card→face, straight cut on a word; 90%+ of changes | A B | ✅ |
| T2 | **Two-angle cut** | K#9 K#13 K#46 | wide ↔ close of the same take every ~5–15 s; hides jump cuts | A | ✅ crop-zoom fake (1.0↔1.35) |
| T3 | **Dip to black → result fades up** | M#1 S#2 | before a finished result; 0.3 s down, 0.4 s up | A B | 🔨 `dip-reveal` |
| T4 | **Blur dissolve** | S#1 S#16 S#23 | graphic blurs into the next shot (~0.5 s); calm topics | B | 🔨 `blur-through` |
| T5 | **Zoom-blur / radial warp** | S#21 S#25 | rare punctuation into a RESULT section | B | 🔨 `warp-in` |
| T6 | **Solid-colour flash cut** | S#24 | hard cut to a full brand-colour frame with a word sliding in ("ALSO"); section pivot | A B | 🔨 `color-slam` |
| T7 | **Diagonal panel wipe** | S#30 S#31 | coloured diagonal panel carries a heading ("WHAT YOU SHOULD DO INSTEAD"); contrast | A B | 🔨 `diag-wipe` |
| T8 | **Presenter push-off** | M#20 M#22 M#36 M#43 | face/avatar frame slides out revealing the next layer | B (A) | 🔨 `push-reveal` |
| T9 | **Card swipe-off** | S#42 | box swipes up revealing the next line | B | 🔨 `swipe-off` |
| T10 | **Light-leak flash** | K#53 | warm glow frame before a cinematic result | A | 🔨 `light-leak` |
| T11 | **Strobe cross-cut A↔B** | RB 0:27 15:31 | two related shots alternate every 0.1–0.3 s (car ↔ bull); only inside a result, never around talking | A B | ✅ frame-exact EDL |
| T12 | **One soft dissolve out of the cold open** | RB 0:40 | ~0.3 s crossfade from the last result frame into the presenter; the only dissolve | A B | ✅ |

### 7.2 Showing a screen / tool demo
| # | Technique | Seen | Details | Mode | Build |
|---|---|---|---|---|---|
| D1 | **Tight crop + slow push-in** | K#1-4 K#15 | never the whole desktop; crop to the panel, 1.0→1.08, cursor visible | A B | ✅ |
| D2 | **Smooth camera glide to the next click** | K#52 K#54 | Screen-Studio style ease in-out with slight motion blur | A B | 🔨 `screen-cam` |
| D3 | **Punch-zoom to the evidence line** | S#17 S#18 | 0.25 s zoom into the one sentence/number that proves it | A B | 🔨 `evidence-zoom` |
| D4 | **Device mockup on brand gradient** | S#3-5 S#9 S#22 S#26 | recording inside a 3D monitor/phone, perspective tilt, slow drift | B | 🔨 `device-frame` |
| D5 | **Face bubble (circle, bottom-right)** | K#6-8 K#29 K#35 | ~18% width, soft glow ring | A | ✅ (reel face ring) |
| D6 | **Avatar box (rounded square)** | M#8-13 M#28-31 | always present during demos | B | ✅ (adapt ring) |
| D7 | **Handwritten labels + arrows on UI** | K#35-37 | white script labels ("UPLOAD") with curved arrows | A B | 🔨 `ui-callout` |
| D8 | **UI element lifted out** | K#11 K#17 | cropped UI piece floats over the talking head as a card | A | 🔨 `ui-lift` |
| D9 | **Caption under the demo** | K#29 K#41 | small lowercase captions keep running over recordings | A B | ✅ |
| D10 | **Generation grid fill** | K#16 K#20 K#45 M#12-13 | results appear tile by tile into a grid | A B | 🔨 `grid-fill` |
| D11 | **Labelled brand B-roll** | RB 1:28 | official footage, 1–4 s per clip, one lowercase word = the spoken word, credit in the corner | A B | 🔨 `label-broll` |
| D12 | **Checklist beside the presenter** | RB 3:02 | a step's plan stacks up as bullets next to the face as spoken | A | 🔨 `side-list` |

### 7.3 Results, proof and reviews
| # | Technique | Seen | Details | Mode | Build |
|---|---|---|---|---|---|
| P1 | **Result-first cold open** | RB 0–40 s | finished piece full-screen before a word is spoken | A B | ✅ |
| P2 | **Stats screenshot + result in rounded frames** | K#28 | analytics + result side by side, then slide away to the presenter | A B | 🔨 `proof-pair` |
| P3 | **Gallery card on paper** | K#14 K#38 | result centred on beige paper with a small caption | A | 🔨 `gallery-card` |
| P4 | **Vertical result on dark grid** | M#1-6 M#27 | 9:16 result centred on a dark grid | B | 🔨 `vertical-stage` |
| P5 | **Shorts-card fan-out** | M#14-15 | example Shorts (thumb + title + views) fan into a row | B | 🔨 `shorts-fan` |
| P6 | **Before/after** | S#39 S#53-55 | side by side, then focus one; we also have slider/flip/peel/stack/key-press reveals | A B | ✅ |
| P7 | **Community proof scroll** | S#14-15 | Reddit/comments full-frame | A B | ✅ capture.mjs |
| P8 | **Stat pills + growth line** | M#16 | "18M ↑" pills + a green line drawing upward | B | 🔨 `growth-pills` |
| P9 | **Stat card** | M#45 | "100 VIEWS" big over a play tile on a gradient | B | 🔨 `stat-card` |
| P10 | **View badge / episode pill** | K (1.1m) K#46 | small persistent corner badge: views or episode number | A | 🔨 `corner-pill` |
| P11 | **Running cost/credit counter** | RB 2:14→16:43 | corner pill from 000, ticks up at every spend, named mid-video, closed by a reveal | A B | 🔨 `counter-pill` |
| P12 | **Result reprise as progress check** | RB 10:49 15:26 | replay finished scenes at full pace mid-video; end on a number, not a replay | A B | ✅ |
| P13 | **Result floats over the blurred set** | RB 6:08 7:01 | result card centred over the presenter shot, blurred | A | 🔨 `blur-float` |

### 7.4 Typography and cards
| # | Technique | Seen | Details | Mode | Build |
|---|---|---|---|---|---|
| X1 | **Chapter title on a painted scene / hero still** | K#0 K#23 K#32, RB STEP cards | "STEP 3" serif typed over a painted landscape, or "#STEP 1" small over the step's best result | A | 🔨 `chapter-paint` |
| X2 | **Dictionary-entry card** | K#23 K#31 K#40 | "TERM *noun* — definition — – Paul :)" | A B | 🔨 `define-card` |
| X3 | **Full-screen word card** | K#42, RB 3:10 5:15 | brand-colour card + topic-matched line sketches, serif words one per spoken word, tiny subtitle | A B | 🔨 `word-card` |
| X4 | **Handwritten note on B-roll** | K#27 | script note with an underline swoosh | A | 🔨 `hand-note` |
| X5 | **Frosted NOTE card, synced typing** | S#45-48 | glass card; body types with the VO | B | 🔨 `note-card` |
| X6 | **3D extruded word** | S#1 S#41 | one concept word as a 3D block | B | 🔨 `block-word` |
| X7 | **Numeral glass tile** | S (eQEaF hook) | glass app-icon square with the number, title types beside it | B (A) | ✅ Kallaway tiles |
| X8 | **Attention flag** | M#23 | "WATCH CLOSELY" condensed white + red over a darkened collage, 1–1.5 s | A B | 🔨 `attention-flag` |
| X9 | **Letter dissolve / letter fade-in** | S#32 S#43-44 | calm premium per-letter entrances/exits | B | 🔨 per-letter spans |
| X10 | **Small lowercase full captions** | K (11M video) | tiny quiet captions at the bottom | A | ✅ |
| X11 | **Masked headline / italic-serif accents / highlighter** | Paul's refs | §9 | A B | ✅ |
| X12 | **Brand slam** | RB 1:24 | name frame-filling with torn edges shrinks to a small label in ~0.3 s | A B | 🔨 `brand-slam` (text, not a logo) |
| X13 | **Single big words before a climax** | RB 15:23 | centred serif, one word at a time, hard cut into the payoff | A B | ✅ |

### 7.5 Characters, mascots, stickers
| # | Technique | Seen | Details | Mode | Build |
|---|---|---|---|---|---|
| C1 | **Viewer stand-in** | M#16-17 M#55 | blank mannequin labelled "BEGINNER" pointing at the viewer → use **Paul's cartoon self** | B | 🔨 cartoon poses |
| C2 | **Cartoon persona with speech bubbles** | S#26-27 | small character reacts in comic bubbles | B | 🔨 `persona-bubble` |
| C3 | **Classical bust + orbiting badges** | S#10-13 | spheres orbit a bust and turn into icon badges as items are named | B | 🔨 `orbit-bust` |
| C4 | **Stickers on the talking head** | K#17 K#21 | result images with white borders + handwritten labels pop beside the speaker | A | 🔨 `sticker-pop` |
| C5 | **Reaction meme insert** | K#48, RB | 1–3 s right after a punchline; framed on brand colour for asides | A B | ✅ hook-library |
| C6 | **Topic composited into the set** | RB 0:44 0:54 | last episode's object or the brand card placed in the room, then dissolves | A | 🔨 `set-composite` |

### 7.6 Motion and objects
| # | Technique | Seen | Details | Mode | Build |
|---|---|---|---|---|---|
| O1 | **Design as a 3D object, layer by layer** | S#33-38 S#49-55 | rotates in perspective, pushes into a detail, layers slide in (use Paul's own designs) | A B | 🔨 `layer-build` |
| O2 | **Constant slow drift** | S all | every graphic moves a little; never a frozen card | B | ✅ |
| O3 | **Icon tiles assemble / fan out** | M#18 M#21 M#43-44 | tiles or "PROMPT" badges pop in one by one | B | 🔨 `tile-row` |
| O4 | **Resource CTA card** | M#19 | centre card with platform logos bouncing in | A B | 🔨 `resource-card` |
| O5 | **Self-drawing dotted line** | S#40 | a dotted path draws between ideas | A B | 🔨 `draw-path` |
| O6 | **Next-episode logo tease** | RB 17:47 | candidate brand logos pop beside the presenter ("who's next?"); official files | A B | 🔨 `logo-row` |

---

## 8. Short-form: reels, Shorts, intros

**The first gate:** in the first 3 seconds, is someone convinced to watch to the end?
- Build **three different openings** from the same truthful speech, compare them, and record why one won.
- The opening must work **muted**. No logo bumper, no added silence, no effect before the idea.

**Story formats** (Kallaway's Storytelling Template Database, in our words; pick one before cutting and write it in DESIGN.md):

| # | Format | Beats | Outlier factor |
|---|---|---|---|
| 1 | Hero's journey | problem → failed attempts → new solution → why it worked | viewer feels your pain |
| 2 | **Personal learning** | proof first → backstory → insight → step-by-step → CTA | undeniable visible proof + a non-obvious method |
| 3 | Origin story | normal life → trigger → epiphany → change → mission | trust, not expertise; pin it |
| 4 | **Before / after** | tease → before → tension → reveal → (effort) → CTA | size of the gap; reveal on a beat; **15–30 s ideal** |
| 5 | Goal / dream | origin → decision → progress → next → "follow along" | ambitious enough to doubt |
| 6 | Challenge | stakes → rules → obstacles → result or cliffhanger | grand objective, real roadblocks |
| 7 | Win | the win → proof → what it means → next goal | visual proof, raw and short |
| 8 | Day in the life | identity → morning → work + complication → wind-down | something unexpected |
| 9 | Personal update | tease → context → news → why | behind the curtain |
| 10 | Mentor story | who → their situation → lesson → how you applied it | name them; lesson as a quote |

- Paul's AI-design tool demos are mostly **#4 Before/After** (old photo → HD, sketch → product, flyer → my brand) or **#2 Personal learning**.
- The first five reels ran 32–52 s; aim for **15–30 s** for before/after.

**House layout used so far (Kallaway vertical, 1080×1920):**
- the screen recording in an edge-lit glass panel with a content-following camera
- the face in a glowing ring below (hidden via clipPath when there is no face)
- captions of ≤3 words per group, the spoken word lit in the accent colour, ASR typos fixed
- each payoff is a different reveal (slider, flip, peel, stack, key press)
- an end card with the series wall + "FULL VIDEO · LINK IN DESCRIPTION ↓"
- Open loops come from the series: "11 more skills".

**Safe zones (9:16):**
- Keep text inside x 90–990, y 200–1600.
- App UI: avoid the top 14%, the right 14% and the bottom 22%. Top cards at most 22% tall.
- Never two cards at once; about one card every 4–6 s; none in the first second unless it is the hook subject.

**Meme and transitional hooks (Paul, 2026-10-02: "use it when it's appropriate"; future reels only):**
- **Transitional hook (0–1.5 s opener):** when the footage can't stop the scroll itself.
  It must set up the tension the first line resolves ("No photographer?" → a photo-shoot fail → hard cut to the AI product shot).
- **Reaction insert (0.8–1.5 s):** only right after a punchline, question or reveal, and it must *answer that line*.
  At most 2–3 per reel, in bursts around a reveal, none while the viewer reads a demo.
  Skip memes when the result itself is the hook.
- **Sources:**
  1. `hook-library/catalog.json` (Pexels)
  2. original Higgsfield clips (quote the credits first)
  3. hook sites (transitionalhooks.com, viralhooks.org, malloy.sg) **only when nothing else fits, flagged**.
     Their clips are other creators', unverified, and need permission for commercial use.
  - Never TV, film or sports.
- **Build:**
  - The insert sits inside the reel's media panel (not letterboxed on black) and captions hide during it.
  - The voice pauses (inserted time) while the clip's own audio plays, with one hit SFX on the impact frame.
  - Hard cut in and out, on the reaction's peak frame.
  - Log it in `assets/footage-ledger.json` with the line it answers.
- **Lessons from Paul's own short** ("I Used AI Avatars…", FgBxKtfIjn4):
  - What works: a batting-cage hook clip resolved by the cut to the speaker; "What?" → a "what?" reaction (the joke is words and reaction agreeing); authority clips turn an opinion into consensus.
  - What held it back: the AI-avatar trust problem, memes letterboxed at low resolution, tiny one-word white captions, recognisable TV/film/NBA clips (claim risk), memes that don't answer a line.
- **Pinterest:** use text-overlay hook ideas as inspiration for hook *text*, not as assets.

**Posting:**
- TikTok and IG don't make caption links clickable: put the long video in the bio and say "link in bio".
- On YouTube Shorts, set the full video as the **Related video**.
- Post the strongest first, 1–2 days apart. Reply to first comments within the hour. Use the first frame (hook text + result) as the cover.
- Pinned comments ask a cheap question ("Drop your price 👇", "Comment CARTOON…").

**Accounts (advice given 2026-10-02):**
- **TikTok:** stay personal. Business accounts are limited to the Commercial Music Library, so trending songs are missing.
- **Instagram:** use a **Creator** account, not Business (insights, plus a fuller music library).
- **YouTube:** no difference.
- Switch to business only when running paid ads or lead forms.
- A post that directly advertises a paid offer should use commercial-safe sounds on any account.

## 9. Caption and type styles (Paul's references, 2026-10-02)

Use per beat, not all at once.
1. **Text masking: the headline behind the person.** ★ priority
   - **Layers:** footage → headline → a person cut-out on top (Apple Vision matte, `person_matte.swift`, ~0.2 s/frame, clean at 1080×1920).
   - **Type:** Anton / Bebas Neue (condensed uppercase, ~300–420 px, full width), or Archivo Black / Poppins Black (rounded heavy, a colour word, wall-sign shadow).
   - The text sits in the top third so the head overlaps its lower half. Hold 1.5–3 s.
   - Use it for the one keyword of a section; the head must actually overlap the letters.
2. **Editorial mix:** bold sans (Plus Jakarta / Inter Tight 700–800, white) + **italic serif accent words** (Playfair / Instrument Serif), larger and coloured (lime `#D8F34A` or cyan `#7FF5F0`).
   Optionally one giant italic word, or a small lime box behind a number. For hooks and key lines (1–2 per video).
3. **Highlighter / selection box:** lime blocks drawn left→right behind key words, with text-selection handles (white on dark clothing).
   For CTA and comment-keyword moments ("Comment 'AI'…").

**Rules:**
- Words animate on their spoken onset (within 2 frames).
- Captions are never held >0.3 s past the last word; a new line at each pause.
- Regular captions stay calm and readable.
- **Reference build:** `video-projects/ai-labs-intro/build.py` (`.mlayer`, `.cap span.acc`, `.hw` highlighter with `.hA/.hB` handles, cut-out layering).

**Long-form text-hook pattern** (planned for "Become a Graphic Designer With AI"):
- 2–6 words, top third, pops on the word, 1.5–2.5 s, one element at a time.
- A one-line promise under every section card ("Paper sketch → product ad").
- A persistent progress badge (`5/12`).
- "Free tool coming up 👇" mid-video loops, "⏩ 8×" tags on speed ramps, "Wait for it…" (2–3 times max).
- PROMPT cards (2–3 s, screenshot-worthy), shortcode pills (`/cartoon`) with a ding, TIP tags, Before/After labels.
- CTAs: "200 shortcodes: free PDF in description ↓", subscribe right after the best reveal, "Comment the number 👇" at the end.

## 10. Sound

> The full sound-design system (sound vocabulary, action → sound map, layering, density, levels, the CC0 kit) is in **§20**. §10 holds the platform rules.

- **Reels:** voice + SFX only (no bed). Deliver the trending-sound note: name, start offset so the drop lands on the reveal, ~15–20% under the voice.
  If Paul shares the sound, time the edit to its beat or drop.
- **Long-form: YES to music, but never generic beds** (Paul, 2026-10-03).
  - When editing each new long-form, find the actual tracks the reference channels (Kaye, Satori, Money Degree) use in comparable videos, and source the same or close-matching music for Paul's video.
  - Identify tracks from descriptions/credits, Shazam-style lookup, or library search (they mostly use licensed libraries like Epidemic or Artlist).
  - Use a properly licensed copy only (the library Paul subscribes to, or YouTube Audio Library); never rip audio. Tell Paul if a track needs a subscription.
  - Mix like the references: bed −19 to −25 dB under voice (calmer videos lower), ducked under speech, change track at chapter breaks.
  - Do this per video at edit time, not in advance.
- **SFX:**
  - matched to the physical action (rule 4)
  - never two cues within 0.25 s, at most ~1 per 1.5 s on average; let some cuts pass silently
  - align the cue's peak to the landing frame
  - energetic videos may sync SFX to cuts and graphics (Money Degree, 1.6×); calm ones stay restrained (Kaye/Satori, no SFX on cuts)
  - keep SFX off consonants: in the pause after the word, or before it
  - list the cues in the reply (no HTML review page; Paul, 2026-10-05)
- **Mix:** voice normalised first, bed (when allowed) ducked under speech, two-pass loudnorm. Measure, don't assume.

## 11. Cutting rules and QA gates

**Cutting:**
- **Energy-based pauses** for every boundary (rule 1).
- **Last take wins**, unless it's broken; then keep the best complete take.
- A ≈1 s pause before a restart means the first run was abandoned.
- **Never stitch** two takes unless the join reads as one sentence. False start (the same opening restarted within ~2 s) → cut it.
- Meta talk ("wait", "let me do that again") → cut. Coughs and lip smacks → cut.
- Cut hesitation fillers; keep a "so"/"like" that carries rhythm. No machine-gun delivery.
- Repetition for emphasis, delivered cleanly both times → keep both. A script only breaks ties; never cut an improvised line for being off-script.
- Keep the pauses before a number or reveal and between list items.
- **Optional "shorter" pass** (mark these as judgement calls for Paul): a line said better later, a doubled "so, so", restating after the point lands.

**QA gates, before Paul sees anything:**
1. `cut-review.py --verify --open`: Paul approves the struck-through transcript. With local Whisper, single-word MISSING/SURVIVED flags are LOOK items:
   confirm them by energy or snippet. Long takes are noisy; shorts are reliable.
2. Read `paper-edit.md` straight through: every `<<n>>` join must read as a sentence.
3. Kit validators (`validate-plan.mjs`, `validate-footage.mjs`), `npx hyperframes lint`, and the project files:
   - plan.json, transcript.json, edit-decisions.json
   - OPEN-LOOPS.json, DESIGN.md
   - VERIFY.md, ENTERTAINMENT-REVIEW.md
4. Measure title-card and overlay coverage **from the picture** (e.g. luma spans), not from a hand list. Assert every card is covered.
5. Inspect encoded frames at every cut and transition. Check for stuck captions (a group shorter than its entrance tween), audio/video length mismatch,
   loudness, and fresh ASR across joins.
   Note: ffmpeg half-frame seeks can show blank tiles, so select by frame number.

## 12. Visual and design rules for every edit

- One clear attention target per moment. Every graphic beat is **an action with an outcome** (seat, check, flip, assemble), not a settle-and-freeze card.
  Adjacent beats must not look like the same reveal.
- Prefer real evidence: the real tool UI, real result, real page screenshot (scroll to the sentence + highlighter). Generated metaphors can't replace captured proof.
- A logo pop every time a brand is named (official file, ~1.2 s).
- Zooms alternate in and out; the frame never keeps creeping tighter. Footage moves only for meaning (impact shake, a settle on a reveal, a slow push on a conviction line).
- Grade with Vivid LUT 4 at ~60% for clean skin.
- B-roll only with a reason (context, emotional, symbolic, momentum). Each distinct B-roll scene is used once per video.
- Websites built for Paul follow his $10K checklist (point of view, paired type, 3–5 colours, hierarchy, commissioned-feeling imagery, crafted motion, mobile-first, fast/accessible).

## 13. Packaging: titles, thumbnails, descriptions, resources

**Title formulas that won for the reference channels:**
- "How I Made a $1M [BRAND] Commercial With AI (Full Workflow)"
- "How I Got [N]M Views With This AI Workflow"
- "The ONLY Video You Need To [Learn X]"
- "How to Make [X] With AI 100% FREE (Full Course)"
- "I Built a VIRAL [X] Using Only AI"
- Paul's: "Become a Graphic Designer With AI (No Photoshop Needed)"

**Thumbnail:** the result huge + Paul's face (or avatar) reacting + 2–3 words + one number when there is one.
No trademarked logos (write "NO PHOTOSHOP" instead of the logo). Test at ~20% size.

GPT-Image prompt template (attach his headshot `Downloads/paul funchious .png` as the reference):
```
YouTube thumbnail, 16:9, 1920x1080, ultra-sharp, high contrast, bold and clean.
SUBJECT: The man in the reference photo (keep his exact face, skin tone, beard, hair), right side of frame, chest-up,
turned slightly to centre, excited "you won't believe this" expression, one hand pointing left toward the design.
Black crew-neck tee. Soft key light from the left, crisp rim light, subtle teal glow behind his head.
LEFT SIDE: [the before → after of this video's best result], a glowing arrow sweeping from before to after, soft shadow.
TEXT (exactly this, top left, huge heavy condensed sans, white with thick black outline + drop shadow): "[2-3 WORDS]"
Below it, smaller, black text inside a lime (#D8F34A) highlighter box: "[2-3 WORDS]"
BACKGROUND: deep charcoal-to-navy gradient, soft vignette, faint dot grid. No clutter.
STYLE: modern high-CTR YouTube thumbnail, natural skin, readable at small size. No logos, no watermark,
no extra text, no misspelled words. Text must be spelled exactly: [the words].
```
- Generate 3–4 versions and A/B the text hooks. Examples: "AI DESIGNER / NO PHOTOSHOP", "NO PHOTOSHOP? / Use This Instead", "FREE DESIGNER / AI does it".

**Description template** (used for "Become a Graphic Designer With AI"):
1. 2-sentence summary with the keywords.
2. 🎁 a free resource line + link (`funchiousailab.com/toolkit`).
3. 🛠 TOOLS I USED with links.
4. ⏱ CHAPTERS (0:00 first; the numbered STEP titles).
5. 💬 one cheap comment question ("how much would you charge for the flyer at 5:10?").
6. 👍 a like/subscribe line + "New AI design tutorials every week" + handles (TikTok @funchiousai, IG @paulfunchious).
7. ⚠️ a responsible-use note when face/likeness tools appear. For spec ads of real brands: "spec ad, not affiliated with [brand]", and credit any official footage.
8. 8–10 hashtags.

**Resource PDF (lead magnet):**
- Every prompt from the video, organised by STEP, plus the tool list and bonus extras (e.g. the 200 image shortcodes, deduplicated and asserted exact).
- Paul's branding and name.
- Build: HTML → Chrome `--print-to-pdf` (`resources/build_toolkit.py`; output `AI-Designer-Toolkit-Paul-Funchious.pdf`, 12 pages).
- He hosts it on his site and the link goes in the description.

**Reel captions:** a one-line hook + "Full tutorial in bio" + 5 hashtags, plus a pinned-comment question.

## 14. Content ideas: how to generate them for Paul

Run every idea through this filter before pitching it:
1. **Can it open on a finished result with a number in 3 s?** (proof first)
2. **Is there a series frame or stakes device?** A reason to come back, and a loop for the whole video.
3. **Does it give a take-away resource** (prompts PDF, shortcodes, template)?
4. **Can it be cut into 3–5 before/after reels** (15–30 s each) that point to the long video?
5. **Mode:** does it need Paul's face (A), or can the avatar and graphics carry it (B)?
6. **Honest payoff:** can we actually deliver the result shown? Never promise what the footage can't prove.

**Formulas that fit his niche (AI graphic design for designers and small businesses):**
- **Spec-work series (Kaye's engine for a designer):** "I redesign [famous brand]'s ads/packaging with AI until they notice me", episode N.
  - Counter pill: cost or minutes. End reveal: total cost vs an agency quote.
  - Next-brand logo tease. "Spec ad, not affiliated" disclaimer; official logos only.
- **Agency vs AI challenge** (format #6): one brief, timer counter, the AI version vs a real price quote.
- **Local business makeover** (format #4): a real flyer or menu from a local shop → rebuilt with AI → their reaction. Needs their permission.
- **"N AI design skills" course** (what we shipped): numbered STEPs, a progress badge, a resource PDF, one reel per skill.
- **Tool showdown:** same prompt in ChatGPT vs Gemini vs Arena, result grid fill, verdict number.
- **Free-stack video:** "I replaced my $X/month design software with free AI tools", with a running savings counter.
- **Client-work behind the scenes** (format #8/#2): a real paid project, the prompt workflow, the invoice number as proof (with client consent).
- **Myth-busting / Satori-style concept video** (Mode B, calm): "Why AI designs look cheap (and the 3 fixes)", named concepts as chapters.

**Pitch format when Paul asks for ideas** (one block per idea):
- title + thumbnail text
- the 3-second opening shot
- the series or loop device
- STEP outline
- resource
- reel spin-offs
- Mode A or B

## 15. Build backlog and open decisions

**Components to build** (HyperFrames sub-compositions; transforms/opacity/clip-path only; seekable GSAP; lime + AI Labs blue; real logos; SFX matched to each action):
- **Shared first:**
  - `counter-pill` (P11), `screen-cam` (D2), `evidence-zoom` (D3), `ui-callout` (D7), `grid-fill` (D10), `proof-pair` (P2)
  - `attention-flag` (X8), `define-card` (X2), `word-card` (X3), `brand-slam` (X12), `label-broll` (D11)
  - `color-slam` (T6), `diag-wipe` (T7), `dip-reveal` (T3), `resource-card` (O4), `layer-build` (O1), `logo-row` (O6)
- **Mode A:**
  - `chapter-paint` (X1), `set-composite` (C6), `blur-float` (P13), `side-list` (D12)
  - `sticker-pop` (C4), `ui-lift` (D8), `gallery-card` (P3), `hand-note` (X4), `corner-pill` (P10)
- **Mode B:**
  - `device-frame` (D4), `note-card` (X5), `block-word` (X6), `push-reveal` (T8), `blur-through` (T4), `vertical-stage` (P4)
  - `shorts-fan` (P5), `growth-pills` (P8), `stat-card` (P9), `tile-row` (O3), cartoon mascot poses (C1), `persona-bubble` (C2), `orbit-bust` (C3)
- **Also:**
  - the AI Labs design-system kit in `style-library/`
  - a 60-s avatar test
  - a script template (hook formula + STEP chapters + bridge lines)

**Open decisions (ask Paul when relevant):**
- Official Photoshop/Illustrator/CorelDRAW logos into the long-form hook (needs a ~30 min re-render).
- The Instagram Creator switch and TikTok connection to Higgsfield for the trending-music lookup (his OAuth step).

## 16. Evidence and raw data (where the research lives)

`~/hyperframes-student-kit/research/longform-teardown/`:
- `*.videos.json`, `*.meta.json/.txt`: channel listings and metadata.
- `video/`: 12 reference videos at 360p, downloaded with Paul's permission. IDs:
  - Kaye: zZ1bgIaoPas (Red Bull), f0QIKt9djqs, 9ytfzZMnVn8, 0pvk446LhHg
  - Satori: eQEaFxM9Z4Y, VzQl1Tl_LPM, VMEWt8wcr3c, DexSdZxisz8
  - Money Degree: jglonMYLI6g, B46JA6LBpDc, yOWOc4SuYJY, eivlFouREho
- `full/`: whisper transcripts. `scan/`: per-second OCR + faces. `frames/`: 1 fps. `*.scenes.txt`: cuts. `cut_metrics.json`.
- `sheets/`, `hooks/`: contact sheets. `retention/*.json`: picture-mode timeline, headlines, script devices. `audio/*.json`: bed, changes, SFX sync, pitch, wpm.
- `redbull/`: `shots-0..4.jpg` (one frame per shot) + `shots.json`, `motion-0..3.jpg` + `motion-index.json`.
- **Scripts (re-run on any new creator):**
  - `analyze_retention.py <ids>`: frame classes HEAD/BUBBLE/SCREEN/CARD/VISUAL, text events, script devices
  - `analyze_audio.py <ids>`: bed level and changes, SFX-at-cut lift vs chance, pitch σ, wpm
  - `build_strips.py`: 8-frame motion strips at picture changes
- Method for a new creator:
  1. Get permission to download.
  2. yt-dlp metadata + 360p.
  3. Run whisper, frame_scan, scene detection, then the three scripts.
  4. Write the findings **into this file** (§4, §6, §7).

`~/hyperframes-student-kit/asset-library/editing-techniques/strips/`: 21 technique sheets + `index.json` (row → video, time, change).

`~/hyperframes-student-kit/research/_merged-archive/`: the original separate notes, archived after the merge (read-only history).

## 17. Project log (what we shipped, what we learned)

- **"Become a Graphic Designer With AI (No Photoshop Needed)"** (long-form v3, 2026-10-02/03).
  - Kit cut with energy pauses and an audited join list, the Skill Wall covering 11 measured title cards, a two-pass loudnorm.
  - Delivered with a description, chapters and a 12-page toolkit PDF.
  - Lesson: hand-kept card lists miss things, so measure from the picture.
- **5 reels** (old photo → HD, Pinterest flyer → brand, sketch → product, product photo → billboard, cartoon yourself; 32–52 s).
  - Lessons:
    - verified join boundaries
    - tail-word clamp
    - canonical transcript
    - captions merged when shorter than their tween
    - face ring tracked with circle detection and hidden via clipPath
    - voice normalised
  - The posting guide is in the Desktop reels folder.
- **AI Labs intro** (9:16, 17.4 s).
  - Skit hook "DON'T PUSH HIM / TWICE.", masked TWICE./PAUL headlines, lime highlighter benefits, Follow card.
  - The open loop closes on the reveal.
  - Lessons: SFX must match the action; ASR on "save time" is unreliable even without SFX.
  - Final = the no-music version.
- **Coming Out** (9:16, 1:43, origin story) + **Research With AI** (9:16, 0:55, "17 papers in 3 months"), 2026-10-05.
  - Projects: `video-projects/coming-out`, `video-projects/research-with-ai`. Delivered to `Desktop/ai labs /` with a cover and posting notes.
  - Devices:
    - masked headlines (8 MONTHS / INVISIBLE / SHOW UP / HERE; 17 PAPERS)
    - a REC pill with a camera beep on "hit record"
    - **a Publish button planted unpressed at "never pressed publish" and clicked at "invisible to here"** (object callback)
    - B/W on "I didn't."
    - a marker strike-through, step tiles, audience chips, a 25-dot grid, a BEFORE/NOW card, a ticked list, a YouTube CTA card
  - Lessons:
    - **Whisper DTW gives no token times here (t_dtw = -1)**, and token offsets drift up to 1 s.
      Use `scripts/align.py` (per-run ASR fitted to energy runs) + `merge_words.py` (full-file text).
      Its threshold must sit above the noise floor (`max(p60-22, p15+5)`); park wind hid every pause.
    - **White captions vanish on a white shirt**: use a dark pill (rgba(8,10,14,.8)) behind caption groups.
    - Highlighted words stay white until their box draws.
    - Clip-path reveals need a `gsap.set` hidden state, or they show before their tween.
    - Keep cards and tiles above the head with room to spare; check full-size frames.
    - The LUT 4 grade flattened sunlit skin, so keep the iPhone colour when it already looks right (compare first).
    - Paul's line "link in my description" → cards say "link in bio" on TikTok/IG; flagged in the posting notes.
    - **Paul gestures to text on purpose:** when he points (finger up, to the side), put a graphic exactly where he points, timed to the gesture (Coming Out 38.4 s: fingertip spark → sticky note → flip). Scan for pointing/framing gestures before placing graphics.
- **ChatGPT For Your Business** (9:16, 0:26, 2026-10-05). Assembled from 3 of 7 raw takes across 3 locations (platform → train → mall). Project `video-projects/chatgpt-edit`.
  - Devices: words masked *between* the passing train and Paul; a walk-past body wipe as the location cut; a search bar typing the cliché; pin-dropped city chips; staff badges merging into one app tile; mystery tiles 1·2·3 as a series hook.
  - Lessons:
    - **Pick takes per beat, not per clip:** best visual action for the hook (pointing at the moving train), cleanest delivery for the body, new location for the close.
    - **Multi-clip edits:** put source times on a virtual concatenation (clip offsets) so the kit validator works; document it in edit-decisions.
    - **Selfie/walking shots:** measure the head top per frame with the person matte. Face-box scans miss how close he walks; put graphics below the chin when the head fills the top.
    - **SFX per need:** search Freesound by the specific action for each video (zap, pin drop, plastic card, jacket swish). The kit is a fallback, not a default (Paul, 2026-10-05).
- **AI Journey 2025 shorts** (Moscow, filmed 20 Nov 2025; planned 2026-10-07). Project `video-projects/aij-shorts`. Plan and translations: `Desktop/AIJ shorts/`.
  - The footage: 104 clips (journey, lobby, piece-to-camera, 17 booth interviews, B-roll) + 24 recorder files, all paired automatically (clock + waveform). Nothing needed asking.
  - The plan: 25 shorts, one innovation each, tied to a job (ATM health check, Irochka the AI human, AI concierge, AI HR, smart ring, face-scan rPPG, AI travel agent, teacher assistant, AI judge, NAVIO driverless, smart TV, AI for science, Data Tracker, Kaspersky attack model, journey, 60-s highlights).
  - Lessons:
    - **Watch the footage, don't only transcribe** (Paul, 2026-10-07): contact sheets across every clip, plus full-size hero frames at the key moments, before planning.
    - **iPhone Cinematic mode:** `IMG_E####.MOV` = the Photos render with the blur baked in (the original carries a depth track). Use the E file when one exists.
    - Paul's on-the-spot summary of a Russian demo can be wrong (Kaspersky "smart city"). Subtitle the speaker's translated words; don't repeat a misreading.
    - **Week 1 shipped (2026-10-12), VO bookend format (§22.2):** Paul's hook + ending lines around the real demo. Shared cutter `video-projects/aij-shorts/scripts/aijcut.py` (sync segments from the recorder, VO segments from Paul's m4a gain-matched to the interview, 4K/E-file auto-pick, keeps.json).
      Per-word VO times come from energy runs + cut-point snippet ASR (align.py is unreliable on short VO pieces). Trim each VO piece's silent lead-in so the first word lands ~0.5 s after the previous speaker.
      Chat-bubble threads for foreign-language exchanges: keep only the two newest bubbles and re-frame the face shot so no bubble covers a face (check every bubble frame).
    - **Old footage:** add a "Filmed at …" chip and cut "launching next month" claims that have since passed. Keep interviewees' claims attributed to them.
    - **Week 2 shipped (2026-10-13): 05 AI-HR, 06 travel agent, 07 smart ring, 08 face scan (full-VO).**
      - Built on the §23 loop structure: hook → intensifier inside ~10 s (06 moves Dmitry's "finish all the travel websites" up front) → body → payoff that closes the hook's loop → VO ending.
      - Each short has one recurring object: the CV stamped BEST FIT → CAUGHT; the loft chat + trip planner → PLANNED; the heartbeat line; the webcam target ring.
      - Tools:
        - `aij-shorts/scripts/word_times.py`: per-word times for a short snippet, snapped to measured run onsets.
        - `aijcut.py` now takes `gain` (dB) on sync **and** VO segments, to level quiet interviewees and a dropped last word.
      - **Disputed words:** when small.en and base.en disagree ("probably" vs "yes", "hydration" vs "saturation"), run the multilingual brew Whisper small with beam 5, and flag what's still uncertain in the posting notes.
      - **If a word won't read in a take** ("wires" heard as "eyes"), swap in that phrase from another take at a shot boundary. Also check that no SFX lands on the word's first consonant.
      - **Expo crowds:** background faces count too. Measure every face in each crop and place graphics around them; Dmitry's head sat at the very top of frame, so his graphics went low.
      - A word that starts exactly on a cut belongs to the new keep (2 ms tolerance), or the validator flags it as zero-length.
      - **Identify the object before labelling it (Paul caught this, 2026-10-13).** In 08 I put the "camera" target ring on the black box on a boom arm. That is a **microphone**; the real camera was the small webcam with a green ring on top of the screen. Before any label or target lands on hardware, look at a full-size frame and confirm what it is (lens, LED, mount). If unsure, label nothing.
- **ChatGPT For Your Business: full version with 3 screen demos** (9:16, 2:11, 2026-10-11; Paul: "I love it"). Projects `video-projects/chatgpt-edit` (hook) + `video-projects/chatgpt-demos`.
  - Format: the 26 s hook ("…let me show you") → 1/3 sales manager → 2/3 strategist → 3/3 designer (flyer reveal last) → "all in one app" callback.
  - Recording: Paul screen-recorded on iPhone (vertical, mic left on by mistake, so clip audio muted). One example business across all three (Ama's Kitchen, East Legon).
  - **Demo VO = Paul explains what he's typing and why while it types and loads.** Paul asked for this; one-liners leave the waits empty. So/But/Then lines, ~25–35 s per demo.
  - Paul improvises good lines on retakes ("What does ChatGPT do then?"). Pick per line, keep the better improvisation, and drop any line where he reads the script notes aloud.
  - Build: each VO piece = one segment; the screen recording is time-stretched to it (typing 12–15× with a "⏩ 14×" tag) and cropped to a 9:16 window on the active area.
    **Freeze the frame** (0.1× stretch) wherever a highlight sits on scrolling text. Highlight boxes are placed from OCR of the *rendered* frames (`frame_scan`), so they land on the words.
  - Captions over a dark UI need a solid black pill with a thin edge; the usual translucent pill disappears on dark screens.
  - Label AI numbers honestly ("possible extra profit · illustrative") when ChatGPT itself says it's a scenario.
  - **v2 opening fix (Paul, 2026-10-11): the speech must land the instant the action ends.**
    - Paul noticed a 0.25 s gap between the train clearing the frame and "This". I cut it inside a held pose, which is invisible.
    - Under loud noise (a train), word times from alignment were 0.3–0.5 s early. Pin onsets with speech-band (300–3400 Hz) energy plus snippet ASR, cutting the audio at successive start points.
    - **Motion-matched text:** "this train runs on" rides in on the back of the train. I read the tail's x position frame by frame, from close-up band crops (by eye; automatic background-difference was fooled by the white rear panel).
      The text trails at train speed, then brakes (power3.out) so it settles on the first word.
- **Subscribe card** (Paul's own), the asset library, the NextWork tools vendored (cut-review, capture.mjs, editing rules; not their Remotion/Lambda/taste file).

## 18. Paul's own YouTube channel: audit and growth plan (2026-10-03)

Public data only (`research/own-channel/`: listings, `videos-meta.json`). Studio data (impressions, CTR, retention, traffic sources) is still needed from Paul.

**State on 2026-10-03:** "Paul Funchious" @funpaul_ai, 27 subscribers, 1 long video, 6 Shorts, no tags on any video.

| Date | Type | Title | Length | Views | Likes |
|---|---|---|---|---|---|
| 2025-11-20 | Short | I Used AI Avatars… You Didn't Notice | 2:09 | 78 | 7 |
| 2026-02-06 | Short | That's Ai (720p) | 1:50 | 65 | 2 |
| 2026-05-20 | Short | I mistakenly built JARVIS on my MacBook | 2:58 | 687 | 4 |
| 2026-05-29 | Short | SanctusConnect church app (a promo) | 1:43 | 46 | 2 |
| 2026-10-02 | Long | Become a Graphic Designer With AI | 24:50 | 55 | 10 |
| 2026-10-02 | Short | AI restored this old blurry photo | 0:46 | 25 | 3 |
| 2026-10-03 | Short | Pinterest flyer → MY brand | 0:52 | 2 | – |

**Diagnosis:**
- No single topic: AI avatars → JARVIS → a church app ad → AI design. The About text is generic ("AI trends, entrepreneurship, self-development").
  YouTube shows a new video first to people who watched the channel before; those viewers came for other topics, so they don't click, and testing stops.
- Long gaps (Feb → May → Oct): there is no recent audience data. YouTube doesn't punish inactivity itself; the channel just has no audience signal to start from.
- Early Shorts ran 1:43–2:58. Shorts past ~60 s rarely get pushed.
- The long-form is 24:50 on a new channel: hard to hold, and its search topic is broad.
- Views came mostly from friends' shares. They give likes, but often short watch times, so they don't help the algorithm much.

**Growth rules:**
1. One niche everywhere: AI graphic design for designers and small businesses.
   Rewrite the About text, banner and channel keywords; build playlists per series. A channel trailer is optional.
2. Search-first long videos while the channel is small: one skill = one 8–12 min video with a search title.
   Example: "How to Design a Flyer With ChatGPT (Free)". Browse and suggested traffic come later.
3. Cadence: 1 long video per week plus 3–5 Shorts per week (15–45 s, same niche). Each Short's Related video = the long one.
4. Packaging: use YouTube's Test & Compare with 2–3 thumbnails/titles. Check CTR at 24–48 h and swap if it's below ~4%.
5. Seed to the right people (designer and small-business groups, where self-promo is allowed), not general friends.
   Pinned-comment question; reply to every comment in the first hour.
6. Off-topic old videos (the SanctusConnect promo) can be unlisted, but only if Paul chooses.

**Positioning decision (Paul, 2026-10-03): a broad "AI for real work" channel, like @nateherk, not a graphic-design-only channel.**
Topics rotate (design, video editing, business automation…). Paul is removing the SanctusConnect promo; unlisting is preferred over deleting.

- **Website promise to mirror everywhere** (funchiousailab.com, "Funchious AI Lab"):
  - "AI Won't Replace You. It Will Multiply You."
  - Every week: one real job (teacher, trader, student, creator, job seeker, side hustler, family) → one thing built with AI that puts time or money back → shown exactly how, free.
  - Audience: non-techies, especially in Ghana (the seamstress story: "Can it help me get customers?").
  - CTA: free WhatsApp channel; free tools (Prompt Optimizer).
- **Nate Herk benchmark** (1.05M subs; last 40 videos, median 125K views; `research/own-channel/nateherk-40.json`):
  - His umbrella is the *viewer + outcome* ("put AI to work"), never one tool, so varied topics still reach one audience.
  - Winners (2–4× median):
    - a model turned into a job ("I Turned GPT-6 Astra Into a 24/7 Stock Trader", "…Ultimate AI Second Brain")
    - "X Made This Entire Video"
    - head-to-head tests ("I Tested X vs Y on 15 Real Use Cases")
    - "Every X Concept Explained for Normal People"
    - "X FINALLY Kills [pain]"
    - fast reactions to new model releases
  - Weaker: news recaps, milestone videos, safety/opinion pieces.
  - He reuses fixed title frames: "What You Need to Know." / "on N Real Use Cases" / "for Normal People" / "Build & Sell X (N-hour course)".
- **Paul's strategy:**
  1. The constant is the viewer (an ordinary person with a job) and the outcome (time or money back); the topic rotates.
     Every title/thumbnail names the job or the outcome, not just the tool.
  2. **Series frame: "Week N: I built [thing] for a [job]".** A numbered series counter (Kaye's episode device) and a real person when possible (with consent).
  3. **4-week pillar rotation**, matching the website sectors:
     - Creators (design, video editing)
     - Small traders/business (customers, posts, automation)
     - Education / students
     - Money / careers
     After ~8 videos, put more weeks on the pillar with the best CTR and retention (from Studio data).
  4. Steal Nate's frames in Paul's voice:
     - "I Turned ChatGPT Into a [Job]'s Assistant"
     - "I Tested [tool] on 10 Real Jobs"
     - "AI for [Job]: Everything Explained for Normal People"
     - "[Tool] FINALLY Fixes [pain]"
     - "I Made This Entire Video With AI"
  5. The Ghana/Africa everyday-work angle is the differentiator: local prices (cedis), WhatsApp, local businesses.
     Titles still read globally.
  6. Channel About, banner and name match the website (Funchious AI Lab / "It Will Multiply You").
     Descriptions link the WhatsApp channel and the free tools.

**Studio data (Paul's screenshots, last 28 days to Oct 2, plus realtime, 2026-10-03):**
- Totals: 105 views, 3.9 watch hours, +9 subscribers (27 total), 120 views in the last 48 h. Views come in bursts right after posting, which matches shares.
- **Long video** (24:50): 54 views, average view duration **3:42 (14.9%)**. Viewers leave early; the full 25-min course is too long as a standalone.
- **New Shorts:** old-photo restore 0:54 average = **118%** viewed (people rewatch); Pinterest flyer **104%** in its first 4 h.
  These are excellent retention signals; reach is still small (15–28 views). Old long Shorts: 32–51% viewed.
- Not yet seen: impressions, CTR, traffic sources, the long video's retention graph.
- **Read:** Shorts at 30–50 s with a result-first hook are working, so keep them frequent.
  For long videos, test shorter single-topic videos (8–12 min) and fix the opening (find the drop point on the retention graph).

**Studio reach data (2026-10-03, second set):** the channel is already renamed **Funchious AI Lab**.
- Thumbnail impressions **203** in 28 days, **CTR 9.4%** (good). Packaging works; **reach is the bottleneck** (impressions are tiny).
- Traffic sources:
  - channel pages 28.6%
  - other YouTube features 22.9%
  - external 11.4%
  - browse 9.5%
  - search 9.5%
  - others 18.1%
  Mostly self-driven.
- Views: videos 56, Shorts 49. Subscribers came from the long video (+8). 68% of viewers were not subscribed.
- **Mobile is 92% of watch time**: all text and graphics must read on a phone.
- Long video: 56 engaged views, average 3:36, 100% likes. **End-screen clicks 0%**, so add end screens and cards. Retention graph pending (up to 2 days).
- Restore Short: Shorts feed 35.7% (YouTube is testing it), notifications 25%, channel pages 21.4%. Notification CTR 0%.
- **Read:** keep the packaging style. Grow impressions with volume and Shorts (they are tested in the feed and retain >100%).
  Search-titled long videos. End screens on every long video. Check the retention graph for the drop point.

**TikTok and Instagram (2026-10-03; public TikTok data in `research/own-channel/tiktok.json` + Paul's screenshots):**

| Video | YouTube | TikTok | Instagram |
|---|---|---|---|
| JARVIS build (2:57) | 687 | **2,687** (63 likes) | – |
| SanctusConnect app (1:43) | 46 | **1,047** (52 likes, 8 comments, 4 shares; best engagement) | posted |
| Old photo → HD (0:45) | 28 | 446 (11 likes) | posted |
| Pinterest flyer (0:52) | 15 | 145 (8 likes) | posted |

- **TikTok @funchiousai:**
  - 1,536 followers, but only 4 videos and 134 total likes.
  - The followers came from an older period, so new posts are tested almost like a new account.
  - The bio is good and on-brand: "Funchious AI Lab / AI tips for everyday Africans / Buy back your time" + Linktree.
- **Instagram @paulfunchious:**
  - 2 posts, 253 followers, 631 following, 295 views in 30 days.
  - The bio is generic ("Entrepreneur… I teach entrepreneurs, creators…") and doesn't match the brand.
  - The link points to YouTube with a `?si=` tracking parameter. No banners.
- **Pattern across platforms:**
  - **"I built X" personal builds with Paul's face win** (JARVIS, the church app). Screen-heavy design demos do less.
  - Same video, different platform: TikTok gave the 1–3 min build stories 4–20× YouTube's views. YouTube Shorts favours ≤60 s.
- **Rules:**
  1. Lead every week with an "I built X for [person]" story on camera, plus a demo.
  2. TikTok/IG cut: 60–120 s story; YouTube Shorts cut: ≤50 s.
  3. Custom covers with hook text. Auto frames showed mid-sentence captions ("HAVE A CLOTHING", "SO THIS IS").
  4. No URLs in TikTok/IG captions (not clickable); say "link in bio".
  5. Build share triggers ("send this to a trader/teacher you know"); the new posts had 0 shares.
  6. IG: Creator account, a rewritten bio, a website/Linktree link, Trial Reels to reach non-followers, a consistent cover style.
  7. Unify handles, ideally @funchiousai everywhere, if available (Paul's decision).

**Platform decision (Paul, 2026-10-03), overrides earlier per-platform cut advice:**
- **TikTok is the main platform** (Ghana's youth and businesses are there). **Instagram second.** Post the **same short cut** to both; no separate cuts.
- **YouTube is for long-form only.** Shorts aren't a priority; uploading the same short file there is optional, with no extra editing.
  YouTube viewers come to learn; TikTok and IG are where the audience engages.
- YouTube still has to push the long videos. Levers:
  - search-style titles
  - strong opening retention (proof in 3 s)
  - the 9%+ CTR packaging style
  - end screens + cards
  - one long video per week on a fixed day
  - TikTok/IG → "full video, link in bio"
  - pinned comment
  - playlists per pillar
- **Short cut spec (TikTok + IG):**
  - 45–90 s, story-led ("I built X for [person]"), face on camera
  - custom cover with hook text
  - "link in bio" (no URLs in captions)
  - a share trigger
  - voice + SFX, trending sound added in-app

**Backlog: split the 12-skill course into search videos** (Paul: "let's not forget", 2026-10-03).

Chapter lengths in the course: 1 text→image 2:16 · 2 image→image 1:01 · 3 sketch 1:06 · 4 reference/Pinterest 3:40 · 5 style transfer 2:18 ·
6 inpaint/outpaint + free tool 2:55 · 7 upscale/restore 1:19 · 8 product mockups 1:57 · 9 ads/billboards 2:18 · 10 explosion/blueprint 1:57 · 11 logo 0:17 · 12 face swap 1:47.
No single skill fills 8–12 min, so group them by the viewer's job into 4 search videos.
Each gets a new 30–60 s hook intro (filmed or avatar), a link to the full course, an end screen and its own thumbnail.

| # | Working title | Skills | Footage |
|---|---|---|---|
| S1 | How to Design Business Flyers & Ads With AI (Free) | 4, 1, 9 | ~8:15 |
| S2 | AI Product Photos Without a Photographer | 8, 10, 3 | ~5:00 + new demo |
| S3 | Fix, Restore & Edit Any Photo With AI | 7, 6, 2 | ~5:15 + new demo |
| S4 | Make Logos, Cartoons & More With AI Shortcodes | 5, 11, 12 + the 200 shortcodes | ~4:20 + new demo |

- S1 is Week 1's YouTube long video (it matches the graphic-design week).
- S2–S4 are a second weekly YouTube upload (cheap to make), or fill weeks when new filming slips.
- Re-record a deeper version of whichever performs best.

## 19. Trend research for AI-design videos + the S-series (2026-10-03)

Data: `~/hyperframes-student-kit/research/s-series/` (`search.json`, `top.json`, `month.json`): 20 YouTube searches, plus 10 searches filtered to this month.

**New tools = search waves:**
- **ChatGPT Images 2.5**: OpenAI launched it mid-Sep 2026. Its intro got 310K; "ChatGPT Images 2.5 – 5 Use Cases" got 135K in 19 days.
- **Nano Banana 2/Pro** (Gemini).
- **Seedance 2.5**: in 35 of this month's top titles.
- **Google Flow**: "Turn Any Product Into a Video Ad" got 240K in 13 days.
- Rule: film with the newest version and name it in the title and in the first 30 s.

**Small channels winning big** (views ÷ subscribers):

| Video | Result | Note |
|---|---|---|
| "Nobody Told You ChatGPT Could Do This (14 Must-See Image Examples)" | 615K on 18K (34×) | real-life uses list |
| "Make a Full 3D Cartoon Animation with FREE AI" | 23× | |
| "How to Make Full Cartoon Animation Stories With FREE AI" (Africa Amaze) | 763K on 72K | African creator |
| "Create Realistic AI Ads from One Image" | 12.5× | |
| "Nano Banana INSANE Product Photos" | 11.3× | structure: Example 1…7, the 3rd labelled "(INSANE)" |
| "ChatGPT Image Generator Tutorial (Exact Prompts I Use)" | 7.4× | |
| "how i turn product images into (animated) video ads" | 6.9× | intro → proof AI ads work → step 1 script → step 2 scenes → tips → step 3 animate → bonus |

**Big formats:**
- "I Made AI Redesign Car Logos": 1.4M.
- "i suck at Logo Design… so I made 1000 in a day": 919K (a challenge).
- "3-Step Workflow To Make Ultra-Realistic AI Ads" (Higgsfield): 647K. Its chapter 1 is "The finished AI commercial", Kaye's structure.
- "Why Learn Photoshop When ChatGPT Does Everything?": 364K.

**This month's viral photo trend:** "80s / 90s / 18th-century look" ChatGPT photo prompts. Dozens of videos with 200K–970K views, mostly India. **A Ghana version is open.**

**Backlash:**
- "I Fell for 100 AI Scams": 2.8M. "These AI ads are using children": 223K.
- Viewers distrust fake AI ads, so: real products, real people, honest claims; the label must stay unchanged; disclose AI models.

**S-series rules:**
1. A result-first cold open.
2. Numbered steps or examples that escalate, with the "insane" one at 60–70%.
3. An "exact prompts free" promise.
4. The newest tool name.
5. A real local business or person in every episode.

**Series frame:** "making small Ghana businesses look like big brands with AI, for free". The business shares the video, which gives reach.
**Counter pill:** cost in GH₵ vs a real designer/studio quote; S3 uses "photos fixed 0/10"; S4 uses a 60-minute timer.
**Filming pack** (scripts, prompts, shot lists, how to film): `~/hyperframes-student-kit/video-projects/s-series/FILMING-PACK.md` (+ PDF on Desktop `ai labs /`).

**Tool checked: Wan2GP / WanGP (github.com/deepbeepmeep/Wan2GP, 2026-10-03). Not usable on Paul's Mac now.**
- What it is: free local app for open video, image and audio models: Wan 2.2, LTX-2, Hunyuan, Flux, Qwen Image, TTS/voice clone. It has a web UI, a queue and an API.
- Why not now:
  - It's built for **NVIDIA** (and AMD) GPUs. Paul has a MacBook Pro **M3 Pro with 18 GB**.
  - Apple Silicon is unofficial; the community MPS attempt says at least 32 GB, and there are open crash issues.
  - Models are tens of GB, and it would be very slow even if it ran.
- **Licence:** free to use. Paul can sell outputs (credit WanGP when he sells an output directly). Selling or hosting WanGP itself is not allowed.
- **Cloned for later:** `~/contentflow/external/Wan2GP` (code only, 153 MB, commit b8b18f8 of 1 Oct 2026; no models downloaded, nothing installed; locally git-excluded from contentflow).
- **Revisit if** Paul gets an NVIDIA PC (12–24 GB VRAM) or wants bulk B-roll on a rented cloud GPU.
- Until then: ChatGPT Images 2.5 / Nano Banana for images, Higgsfield (Seedance) / Google Flow for video.

## 20. Sound design system (how to choose, place and mix SFX)

Built 2026-10-05 from 9 editor tutorials:
- Film Editing Pro "How to SOUND DESIGN a Video"
- Tim Runia "The ONLY 3 Sound Effects You Need"
- Learn By Leo "How to edit SO good your viewers get addicted"
- Herman Huang "3 Sound Design Secrets"
- Artlist "How To SOUND DESIGN"
- Joseph "Viral Instagram Talking Head Videos"
- Film Crux "13 Sound Design Tips"
- finzar "Edit Like Mr Beast"
- Justin Odisho "Whoosh transitions"

Plus our own measurements of the reference channels (§4).
Captions and notes: `~/hyperframes-student-kit/research/sfx/`.

**Paul's own rules apply on top:** sounds must match the physical action, reels get no generic music bed, keep sounds off consonants, and always send a review page.

### 20.1 The vocabulary: 4 core families + 4 supporting
| Family | What it does | Variants (pick by weight) | Use when |
|---|---|---|---|
| **Whoosh** | makes you *feel motion, direction, speed, weight* | **light** (high, quick: fun, fast UI moves) · **heavy** (deep, slow: big object toward camera, a move you want felt) · **whip** (snappy: whip pans, sudden action, comedy) · **wind** (soft, long: aerial/floating shots) | anything moves in frame: a card or text slides, a zoom in or out, a pan or tilt, a person passing, between shots to make the cut feel continuous |
| **Riser** | *tension*: "something is coming" | low bass rumble (felt more than heard) · cymbal riser / reverse cymbal ("suck-back") | only **before something that really pays off** (a reveal, smash cut, result). Overuse kills its meaning |
| **Impact / hit** | *release + emphasis*: "pay attention to this" | deep/trailer boom (long tail) · sharp hit (object contact) · sub drop | the end of a build, a big number or title, a chapter card, a hard cut to a striking shot, real contact (box dropped, slam) |
| **Click** | snappy, *alive* | mouse click · camera shutter · pen click · UI tap | quick sequences (3–4 related shots each on a click), cursor clicks, something "appearing" (shutter = "it just got captured") |
| Textured / UI | gives each graphic its *own* action sound | UI blip per icon, mechanical click, glass shatter, gear, cash register (money), paper slide/flip, marker/pencil | one per graphic action, matched to what the object is (Joseph's workflow) |
| Drone | mystery, unease, suspense | dark drone, low rumble | under a problem/stakes beat; darker moods only, very low |
| Ambience | the space feels real; "nothing is silent" | room tone, wind, street, AC hum | always under b-roll/locations with no other sound; low |
| Silence / music moves | the strongest punctuation | **pause the music abruptly** (jolts attention) · **fade the music out** (signals the segment is ending) · **reverb tail** on the final beat · **reverse the song's first beat as a riser** into it | special moments; topic shifts; endings |

### 20.2 Action → sound map (decide by what the viewer *sees*)
| On screen | Sound | Timing |
|---|---|---|
| zoom in / punch-in | light whoosh (subtle); a harsh/heavy whoosh only for big moves | peak on the zoom's fastest frame |
| zoom out / pull back | light whoosh, or nothing if it's a slow drift | same |
| text / card slides in | light whoosh, or paper slide for paper-like cards | peak as it arrives |
| element pops / appears | pop (small objects), UI click (UI), camera shutter ("captured" / still image) | on the first visible frame |
| icon / chip / list item seats | UI click, one per item, varied | on each seat |
| highlighter / underline / circle / strike | marker or pencil scribble | starts with the draw, after the spoken word |
| note / card flips | paper flip | peak at the mid-flip |
| cursor click | mouse click | on the press frame |
| money / price / sale | cash register | on the number |
| success / done / published | soft ding | on the ✓ |
| hard cut to a striking shot or title | impact (sharp or boom), sometimes whoosh → impact | impact on the **first frame of the new shot** |
| reveal / result / smash cut | riser → impact (or riser → silence) | the riser **ends on** the cut; the impact lands on it |
| camera whip / shot change between scenes | whip or whoosh across the cut | peak on the cut |
| emotional low (e.g. "I didn't.") | remove sound: silence, or drop the music | on the line |
| real physical action (push, door, drop) | the real-sounding foley for it (+ optional hit to exaggerate) | on contact |

### 20.3 Layering recipes (Artlist: "never one sound, stack layers")
- **Big moment:** a low impact + a sharp impact + a short riser in front (three layers, different frequencies, like a layered cake).
- **Reveal:** riser (low rumble + cymbal riser together) → impact on the cut. Or → silence for a smash cut.
- **Stand-out cut:** whoosh → impact (the whoosh adds motion, the impact lands as the new shot appears).
- **Snappy montage:** each shot on a click.
- **Big whoosh:** layer a light high whoosh with a deep one, so a single sound doesn't feel thin.
- **No riser available:** reverse any impact or cymbal → instant riser.
- **Make it bigger:** add reverb (weight and distance).
- **Change the mood:** pitch down = heavy or ominous; pitch up = light or fun.
- **Texture:** low-pass filter = muffled, underwater or distant; high-pass = thin or phone.
- **Direction:** pan with the movement (left → right). Phones are mostly mono, so this matters only for long-form.

### 20.4 Restraint and density
- **"If you make every moment special, none of them are"** (Film Editing Pro). Rank the moments.
  - Key moments get the full layer stack.
  - Medium moments get one sound.
  - Small moves get a light whoosh or nothing.
- Risers and hits only when something real pays off, or they lose their meaning (Learn By Leo).
- **Commit to one sound palette per video** (Herman Huang). Don't mix gritty bass hits with clean bell dings.
- **AI Labs palette:**
  - clean UI clicks
  - light bamboo whooshes
  - paper / marker / pencil (Paul's designer world)
  - soft dings
  - low cinematic impact for big numbers
  - glitch only for "AI thinking" moments
  - no meme or cartoon sounds unless the beat is a joke
- **Density by format:**
  - **Reels / talking head** (Paul's main format): sound on most graphic actions, ~1 cue per 1.5–3 s, never two within 0.25 s.
  - **Calm long-form** (Kaye/Satori-style): mostly on reveals, cards and big numbers. They measured *no* SFX on cuts (0.9× chance).
  - **Energetic long-form** (Money Degree / MrBeast-style): sounds on cuts and graphics (1.6×), "something every second, a dopamine hit every ~10 s", cinematic booms, stock music beds.
- **Vary repeats:** use a different whoosh or click when the same action recurs (Film Editing Pro: "the same keyboard sound for every letter" was their flaw). The kit has 2+ variants per family for this.

### 20.5 Timing rules
- Line up the sound's **peak**, not the file start, with the visual landing, within 1–2 frames.
  `start = event − peak` (the kit index stores `onset` and `peak` for every file).
- Risers **end** exactly on the cut. Impacts land on the first frame of the new shot.
- Keep every sound off consonants of the voice: in the pause after the word, or just before it.
- 10 ms fade-in and fade-out on every cut sound (no clicks). Trim long multi-hit files to the single hit you need.
- **Edit to sound:** sometimes build the rhythm (music or SFX) first and cut picture to it (Film Crux).

### 20.6 Levels (Film Editing Pro's guide; adjust by ear and measurement)
| Element | Level |
|---|---|
| Dialogue | peaks ~−12 dBFS (loudest element; master −14/−16 LUFS per §3) |
| SFX | −10 to −30 dBFS depending on role. Our build volumes: whoosh 0.3–0.45, UI click/pop 0.3–0.4, marker 0.26–0.32, impact 0.4–0.6, mouse click 0.55–0.6 |
| Music (long-form only, licensed) | −20 to −30 dBFS, ducked under speech |

**Pro trick:** carve a pocket in the music's mid frequencies (2–4 kHz dip) so the voice sits in it, instead of only lowering the music. And EQ the low and high ends.

### 20.7 Workflow for every edit (Joseph's 3 steps + ours)
1. **Whooshes on every movement:** list every zoom, slide and move from the timeline. Subtle for small, harsh for big.
2. **Textured sound per graphic action:** pop, UI click, shutter, paper, marker, gear, cash, ding, glitch. Match the object.
3. **Emotional layer on key moments only:** riser → impact, hits on titles and numbers, drones under stakes, silence and music pauses.
4. **Mix:** voice first, then SFX by role, then measure loudness.
5. **Review:** list the cues (number, time, sound) in the reply so Paul can veto by number. **Don't build the per-cue HTML review page** (Paul, 2026-10-05: saves tokens; he's happy with the SFX).
- **Source order (Paul, 2026-10-05: the kit must not become the default sound for everything):**
  1. Search Freesound CC0 **for this video's specific actions** (API key in `.media-secrets.env`), chosen by the recordist's description
  2. The kit (`asset-library/sfx/kit/`) only when it is genuinely the right sound, or as a fallback
  3. Never ripped sounds

### 20.8 The kit (`~/hyperframes-student-kit/asset-library/sfx/kit/`)
32 CC0 Freesound sounds, 2.1 MB. `index.json` has category, file, Freesound id, author, licence, url, duration, onset, peak and use.
Audition page: `kit/index.html`.

| Family | Files |
|---|---|
| whoosh | light ×2, heavy ×2, whip |
| riser | short 3.6 s, long 8 s; reverse cymbal |
| impact | low boom, big boom, sharp ×2; sub drop |
| click | UI click ×2, mouse click, camera shutter, camera beep |
| pop | ×2 |
| paper / marker | paper slide ×2, paper flip, marker circle, pencil scribble |
| typing | full, single key |
| other | soft ding, cash register, drone ×2, glitch |

Add new sounds to the kit (with index rows), not ad hoc. Swap any that Paul vetoes.

## 21. Transitions & VFX: when to use them, how Paul films them, how we build them

Built 2026-10-05 from 12 tutorials:
- Full Time Filmmaker "Top 8 Seamless Transitions"
- Gaku Lange "Slide / Speed Ramp" and "Vertigo / Dolly Zoom"
- Learn Online Video "Fake a Drone Shot with your Phone"
- Benett Graezer "In-Camera Transitions with iPhone"
- Daniel Schiffer "Throw / Focal-length transition"
- Karl Shakur "Match Cut"
- Chris Hau "Hyperlapse"
- Enam Alamin "Speed ramp without gimbal (14M-view reel)"
- StudioBinder "Every Editing Transition"
- Tim Runia "The only 7 cuts"
- Henbu "10 seamless transitions"

Captions: `~/hyperframes-student-kit/research/vfx/subs/`.

### 21.1 Rules (what the pros agree on)
1. **A transition must mean something.** It connects two ideas (same theme, cause → effect, before → after) or keeps momentum.
   Used just to hide a weak cut, it's cliché (Full Time Filmmaker; Benett Graezer: "create your transitions with meaning").
   Default is still the hard cut (§7, 90%+).
2. **Continuity of direction is everything.** Clip B must start moving the same way and at the same speed clip A ends
   (whip right → whip right; push in → push in; tilt up to sky → tilt down from sky). Opposite directions = the viewer feels the cut.
3. **Keep the eye in the same place across the cut** (eyes and subject position match; Tim Runia's flow and action cuts).
4. **Plan it before you shoot:** the edit is in your head first. Start or end each clip *on the transition point*. Shoot both directions when unsure, and 2–3 takes each.
5. **Sound sells the cut** (§20): whoosh on whips and slides, riser → impact into a reveal, the music beat on the cut.

### 21.2 Camera settings for any transition shot (iPhone)
- **Frame rate:**
  - **60 fps** (or 120) for speed ramps and slow-mo; 30 fps is fine for plain whips and match cuts.
  - Indoors under Ghana's 50 Hz lighting, use **50 fps** (PAL formats on) to avoid flicker.
- **Shutter ≈ 2 × frame rate** (1/120 at 60 fps) so movement blurs naturally. The iPhone's auto shutter is too fast in sunlight,
  so use the free **Blackmagic Camera app** (manual shutter/fps) and/or a phone ND filter.
- **Lock exposure and focus** (AE/AF lock), so clips A and B match in brightness and colour.
- **Stability:** a 3-axis phone gimbal is best (keeps the horizon level while you lift or lower). Handheld works if we stabilise in post.

### 21.3 The catalogue (how Paul films it → how we build it)
| # | Effect | Film it like this | We build it with | Sound |
|---|---|---|---|---|
| V1 | **Speed ramp** ("speed star") | 60 fps, a steady move (walk, push, pan). Start and end on the points you want to *land on*; move fast between them. 3–5 s clips, several angles (close, wide, low) | `scripts/vfx/speed_ramp.py` ✅: S-curve ease over ~6 frames, up to 8–15× speed, frame-blend motion blur. Optional white flash on the beat | whoosh across the fast part, hit on landing |
| V2 | **Slide technique** (horizontal ramps through details: face → shoes → watch → wide) | gimbal, slide left/right past each detail. **Start on the detail, then move off it**; subject leaves the frame each time | chained V1 ramps, one direction per sequence | light whooshes, varied |
| V3 | **Whip pan** | end clip A with a fast whip (e.g. right); start clip B already whipping right, then settle. Shutter 1/120 | cut at the whip peak, directional blur 10–15%, time-remap to match speeds | whip / swish |
| V4 | **Sky / ground transition** ("fly up, fly down") | clip A: tilt up from you to the sky. Clip B: start on the sky, tilt down to the new place. Or point down at the ground → start on the ground | cut on the sky frames, cross-blend 3–4 frames | airy whoosh |
| V5 | **Fake drone / crane** (high → low, flying from up to down) | phone on a **3-axis gimbal on a light stand or selfie stick held high**, camera level. Walk forward and lower it (or lift it). Use foreground (grass, branches, window frames) for speed. Push *through* gaps. Shoot it reversed too | 60→30 fps slow-down 0.5–0.75×, stabilise, reverse if better | wind whoosh, low rumble |
| V6 | **Earth zoom / fly-in from space** | end shot: phone straight **down at you from as high as possible** (top-down), or a phone fake-drone descend | **Google Earth Studio** (free; needs Paul's Google login; *must* show "Google Earth" attribution) keyframed from space down to the location, last frame matched to your top-down shot with a zoom-blur cross-blend. Or AI image-to-video (Higgsfield/Seedance, start frame = map, end frame = your still; credits, quote first) | rising riser → sub hit on landing |
| V7 | **Frame fill / body or object wipe** | clip A: move the camera behind something dark that fills the frame (your shirt, a wall, a door) or walk past the lens. Clip B: start *inside* a dark object, moving the same way | cut at full darkness, 2–4 frame blend | cloth swish / whoosh |
| V8 | **Mask wipe** (a pole, tree or person crosses the frame) | clip A: something passes across the **whole** frame while the camera orbits. Clip B: same move direction and speed | person/object matte (Apple Vision `person_matte.swift`) or hand-drawn edge mask, feathered | swish |
| V9 | **Match cut** | same action, same framing, same eye position, different place/outfit/time (walk, jump, turn to camera, raise phone) | align scale and position, cut at the action peak; on a beat | beat or hit |
| V10 | **Smooth zoom / zoom-blur** | push in at the end of A; B starts pushed in on a similar theme (water → water, screen → screen) | scale + radial blur + 2–3 frame blend (HyperFrames/ffmpeg) | whoosh in, impact |
| V11 | **Dolly zoom / vertigo** | walk straight back (or forward) on a gimbal, keeping the subject centred | scale up/down in post so the subject stays the same size (keyframed); the background warps | low drone / riser |
| V12 | **Spin / rotation / barrel roll** | gimbal roll, or rotate the phone 180° while following you. Clip B rotates the same way at the same rate | match speed, radial blur | whoosh |
| V13 | **Luma / flash spin** | you do a fast 180° spin in clip A; clip B is the same spin elsewhere | luma-key or white flash at the spin peak | whoosh + hit |
| V14 | **Throw / object transition** | throw something (a phone, a flyer, a product) up out of frame in A; it falls into frame in B (or lands as the "after" version) | ramp 80% → 20% (slow-mo at the peak) → 150%, keep the object centred with position keyframes, blur | whoosh + catch |
| V15 | **Focal-length switch** | wide shot of the action → tight shot of the same action continuing (slice, pour, click) | ramp + camera-shake match | action sound |
| V16 | **Hyperlapse** | lock onto a point using the grid, take a photo, one equal step, repeat (80–150 photos); or iPhone Time-lapse while walking | image sequence → video, stabilise | ambience rise |
| V17 | **Glitch** | only for tech/AI moments; nothing special to film | channel-split offsets for 4–5 frames | digital glitch |
| V18 | **Light leak / film burn** | none; a cut between two shots that don't match | brightest part of the leak over the cut | soft whoosh |
| V19 | **Jump cuts on the beat / smash cut** | the same framing, different moments; or two contrasting scenes | hard cuts on beats; a smash cut drops all sound | silence or hit |
| V20 | **J-cut / L-cut** | — | next scene's audio starts before its picture (J), or carries over (L) | — |

### 21.4 How Paul gets VFX directions from me
For every new video I suggest **0–3 transitions that serve the story**, each as a short **shot card**:
**name → why here → clip A (what you film, how you move, which way) → clip B → settings (fps / shutter / lock) → takes → what I do in post**.
Paul films; I build. Default to a hard cut when no transition earns its place.

### 21.5 Ideas waiting for upcoming shoots
- **S1 Flyers:** **throw** (V14): toss the shop's old paper flyer up, and the new AI flyer falls back into frame.
- **S2 Products:** **slide technique** (V2) across the product details, and a **speed ramp** (V1) into the finished ad.
- **S3 Old photos:** **mask/frame push** (V7/V10): push into the old photo on the table and come out inside the colourised version.
- **AI Labs intros / travel (Moscow City, Accra):** **Earth zoom** (V6) from space down to Paul (Google Earth Studio, attributed), then a **sky transition** (V4) between locations.
- **Any "before / after":** a **match cut** (V9) with the same pose in two places or outfits.

### 21.6 Tools status
- ✅ `scripts/vfx/speed_ramp.py`: keys `source_time:speed`, smoothstep ease, frame-blend motion blur. Tested on IMG_7409 (walk → 9× pan → dome).
- 🔨 To build when first needed: `whip.py` (directional blur + cut-matching), `zoom_blur` (HyperFrames radial blur), `dolly_zoom` (subject-size keyframes from the person matte), `earth_zoom` (Google Earth Studio frame import + match), `glitch`, flash-on-beat.

### 21.7 Scroll-stopper VFX from Paul's references (2026-10-12)
Source: 7 Instagram tutorials Paul sent. Clips, transcripts and contact sheets are in `research/vfx-refs/` (v01–v07).
**Shared pattern:**
- The finished effect plays in the first 1–4 s as the hook. Then comes the creator's own tutorial or lesson.
- They end on "SAVE FOR LATER" / "comment X".
- Every effect is built from 2–3 tripod shots plus a clean plate (the empty scene), joined with overlay + cut-out/mask + keyframes in CapCut.
- **We build the same in our pipeline at higher quality:**
  - person cut-out: `scripts/matte/person_matte.swift`
  - **any-object cut-out: `scripts/matte/object_matte.swift`** (Vision foreground instances, built 2026-10-12; a held object merges with the person, an airborne object is its own instance)
  - ffmpeg / HyperFrames masks
  - GSAP keyframes
- **Two are retention structures, not VFX** (v01, v05). They pair with the Zack structure (§22).

| # | Effect (ref) | What the viewer sees | How it's made | Paul films | We build | Fit for Paul | Tier |
|---|---|---|---|---|---|---|---|
| R1 | **Open loop** (v01 basketball) | "If I make this shot, watch till the end" → he shoots → the ball hangs in the sky in a corner for the whole video → payoff at the end | the ball cut out at its apex and frozen, held in the frame, resolved in the last second | one take of the action + its result; tripod | object matte of the frozen moment, pinned in a corner; resolve at the end | **AI demos:** a "generating… 99%" bar or an AI image half-drawn pinned in the corner until the reveal; or toss the old flyer up, it hangs, and comes down as the AI flyer at the end | **A** |
| R2 | **Curiosity loop / recursion** (v05) | "Oh my God, have you seen this video?" said 4×, each time showing a phone playing the previous take (video inside video) → "How long can this keep going?" → the lesson | 4 takes; each take plays the previous take on the phone; edit = zoom into the phone screen, cut to the next layer | 4 takes in the same spot, phone held at the same place, AirDrop each take to the phone before the next | match the phone-screen corners, scale-zoom through into the next take (4-corner track) | "Have you seen what ChatGPT just made?" for tool reveals; meta, cheap, very AI-channel | **A** |
| R3 | **Standing on text** (v06 SUMMER) | he jumps onto a giant word on the ground; the letter he lands on bounces | 2 tripod shots (jumping onto a table/box + a clean plate without the box); mask the box out; text under his feet; letter keyframed with each landing; person cut-out on top so he's in front of the letters | tripod, jump onto a low box, then the same shot without the box | clean-plate rect mask + person matte + GSAP letter bounce on each landing frame | stand on **"CHATGPT"**, **"AI"**, or the series word ("SKILL 3"); the jump lands on the key word | **A** |
| R4 | **Floor → world replacement** (v04 koi pond, 1.5M views) | "I think I made a huge mistake…" → the floor in front of him is a fish pond; he reacts like he can't step in | tripod shot of him reacting at a door edge + a stock/AI video of a pond; keep everything but the floor; brightness match + vignette | tripod at the doorway, react to an invisible drop | floor mask (brush or object matte inverse), AI/stock clip under it, grade match | **AI angle:** "I asked AI to turn my office floor into the ocean" (Higgsfield/Seedance clip as the fill, quote credits first) | **A/B** |
| R5 | **Clone** (v03 stairs) | several copies of him in one shot | tripod, several takes in different spots, stacked overlays, each cut out or rect-masked | tripod locked, same light, 3–4 positions, no camera touch | person matte per take + stacking | **ChatGPT tie-in:** three Pauls = sales manager, strategist, designer, talking to each other | **B** |
| R6 | **Throw-back** (v07 flying jacket) | he throws his jacket behind him and it slingshots back onto him | 3 shots (reacting with the jacket on, throwing it, a clean plate); match cut at the reaction; film-strip/rect mask with clean plate; jacket cut-out keyframed back; 2× speed section | tripod; throw the object up and behind; a clean plate | object matte of the item, keyframed path back; match cut | **S1 flyers:** throw the old paper flyer away, the AI flyer flies back into his hand (the §21.5 throw idea) | **B** |
| R7 | **Body chop** (v02 melon) | he "chops" a melon and his body splits in half and falls | 3 shots (fake chop + freeze, clean plate, melon alone); two person cut-outs masked left/right, keyframed apart and down | tripod, chop motion then freeze, a clean plate, the object alone | 2× person matte halves + clean plate | a gag; only if a script needs "cut costs in half"; violent read, so skip by default | **C** |

**Rules:**
- The effect must **say the video's point**: it's the hook image, not decoration.
- Keep it to one effect per short, in the first 3 s, or as the payoff.
- Always **tripod + clean plate + locked exposure** (§21.2).
- Retention structures R1/R2 cost no VFX and fit every AI demo, so use them often.
- **Workflow:** I write a shot card (§21.4) per chosen effect, Paul films the plates, I composite and verify the edges frame by frame.

### 21.8 Attention mechanics library (Paul's 17 Instagram refs, 2026-10-12): take the mechanic, not their format
Paul (2026-10-12): these creators make *tutorials*; we only steal **how the effect grabs attention** and wrap it around Paul's own content (AI for real work, AIJ, ChatGPT demos).
Clips in `research/vfx-refs/ig/` (v08–v24, c01–c02, captions in `.txt`), contact sheets in `sheets/`. Downloaded through Instagram's public embed page (`ig_fetch.py`; `dash_get.sh` + the in-app browser for reels the embed hides).

**Why they stop the scroll** (measured: the effect is always fully visible by 1–4 s, and the frame is never static before the "impossible" moment):
1. **An impossible image in the first frame** (giant shoe, a person stepping out of a phone, floating clothes): the brain re-checks what it sees.
2. **An unfinished action** (ball or bottle in the air, a hoop moving): the viewer waits for it to land.
3. **Self-interaction** (clones talking, jumping on text, text behind the head): the person and the edit "touch".
4. **Speed contrast** (15× blur → sudden stop; sky racing behind someone still).
5. **A reveal through a shape** (hoop, phone screen): something hidden is shown through a window.

| ID | Mechanic (ref) | Attention trigger | How it's built | Paul's version (his content) | Tier |
|---|---|---|---|---|---|
| M1 | **Screen pop-out** (v23) | impossible: he walks out of a phone | tripod shot of him stepping forward + a phone on a tripod with a green screen; chroma-key the phone screen, cut him out, rect mask so his body crosses the phone edge | **he steps out of the ChatGPT screen** to say "I'm your new assistant", or the AI flyer/product slides out of the phone into his hand | **A** |
| M2 | **Flash speed** (v22) | speed contrast + payoff object | run a zigzag; middle section 15× speed + max motion blur (blend ~20, 2×); sudden stop holding something | "a flyer in 2 minutes": he flashes away and stops holding the printed AI flyer / a finished laptop result | **A** |
| M3 | **Clone dialogue** (c02, v10, v12, v24, v14) | self-interaction; 3 roles argue | tripod, same light, one take per position; person cut-out or split mask; label tags over each clone | **the ChatGPT trio**: Pauls as sales manager / strategist / designer; or "me vs me before AI"; POV crowd of clones for comedy | **A** |
| M4 | **Text behind / under the subject** (v09, v06) | the person sits in front of the words | person matte over the text (we already do masked headlines, §9) | keep using it on every hook keyword; add "stands on the word" for jump hooks | **A** (have it) |
| M5 | **Portal reveal through a shape** (v19 hoop) | a hidden scene shown through a moving window | two locked-off shots; a circle mask keyframed to follow the hoop/frame; full reveal at the end | **before/after through a frame**: he sweeps a picture frame or hula hoop across the old flyer/room and the AI version shows inside it | **A** |
| M6 | **Giant object / scale** (v20) | impossible scale | a product shot close and low + him far + a clean plate; product cut out, keyframed off with motion blur | **S2 product photos**: a huge AI product shot in the foreground, Paul tiny behind it; the product "drives" away | **A** |
| M7 | **Unfinished action / pattern interrupt** (v01 ball, v16 bottle) | waits for it to land | an object frozen and pinned (object matte) while he talks; resolved at the end; v16 adds a 1-s meme interrupt mid-talk | a "generating 99%" bar or a tossed flyer hangs until the reveal; never leave it unresolved | **A** |
| M8 | **Recursion loop** (v05) | "how long can this go?" | each take plays the previous take on a phone; zoom through the screen | "Have you seen what ChatGPT just made?", ×3–4 | **B** |
| M9 | **Freeze + stat overlay** (v11) | frame freezes, a stat card pops on him | freeze frame + an overlay keyframed from small to place | AIJ / demos: freeze on a person or result, a card pops ("0 designers · 60 seconds", "GH₵ 0 spent") | **A** (cheap) |
| M10 | **Ghost double** (v08) | his inner feeling as a translucent self | same position, take 2 dances or celebrates; cut out at ~45% opacity | serious Paul at the laptop; a ghost Paul celebrates when the AI finishes the job | **B** |
| M11 | **Jump over a landmark** (v15, v21) | a body flies over a building | very low angle, jump higher than the building; foreground (building) masked or freeze-frame layer over him | location cuts in travel (Moscow City, Accra landmarks), AIJ series intro | **B** |
| M12 | **Time-lapse sky** (v17) | the world races, he's still | locked shot, record 10+ min; split mask at the building top; sky layer sped way up | "AI saved me hours": the sky races while the AI works and he sips tea | **B** |
| M13 | **Float / outfit snap** (v18) | clothes fly onto the body | arms-lift motion in 2 outfits + clothes held up; clothes cut out and keyframed to the body; match cut on the hands | brand makeover ("your business before / after AI branding"), sparingly | **C** |
| M14 | **Clone trail** (v13) | a zigzag of selves | CapCut's "observe clone" effect + speed ramp; we use frame echo + person matte | a walking transition only | **C** |

**Pick by mechanic (one per short):** start an AI demo with M1/M5/M6/M7; talking or opinion shorts with M3/M9; travel/AIJ with M11/M12; reserve M2 for "it was fast" claims (it must be true).

### 21.9 What to post: the content funnel (c01/c02, @tylertometich, 2026-10-12)
Every business account needs three jobs. **Before posting, decide which job a video does.**
- **Top of funnel = reach** (strangers). Rankings, tier lists, Q&A, visually striking easy-to-understand videos. **This is where the 21.8 mechanics and the AIJ/curiosity shorts live.** Metric: views and shares.
- **Middle = trust** (viewers → followers). Teach, tell your story, show how you work. **ChatGPT demos, tutorials, the Coming Out / Research With AI stories.** Metric: follows and saves.
- **Bottom = convert** (followers → clients). Solve the exact problem the ideal customer already knows they have, with the offer and a CTA (DM keyword, WhatsApp, toolkit). **Paul: "your shop's flyer in 24 h", "I build your AI assistant", the free toolkit, "comment FLYER".** Metric: DMs and leads.
- "Only views → people watch and forget you; only selling → nobody new finds you."
- **Paul's starting mix (new account): about 3 top : 2 middle : 1 bottom per week.** Label each planned short T/M/B in the posting notes and review the ratio monthly with the TikTok/IG data.
- c02's own format (three clones = three roles, labels ATTENTION / TRUST / CUSTOMER) is itself M3. That's the template for explaining any three-part idea.

## 22. Voiceover-driven shorts: "narrator hook + curiosity" (Paul, 2026-10-08)

Paul's idea: every short opens with a **voiceover (VO) hook** that a narrator "spits out", then builds curiosity, with the footage proving each line.
Example: "A company in China did this… and you won't believe how it works."
This turns **any** footage into a short, including B-roll with no interview (e.g. the 60+ AIJ booth clips), so the supply is effectively unlimited.

**References studied (2026-10-08; data in `~/hyperframes-student-kit/research/vo-shorts/`):**

| Channel | Median views (last 60 shorts) | Format |
|---|---|---|
| **@zackdfilms** | **8.35M** (top 23M) | 3D-animated "how X works" mini-explainers, one calm narrator, ~30–45 s |
| @EpicTruthSeekers | 119K (top 5M) | AI visuals + narration on ancient mysteries / religion; CTA to a book |

**Zack D Films titles** are curiosity questions + one emoji: "How Ink Tags Stop Clothing Thieves 😏", "Why Alcatraz Only Gave Prisoners Hot Showers 🤨",
"Toucan Gets A Custom Artificial Beak 😌", "He Turned Truck Exhaust Into Ink 😮". The pattern is **How / Why / What is + a specific object + emoji**.

**Script mechanics** (from transcripts):
1. **No intro, no "hey guys".** Line 1 is already the story or the claim, over the most striking visual.
   - Zack: "A special pattern was drawn onto the spider…"
   - Epic: "The only way to kill the giants was to drown them." / "They never told you this about mermaids."
2. **Short declarative sentences, one action per sentence** ("Then… Then… And after this…"). The picture changes on each sentence.
3. **The process is narrated step by step to a payoff line** that names the result ("…the exact moment Peter Parker turned into Spider-Man").
4. **Length:** 85–170 words, about 30–60 s at ~170 wpm.
5. **Open-loop devices:** "they never told you", "here's why", "you won't believe how it works", a question in the title answered at the end.
6. **End:** a question to the viewer ("Which did you find most surprising?") or a CTA. Zack ends on the payoff with no CTA, which loops well.

**How we apply it to Paul's footage (event or tech reels):**
- **VO hook, 0–3 s:** a claim plus a curiosity gap over the best visual (the result).
  "This ATM in Moscow doesn't just give you cash… it checks your health."
- **VO bridges between real sound bites:** VO asks or sets up, then the real person's line answers it.
  Interview bites are the proof; the VO carries the story and replaces long setup.
- **Russian/foreign speakers:** the VO can *narrate* what they're saying instead of a wall of subtitles, keeping one short subtitled bite for authenticity.
- **Payoff line + viewer question** at the end ("Would you trust an ATM with your health?"). Aim for 30–50 s.
- **Titles:** "How This Russian ATM Checks Your Health 😮" style, i.e. How/Why + specific object + emoji.
- **Voice:** Paul's own voice recorded clean, or a voice made only from his consented samples, with an AI-voice disclosure if synthetic.
  Never a generic stock-narrator voice pretending to be him. VO mixed above everything (−16 LUFS), with the interview bites matched to it.
- Captions follow the VO word by word; keep the same caption system as the rest of the reel.

**Decided (Paul, 2026-10-08):** Paul records the VO himself (the lines are scripted per short).

### 22.1 The Zack D Films structure (measured on his top 12, 12–23M views each; + Hoodie Guy "Evolution of Your Alarm Clock", 1.3M)
Downloaded with Paul's permission: `research/vo-shorts/video/`. Transcripts in `asr/`, measurements in `analysis.json`.
**Retention comes from the script, not the editing:**
- 22–45 s (median ~31 s), 65–115 words, 150–178 wpm, a calm storyteller voice (not hype).
- Speech starts at 0.0 s in every video.
- **Hard cuts: 0–2 in most videos.** One continuous camera move follows the action instead.

1. **Cold open in the middle of the action.** Line 1 is the most vivid moment, told as if you already know the story:
   - "It swung down and smashed right into the toucan's upper beak."
   - "A maggot dropped from her ceiling…"
   - "She woke up and found a bullet under her pillow…"
   - "The tube slid over the truck's exhaust pipe…"
   No intro, no topic sentence. **The title states the topic; the first line drops you into the action.**
2. **Or put the viewer in the scene:** "If you try to pull open a security tag…", "If Alcatraz had cold showers…", "Take a photo of…", "You would give the mouse giant kangaroo legs…".
3. **Every sentence opens with a connector** (So / But / Then / Now / Until / Once).
   - "So" moves the story forward; "But" adds a new problem. That's a micro open loop every 4–5 s: the viewer always waits for how the next problem gets solved.
   - Example: "But the new beak couldn't be too heavy… So they made it large, but almost hollow."
4. **One step = one sentence = one picture.** The process is shown step by step. Concrete numbers ("after 20 days", "180 miles in 31 days", "$3"). No jargon.
5. **A reversal in the last third** that undercuts the obvious reading:
   - "It might look like it's doing the giraffe a favour, but…"
   - "Except for Jar…"
   - the neighbour's dog fired the gun
6. **The payoff is the last words, then it ends immediately.** No CTA, no "follow".
   - "…the toucan could pick up fruit again." / "…found her skeleton." / "…turned into Spider-Man."
   - Often it loops back to the opening ("…so the whole thing can begin again"), so the replay feels seamless.
7. **Titles:** How / Why / What Is + one specific object + one emotion emoji (😮 😱 🤔 😏 🤨 😨). The title is never the first spoken line.
8. **Captions:** small white words, 2–3 at a time, mid-low frame, no box.
   Hoodie Guy uses one word at a time in caps at the top, cuts every ~2.7 s, and opens on a "how did X go from this to this?" question plus a sarcastic aside.
   EpicTruthSeekers opens with forbidden-knowledge lines ("They never told you this about…", "The only way to kill the giants was to…").

### 22.2 Decided split (Paul, 2026-10-08): VO bookends, real people in the middle
- **People who speak English or demo on camera** (most interviews, and anyone talking to the tech):
  - Paul records **only the hook (line 1, ≤3 s) and the ending line.**
  - The middle is the real demonstration/interview, cut tight, with captions and graphics as in AIJ-01. The people talking to the machines are the proof; don't narrate over them.
- **Russian-only demos** (Data Tracker, Kaspersky, the staff explaining Irochka, the face-scan rPPG explanation) and **footage with no interview** (NAVIO, GigaAgent, robot arms, booth B-roll):
  - Paul narrates the middle too (full VO), with one short subtitled bite kept for authenticity.
- Hook = Zack cold open: drop into the action, never "hey guys, today…".
- Ending = a payoff/punchline or loop line, never "follow for more". The viewer question goes in the caption and pinned comment.

### 22.3 Full-VO recipe (Russian-only and no-interview shorts)
- **Line 1 (VO):** cold open on the most striking action in the footage, as if mid-story, ≤12 words. The title carries the topic.
- **Lines 2–5:** So / But / Then chain. Each VO line sets up a **real sound bite** (the innovator, the machine, Paul's reaction) that proves it.
  Use a "But" line before each bite to open a micro-loop. Foreign speech: one short subtitled bite at most; the VO explains the rest.
- **Last third:** a reversal or the "why" (the unexpected reason, cost or consequence).
- **End on the payoff words.** The viewer question lives in the caption and pinned comment, not the VO.
- 30–45 s, ~90–110 words of VO + bites, Paul's calm storyteller voice at ~165 wpm.
- Footage moves on every line (punch-ins, B-roll); captions 2–3 words, small, clean.
- **Recording:** phone Voice Memos, 15–20 cm from the mouth, a small soft room (a wardrobe or a duvet over the head beats an empty room).
  Three takes of each line with a 1-second gap, read like telling a friend a strange story. Paul sends the files; we cut on measured pauses and normalise to −16 LUFS.

## 23. Script-writing system: how content holds attention (Kallaway, 2026-10-13)

Paul sent 6 reels by **@kallawaymarketing** (2M+ followers; 1M+ views more than 100 times) to learn how scripts work.
Clips, transcripts and contact sheets: `~/hyperframes-student-kit/research/content-refs/` (k01–k06, `fetch.py`).
These are principles in our own words, not his copy. **Run every script through 23.8 before Paul records it.**

| Ref | Topic | Length | Speech |
|---|---|---|---|
| k01 | The 4 view ceilings (1K / 10K / 100K / 1M) | 2:30 | 223 wpm |
| k02 | Modern story arc vs the school arc | 1:14 | 233 wpm |
| k03 | The dopamine addiction loop (4 steps) | 1:47 | 245 wpm |
| k04 | The triple loop method (hook / intensifier / rehook loops) | 1:21 | 221 wpm |
| k05 | CTAs in every video; lead magnets as "speed savers" | 1:00 | 232 wpm |
| k06 | Story flow: the thread that snaps | 1:27 | 243 wpm |

### 23.1 The view ceilings: what to fix depends on where a video stalls (k01)
| Stuck below | The problem | The fix |
|---|---|---|
| **1,000** | the first 1–2 sentences are unclear; nobody knows what the video is about | **the 4 S's of a hook:** **Subject** (clear what it's about) · **Stakes** (a clear reason to keep watching) · **Simple** (third-grade words) · **Super clear** (short, punchy sentences) |
| **10,000** | the topic isn't tied to an outcome the viewer cares about, or you get to it too late | pick topics the viewer already cares about and tie them to **a pain they have or a desire they want**, in the hook. **Visuals must match the first sentences** |
| **100,000** | the angle isn't explosive | a **non-obvious take that is broadly relatable** (you can build a 7-figure business without ever passing 100K) |
| **1,000,000** | — | either a **huge topic** (100M+ people care: sports, dating, music, culture) or **real controversy in a narrow topic** that makes people argue in the comments |

**For Paul now:** most videos are under 1K, so the hook's 4 S's are the first fix. Then tie each topic to a *job or money/time* outcome (his "AI for real work" promise, §18).
Controversy only when it's honest and Paul believes it (e.g. "Learning Photoshop in 2026 is a waste of time"). Never fake rage-bait.

### 23.2 The modern story arc (k02)
- The school arc (conflict → rising action → climax → falling action → resolution) fails on social, because people scroll away before the rising action.
- **Start at 70/100:** the first 5 s feel like being dropped into a story that's already moving (same as Zack's cold open, §22.1).
- **Spike to 90 within the next 5–10 s:** the first peak is a contrast moment, a contrarian statement or a shocking stat.
- Then **peak → release → peak** every ~20–30 s until the end. No single climax in the middle: stack mini-peaks and re-hook as long as the video runs.

### 23.3 The dopamine loop: 4 steps per story beat (k03)
1. **Stakes:** a character to root for + something at risk + urgency. Not life or death; just personally relevant to the ideal viewer ("I have to sell my house if I don't finish this in two weeks").
2. **The big question:** enough context that a juicy question pops into the viewer's head (casino: which card comes next?). Stakes make them pay attention; the question makes them curious.
3. **The head fake:** the stakes and question lead the viewer to assume A, then the story snaps to **B**. Contrast is what makes it addictive.
4. **The rehook:** start the next loop as fast as possible. Good stories have one loop; great stories run several loops in a row.

### 23.4 Three kinds of open loops (k04)
- Structures (single body, double body, listicle, tutorial) matter less than **loops**.
- **Hook loop (0–5 s):** opens the first curiosity. If it misses, nothing else matters.
- **Intensifier loop (5–15 s), the one most people skip:** doubles down on the hook's intrigue. A "curiosity magnet" that pulls the viewer through the first 15 s.
  Examples: a bigger number, a twist on the hook ("…and it's free"), "but that's not the crazy part".
- **Rehook loop (~halfway):** re-triggers curiosity just as the first two loops fade.
  Examples: "but here's where it went wrong", a new problem, a reveal tease, the mid-video reprise (§6 P12).

### 23.5 Story flow: every sentence stays on one thread (k06)
- A story is points on one thread. Twists are fine, but every point that drifts from the main subject stretches the thread, and too much drift snaps it. Then the viewer is lost.
- **Each sentence is a close building block on the last one**, all about the subject the hook anchored ("Meta launched Muse → its features → people using it" holds; "Muse → AI → 5 kinds of AI → infrastructure → chips" snaps).
- **Test:** cover the hook, read any body sentence, and ask "is this still about the hook's subject?" If not, cut it or bridge it back.

### 23.6 CTAs and lead magnets (k05)
- **Put a CTA in every video.** Kallaway grew 0 → 100K followers in 5 months with a CTA on every video (44K emails from 6M views). CTAs don't kill growth when they are good.
- **A good CTA feels like a favour, not a request.** People don't comment a keyword to get *more homework*. They comment when the thing **solves one specific problem fast**, so frame every lead magnet as a **speed saver**.
- Place: the last ~10 s, after the payoff, as **"Comment [WORD] and I'll send you [specific speed saver]"**. The word is short and tied to the topic (CEILINGS, STORY, LEAD, LAUNCH).
- Make it visual: a thumbnail grid of the doc/prompts appears as he says it; the keyword is in quotes in the header.
- **Paul's speed savers:** the exact prompt pack for this video, a one-page "copy-paste" template, the shortcode list, the toolkit PDF, a WhatsApp template for a business. "Comment LOBBY and I'll send you the prompt" is already right.
  (Delivering requires a DM automation such as ManyChat, or replying by hand; Paul's decision.)
- Matches the funnel (§21.9): **bottom** videos sell; every **top/middle** video can still carry a speed-saver CTA.

### 23.7 How he shows it (the visual format)
- **Two layouts alternate:**
  - Concept beats: the top 2/3 is a black canvas with **one glowing diagram per idea**; the bottom 1/3 is the talking head in a small framed shot.
  - Emphasis lines: a full-frame face close-up.
- **One visual metaphor per concept:** a pyramid for the ceilings, a line graph for the story arc, an infinity loop for the dopamine loop, poker chips for stakes, a road forking for the head fake, a magnet for curiosity, a thread of dots for story flow. The diagram builds as he names each part.
- **A persistent section header** at the top (sans + italic serif accent, the key word in a red box): "The Second *View Ceiling*". It changes per section and works as a progress marker.
- **One-word captions** on the spoken word, centre.
- **Proof inserts** (his profile at 2M, revenue graphs, view counts) right after a claim. Short meme/film inserts on emotional words (k02 "dopamine", k03 a film still on the head fake).
- Fast delivery (220–245 wpm), a visual change every ~2–5 s, one colour family per video (red, or purple, or lime).
- **For Paul:** this is a ready-made **Mode A teaching-reel format** for "how X works" videos (AI concepts, prompting rules, business tips): our §5 blue + lime world, his face in the lower third, one glowing diagram per idea. Speak a little slower than Kallaway (~185–200 wpm).

### 23.8 Script checklist (use before every recording)
1. **Hook, 4 S's:** is the subject clear in sentence 1? Is there a stake (pain, desire, risk)? Third-grade words? Short sentences? Do the visuals match the words?
2. **Starts at 70:** no intro, no "hey guys". Drop into the action or the claim (§22.1).
3. **Intensifier by ~10–15 s:** a second, bigger reason to stay (number, twist, "and it's free", "but that's not the crazy part").
4. **Stakes + big question + head fake:** what does the viewer assume, and where do we snap to B?
5. **Peaks every 20–30 s;** a **rehook at ~50%**.
6. **Story flow:** every sentence on the hook's thread. Cut tangents.
7. **Payoff closes the hook loop,** then the **speed-saver CTA** ("Comment WORD and I'll send you…").
8. **Topic test (10K ceiling):** is it tied to a job, money or time outcome the viewer already wants?
9. **Angle test (100K):** is there a non-obvious take a broad audience relates to?

### 23.9 Applied to Paul's formats
- **VO-bookend shorts (AIJ, §22.2):** the hook line is the 4-S hook; the interview's first strong claim is the intensifier; the ending is the head-fake or payoff ("…but the lie still gets caught in the interview"). Add a speed-saver CTA in the caption or pinned comment, not the VO.
- **How-to shorts (Hotel Lobby):** result first (start at 70) → "for free" intensifier → steps → payoff → "Comment LOBBY". That's the model; keep it.
- **Long-form (§5):** the intensifier is the roadmap line by ~0:30; the rehook is the 40–60% re-hook (§5 device 8); every chapter is one dopamine loop (stakes → question → head fake → rehook).

