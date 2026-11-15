# Project Specification: Paper Tanks (1980s Pencil-Flick Arcade)

## 1. Project Overview
**Paper Tanks** is a tactile, physics-based 1980s pen-and-paper nostalgia game built for Android (via Capacitor/PWA wrapper) and Web. It faithfully replicates the classic schoolyard notebook game where two players draw tanks/bases on opposite halves of a folded sheet of lined paper and take turns placing a pencil tip on their unit, pressing down on the eraser, and "flicking" the pencil forward to leave a graphite skid mark across the page to destroy enemy units.

### Core Design Pillars
* **Tactile 80s Nostalgia:** Wide-ruled notebook paper, red margin lines, three-hole punches, Bic blue/red ballpoint pen ink, graphite smudges, and crumpled paper explosion effects.
* **Satisfying Touch Physics:** A slingshot/flick mechanic that mimics pressing a real #2 pencil down and snapping it across paper, complete with trajectory wobble, graphite friction, and ink/lead splatter.
* **Zero-Bloat Monetization:** 100% Free — zero banner ads, zero forced video ads, zero paywalls, and no microtransaction currencies. All 4 paper/ink themes and 5 unit decal sets are unlocked for free, alongside an optional external **Buy Me a Coffee** tip jar (`src/lib/config.ts`).

---

## 2. Tech Stack & Architecture
* **Frontend Framework:** Svelte 5 (Vite 8 + TypeScript, `base: './'` for itch.io iframe/subpath compatibility)
* **Rendering Engine:** HTML5 2D Canvas (60 FPS `requestAnimationFrame` loop with `devicePixelRatio` scaling capped at 2.5× for crisp retina/mobile rendering)
* **Audio:** Web Audio API synthesized sound effects (pencil scratch on paper, tension ticks, eraser thud, paper crinkle explosion, ruler/deflection, victory/defeat stamps) — zero external audio asset bloat.
* **Mobile Packaging:** Capacitor 8 Android (`com.papertanks.arcade`, `minSdk` 24 / `targetSdk` 36, locked to **Portrait** in `android/app/src/main/AndroidManifest.xml`).
* **Web / itch.io Packaging:** Static bundle (`dist/` → `release/paper-tanks-itch.zip`), configured for `450×800` portrait HTML5 embed.
* **State Persistence:** `localStorage` (`paper_tanks_save_v1`) for selected theme/decal, aiming control mode, mute toggle, campaign stage unlocks, and best grades.
* **Automated Tests:** `svelte-check` + `node --test` (bundled via `esbuild`) in `tests/engine.test.ts`.

---

## 3. Core Gameplay Mechanics

### A. The Battlefield (The Notebook Page)
* **Layout:** Vertical (Portrait) orientation divided horizontally across the center by a realistic **paper fold crease** (with subtle drop shadow and highlight).
* **Player 1 (Bottom Half - Blue Bic Ink):** Controls 3 to 5 hand-drawn units (Tanks, Bunkers, Radar Dish).
* **Player 2 / AI (Top Half - Red Bic Ink):** Controls an equal mirror or asymmetric squad of hand-drawn units.
* **Obstacles (Notebook Doodles):** Hand-drawn obstacles in the middle zone (e.g., an 80s "Cool S", crumpled eraser shavings, a spiral notebook wire edge, or coffee mug ring stains) that block or deflect pencil-flick trajectories.

### B. The "Pencil-Flick" Mechanic (Core Loop)
1. **Select Unit:** Player taps one of their surviving blue-ink tanks. A subtle hand-drawn circle highlights the active tank.
2. **Aim & Tension (Touch Drag):**
   * Player touches the tank and drags *backward* (slingshot style) OR drags *forward* and flicks. *(Implement Slingshot Pull-Back as default for precision on mobile touchscreens, with an option for direct Flick velocity).*
   * A visual **#2 Yellow Wooden Pencil** renders at an angle over the canvas, pivoting on its graphite tip at the tank's center.
   * Pulling back bends/angles the pencil and displays a faint, jittery graphite sightline (capped at a short distance so players still have to judge power/trajectory by feel).
3. **Release (The Flick):**
   * Releasing the touch snaps the pencil forward.
   * **Trajectory & Physics:** A dark grey **graphite skid line** streaks across the paper from the tank's position.
   * **Organic Imperfection:** Just like a real pencil flick, the line isn't a sterile laser—it has slight paper-grain wobble, tapers in thickness/opacity as the lead loses pressure, and stops when kinetic friction overcomes momentum.
   * **Penetration / Deflection:**
     * Hitting a **light obstacle** (like a doodle) slows the line down or slightly deflects its angle.
     * Hitting a **heavy obstacle** (like a rubber eraser) stops the line dead with a rubber smudge.
     * Crossing the **center fold crease** introduces a tiny, realistic trajectory nudge unless struck at high velocity.
4. **Hit Detection & Destruction:**
   * If the graphite streak intersects an enemy unit's hitbox:
     * **Direct Hit:** The unit is destroyed. Visual effect: a chaotic red/blue scribble-out over the tank + a small paper-tear/crumple particle burst.
     * **Near Miss:** Leaves a permanent graphite streak across the notebook page (the battlefield visibly accumulates battle scars over the match!).

