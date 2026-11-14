# Project Specification: Paper Tanks (1980s Pencil-Flick Arcade)

## 1. Project Overview
**Paper Tanks** is a tactile, physics-based 1980s pen-and-paper nostalgia game built for Android (via Capacitor/PWA wrapper) and Web. It faithfully replicates the classic schoolyard notebook game where two players draw tanks/bases on opposite halves of a folded sheet of lined paper and take turns placing a pencil tip on their unit, pressing down on the eraser, and "flicking" the pencil forward to leave a graphite skid mark across the page to destroy enemy units.

### Core Design Pillars
* **Tactile 80s Nostalgia:** Wide-ruled notebook paper, red margin lines, three-hole punches, Bic blue/red ballpoint pen ink, graphite smudges, and crumpled paper explosion effects.
* **Satisfying Touch Physics:** A slingshot/flick mechanic that mimics pressing a real #2 pencil down and snapping it across paper, complete with trajectory wobble, graphite friction, and ink/lead splatter.
* **Zero-Bloat Monetization:** No banner ads, no forced video ads, and no microtransaction currencies. Monetized via a single one-time **"Supporter Edition"** unlock (additional paper/ink themes, custom tank decals, and extra campaign scenarios) + optional tip jar.

---

## 2. Tech Stack & Architecture
* **Frontend Framework:** Svelte 5 (Vite + TypeScript)
* **Rendering Engine:** HTML5 2D Canvas (60 FPS `requestAnimationFrame` loop with `devicePixelRatio` scaling for crisp retina/mobile rendering)
* **Audio:** Web Audio API synthesized sound effects (pencil scratch on paper, eraser thud, paper crinkle explosion, ruler tap) — zero external audio asset bloat.
* **Mobile Packaging:** Capacitor (Android build target, locked to portrait or landscape—recommend **Portrait** for natural one-handed thumb flicking).
* **State Persistence:** `localStorage` for unlocked themes, campaign progress, and settings.

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
1. **1P Campaign ("Study Hall"): ** 10 escalating levels against an AI opponent with distinct personalities (e.g., *The Doodler*, *The Geometry Nerd*, *The Class Clown*) and unique notebook hazards.
2. **2P Pass & Play ("Lunch Table"): ** Local two-player mode on one device. Screen rotates/flips indicator or plays seamlessly from opposite ends of the phone laid flat on a table.
3. **Skirmish Mode:** Quick randomized 1v1 battle with selectable difficulty.

---

## 4. Visual Aesthetic & UI Specification

### Procedural Canvas Styling (No Heavy Sprite Sheets Needed)
* **Hand-Drawn Ink Shader/Helper (`drawSketchLine`):** All tanks, obstacles, and UI borders should be drawn using a helper function that renders slightly jittered, double-pass vector strokes with rounded line caps to mimic ballpoint pen ink.
* **Persistent Skid-Mark Layer:** Maintain an offscreen `<canvas>` layer (`scarsCanvas`) where every fired pencil streak, explosion scribble, and eraser smudge is permanently blitted so the page looks authentically used by the end of a match.
* **Minimalist HUD:**
  * Styled like handwritten margin notes at the top/bottom edges of the paper (`P1: 3 LEFT`, `TURN: BLUE`, `MENU`).
  * Pause/Settings menu styled as a folded origami paper note or index card overlay.

### Themes (Free vs. Supporter Unlock)
* **Default (Free):** Classic Wide-Ruled Notebook Paper + Blue/Red Bic Ink + #2 Yellow Pencil.
* **Supporter Edition ($2.99 One-Time IAP):**
  * *Engineering Graph Paper:* Light blue/green 5mm grid paper + technical drafting pencil + black/teal ink.
  * *Trapper Keeper Neon (1988):* Dark grid background + neon pink/cyan gel-pen strokes.
  * *Green-Screen Terminal:* Retro CRT phosphor green monochrome wireframe aesthetic.
  * *Custom Tank Decals:* Starfighter, UFO, Retro Mech, and Battleship hand-drawn unit sets.

---

## 5. Folder & File Structure
```text
src/
├── lib/
│   ├── engine/
│   │   ├── GameEngine.ts       # Main loop, state machine, turn management
│   │   ├── Physics.ts          # Flick velocity, friction, wobble, crease deflection
│   │   ├── Renderer.ts         # Main canvas & offscreen scarsCanvas compositing
│   │   ├── SketchPrimitives.ts # Hand-drawn pen line, circle, tank, and pencil renderers
│   │   ├── AIController.ts     # Opponent shot calculation with human-like error margin
│   │   └── SoundSynth.ts       # Web Audio API procedural pencil/paper SFX
│   ├── data/
│   │   ├── levels.ts           # Campaign layouts, obstacles, and enemy placements
│   │   └── themes.ts           # Color palettes for paper, margins, ink, and pencil
│   └── stores/
│       └── gameStore.ts        # Svelte state for UI overlays, scores, and unlocked themes
├── components/
│   ├── GameCanvas.svelte       # Fullscreen responsive canvas + pointer/touch handlers
│   ├── TitleOverlay.svelte     # Notebook cover title screen
│   ├── VictoryModal.svelte     # Graded "A+" / "F" red-pen stamp end-of-match screen
│   └── SupporterModal.svelte   # Theme preview & one-time unlock screen
└── App.svelte                  # Root layout container
```

---

## 6. Step-by-Step Build Instructions for Antigravity
1. **Initialize Project:** Scaffold a Svelte + TypeScript + Vite project with clean mobile viewport meta tags (`user-scalable=no`, `touch-action: none`).
2. **Build `SketchPrimitives.ts` & `Renderer.ts`:** Create the procedural notebook background (ruled lines, red margin, fold crease, punch holes) and the hand-drawn ink tank renderer.
3. **Implement `Physics.ts` & Touch Controls:** Wire up pointer events (`pointerdown`, `pointermove`, `pointerup`) on `GameCanvas.svelte` to render the interactive #2 pencil aiming visual and simulate the graphite skid-mark physics upon release.
4. **Implement `scarsCanvas` & Hitboxes:** Ensure every shot permanently marks the offscreen battle-scar layer and accurately detects intersections with enemy tank bounding boxes and mid-field obstacles.
5. **Add `AIController.ts` & Turn Loop:** Implement alternating turns (`PLAYER_AIM` -> `PROJECTILE_ANIMATING` -> `AI_THINKING` -> `AI_ANIMATING` -> `GAME_OVER`) with a smart AI that calculates angles/power plus tunable inaccuracy.
6. **Synthesize Audio (`SoundSynth.ts`):** Add filtered white-noise bursts for pencil scratches and low-frequency thuds for flicks/hits (unlocking `AudioContext` on first user tap).
7. **Build UI Overlays & Campaign Levels:** Create the handwritten title screen, 10 campaign stages in `levels.ts`, the red-pen "A+ / F" victory stamp modal, and the theme switcher.