### C. Game Modes
1. **1P Campaign ("Study Hall"):** 10 escalating levels against AI opponents with distinct personalities (from *The Doodler* to *The Principal*) and unique notebook hazards, awarding `A+` through `F` report-card grades.
2. **2P Pass & Play ("Lunch Table"):** Local two-player mode on one device. The top margin HUD automatically flips 180° (`.hud-top.flipped`) on Red's turn so players can play from opposite ends of a phone laid flat on a table.
3. **Skirmish Mode:** Quick randomized 1v1 battle with selectable difficulty (`Easy`, `Medium`, `Hard`).

---

## 4. Visual Aesthetic & UI Specification

### Procedural Canvas Styling (No Heavy Sprite Sheets Needed)
* **Hand-Drawn Ink Shader/Helper (`drawSketchLine`):** All tanks, obstacles, and UI borders should be drawn using a helper function that renders slightly jittered, double-pass vector strokes with rounded line caps to mimic ballpoint pen ink.
* **Persistent Skid-Mark Layer:** Maintain an offscreen `<canvas>` layer (`scarsCanvas`) where every fired pencil streak, explosion scribble, and eraser smudge is permanently blitted so the page looks authentically used by the end of a match.
* **Minimalist HUD:**
  * Styled like handwritten margin notes at the top/bottom edges of the paper (`P1: 3 LEFT`, `TURN: BLUE`, `MENU`).
  * Pause/Settings menu styled as a folded origami paper note or index card overlay.

### Themes & Decals (All 100% Free)
All 4 notebook themes and 5 unit decal sets have `supporterOnly: false` and are selectable in `SupporterModal.svelte` (`PAPER, INK & TIP JAR`):
* **Wide-Ruled Notebook (`classic`):** Cream lined notebook paper + Blue/Red Bic ink + #2 yellow wooden pencil.
* **Engineering Graph Paper (`graph`):** Light mint 5mm drafting grid + mechanical lead + teal/orange ink.
* **Trapper Keeper Neon (1988) (`trapper`):** Dark grid background + neon cyan/pink gel-pen strokes + yellow graphite.
* **Green-Screen Terminal (`terminal`):** Retro CRT phosphor green/amber wireframe mode.
* **Unit Decal Sets:** `Classic Notebook` (`standard`), `Starfighters` (`starfighter`), `UFO Invasion` (`ufo`), `Retro Mechs` (`mech`), and `Paper Fleet` (`battleship`).

---

## 5. Folder & File Structure
```text
src/
├── lib/
│   ├── config.ts               # Optional Buy Me a Coffee URL & toggle
│   ├── engine/
│   │   ├── GameEngine.ts       # Main loop, state machine, turn management, pointer controls
│   │   ├── Physics.ts          # Flick velocity, friction, wobble, crease deflection, obstacles
│   │   ├── Renderer.ts         # Main canvas, cached paper background, & scarsCanvas compositing
│   │   ├── SketchPrimitives.ts # Hand-drawn pen line, circle, unit decals, obstacles, & #2 pencil
│   │   ├── AIController.ts     # Opponent shot calculation with personality error margin
│   │   ├── SoundSynth.ts       # Web Audio API procedural pencil/paper SFX
│   │   └── types.ts            # Shared engine & UI TypeScript types
│   ├── data/
│   │   ├── levels.ts           # 10 campaign stages, AI profiles, & skirmish generator
│   │   └── themes.ts           # 4 paper palettes & 5 unit decal definitions
│   └── stores/
│       └── gameStore.ts        # Svelte state + localStorage persistence
├── components/
│   ├── GameCanvas.svelte       # Fullscreen responsive canvas, HUD (with 2P flip), pause card
│   ├── TitleOverlay.svelte     # Notebook cover title screen, campaign sheet, skirmish & how-to
│   ├── VictoryModal.svelte     # Graded "A+" / "F" red-pen stamp end-of-match screen
│   └── SupporterModal.svelte   # Theme & decal picker + optional Buy Me a Coffee tip jar
├── app.css                     # Global typography, paper button styles, touch-action rules
├── main.ts                     # Svelte mount entrypoint
└── App.svelte                  # Root layout container

tests/
└── engine.test.ts              # Unit tests for campaign stages, physics, AI, themes, & store

android/                        # Capacitor 8 Android project (com.papertanks.arcade)
docs/privacy.html               # GitHub Pages privacy policy (mirrored from PRIVACY_POLICY.md)
release/                        # Local build outputs & store art (gitignored)
DEPLOYMENT.md                   # Reproducible build, itch.io, & Play Console manifest
TODO_FIXES.md                   # Current QA, store polish, and publishing checklist
```

---

## 6. Build, Test & Release Workflow
See [DEPLOYMENT.md](DEPLOYMENT.md) for full Windows/PowerShell commands and store metadata, and [TODO_FIXES.md](TODO_FIXES.md) for current QA and publishing status:
1. **Type-Check & Tests:** Run `npm run check` (`svelte-check`) and bundle/run `tests/engine.test.ts` with `esbuild` + `node --test`.
2. **Web / itch.io Build:** Run `npm run build` and archive `dist/*` into `release/paper-tanks-itch.zip`.
3. **Android Build:** Run `npx cap sync android`, then build `bundleRelease` and `assembleDebug` in `android/`, copying the signed `.aab` to `release/paper-tanks-play.aab`.