# Paper Tanks — Deployment & Publishing Manifest

Machine- and automation-friendly deployment specification for **Paper Tanks** targeting **itch.io (HTML5)** and **Google Play Store (Android `.aab`)**.

---

## 1. Project Identity & URLs

| Field | Value |
| :--- | :--- |
| **App Name** | `Paper Tanks` |
| **Subtitle / Tagline** | `1980s Pencil-Flick Arcade` |
| **Android Package / Application ID** | `com.papertanks.arcade` |
| **Version Code** | `1` |
| **Version Name** | `1.0` |
| **Min SDK / Target SDK** | `24` / `36` |
| **Orientation** | `portrait` (locked in `android/app/src/main/AndroidManifest.xml`) |
| **Developer** | `Russell Thomas` |
| **GitHub Repository** | `https://github.com/Russell-KV4S/PaperTanks` |
| **Privacy Policy URL** | `https://russell-kv4s.github.io/PaperTanks/privacy.html` |
| **Tip Jar URL (Buy Me a Coffee)** | `https://buymeacoffee.com/RussellThomas` |
| **Monetization Model** | `100% Free — Zero Ads, Zero Paywalls, Optional External Tip Jar` |

---

## 2. Local Build Artifacts & Paths

| Artifact | Path (relative to repo root) | Notes |
| :--- | :--- | :--- |
| **itch.io HTML5 Zip** | `release/paper-tanks-itch.zip` | Built from `dist/` (`index.html` + `assets/` at zip root) |
| **Google Play Signed Bundle** | `release/paper-tanks-play.aab` | Copy of `android/app/build/outputs/bundle/release/paper-tanks-release.aab` |
| **Android Debug APK** | `android/app/build/outputs/apk/debug/paper-tanks-debug.apk` | For local `adb install -r` testing |
| **Upload Keystore** | `android/paper-tanks-upload.jks` | Gitignored (PKCS12, alias `paper-tanks`) — **back up safely** |
| **Keystore Config** | `android/keystore.properties` | Gitignored; referenced by `android/app/build.gradle` |
| **Web Build Dir** | `dist/` | Vite output (`base: './'` for iframe/subpath compatibility) |

---

## 3. Reproducible Build Commands (Windows / PowerShell)

```powershell
# 1. Type-check and unit tests
npm run check
npx esbuild tests/engine.test.ts --bundle --platform=node --format=esm --outfile=dist-test/engine.test.mjs
node --test dist-test/engine.test.mjs
Remove-Item -Recurse -Force dist-test

# 2. Build web bundle & itch.io zip
npm run build
New-Item -ItemType Directory -Force -Path release | Out-Null
Compress-Archive -Path "dist\*" -DestinationPath "release\paper-tanks-itch.zip" -Force

# 3. Sync Capacitor & build signed Google Play AAB + Debug APK
npx cap sync android
Push-Location android
.\gradlew.bat bundleRelease assembleDebug --no-daemon
Pop-Location
Copy-Item "android\app\build\outputs\bundle\release\paper-tanks-release.aab" "release\paper-tanks-play.aab" -Force
```

*Note on JDK:* `android/build.gradle` automatically forks `JavaCompile` to `E:/ProgramInstalls/Android Studio/jbr` when Gradle runs under JDK 17, so no extra `-Dorg.gradle.java.home` CLI flag is required.

---

## 4. itch.io Deployment Spec (HTML5)

### Upload Target
* **File to Upload:** `release/paper-tanks-itch.zip`
* **Butler CLI (if installed and logged in):**
  ```powershell
  butler push release/paper-tanks-itch.zip <YOUR_ITCH_USERNAME>/paper-tanks:html5
  ```
* **Manual Web Form:** `https://itch.io/game/new`

### itch.io Project Form Fields
* **Title:** `Paper Tanks`
* **Project URL slug:** `paper-tanks`
* **Short description / tagline:** `1980s pencil-flick tank arcade on wide-ruled notebook paper.`
* **Classification:** `Game`
* **Kind of project:** `HTML`
* **Pricing:** `$0 or donate` (Pay-What-You-Want) — or `No payments`
* **HTML5 Embed Options:**
  * **File flag:** Check `This file will be played in the browser`
  * **Viewport dimensions:** `450` × `800` (Portrait)
  * **Orientation:** `Portrait`
  * **Mobile friendly:** `Checked`
  * **Enable fullscreen button:** `Checked`
  * **SharedArrayBuffer support:** `Not needed`
* **Genre:** `Action` (or `Arcade`)
* **Tags:** `retro`, `80s`, `arcade`, `tanks`, `physics`, `hand-drawn`, `paper`, `pass-and-play`, `casual`, `singleplayer`
* **Input methods:** `Mouse`, `Touchscreen`
* **External support link in description:** `https://buymeacoffee.com/RussellThomas`

### itch.io Description Copy
```markdown
**Paper Tanks** brings back the classic 1980s schoolyard pencil-flick game!

Pick a blue-ink tank, pull back the #2 wooden pencil, and snap it across folded wide-ruled notebook paper to leave permanent graphite scars and scribble out enemy units.

### Features
- **Tactile Pencil-Flick Physics:** Choose Slingshot Pull-Back or Direct Flick aiming. Shots wobble across paper grain, get nudged by the center fold crease, ricochet off paperclips & Cool S doodles, and stop dead in Pink Pearl erasers.
- **1P Study Hall (10-Stage Campaign):** Outsmart 10 classroom rivals from *The Doodler* to *The Principal*.
- **2P Lunch Table (Pass & Play):** Face-to-face local multiplayer on one screen with an auto-flipping top HUD.
- **Skirmish Mode:** Instant randomized battles on Easy, Medium, or Hard.
- **4 Paper Themes & 5 Unit Decal Sets (All Free!):** Wide-Ruled Notebook, Engineering Graph Paper, Trapper Keeper Neon (1988), and Green-Screen CRT Terminal — plus Starfighters, UFOs, Retro Mechs, and Paper Fleet decals.
- **Zero Ads & Zero Paywalls:** 100% free. Optional tips welcome at https://buymeacoffee.com/RussellThomas
```

---

## 5. Google Play Console Deployment Spec (Android)

### Release Binary
* **Upload Artifact:** `release/paper-tanks-play.aab`
* **Track:** Start with **Internal testing** or **Closed testing** (required for newer personal Play Console accounts before Production access), then promote to **Production**.
* **Play App Signing:** Opt in to Google Play App Signing using the generated upload key (`android/paper-tanks-upload.jks`).

### Store Listing Metadata
* **App Name (max 30 chars):** `Paper Tanks`
* **Short Description (74 / 80 chars):**
  `1980s pencil-flick tank arcade on ruled notebook paper. No ads, 100% free!`
* **Full Description (Play-policy compliant — avoids the word "Donate"):**
  ```text
  Fold the notebook page, press down your #2 pencil, and flick!

  Paper Tanks recreates the classic 1980s schoolyard pen-and-paper tank battle with tactile touch physics, permanent graphite battle scars, and zero ads.

  HOW TO PLAY
  1. Tap any of your blue-ink units (Tanks, armored 2-HP Bunkers, or Radar Dishes).
  2. Pull back (or switch to Direct Flick in the menu) to aim the #2 pencil.
  3. Release to streak graphite across the ruled page—watch out for Pink Pearl erasers, wooden rulers, Cool S doodles, coffee mug rings, and the center fold crease!

  GAME MODES
  • 1P Study Hall Campaign: 10 escalating stages against unique classroom rivals—from The Doodler and Geometry Nerd to The Principal.
  • 2P Lunch Table (Pass & Play): Local two-player battles on one phone with automatic top-HUD flip on Red's turn.
  • Skirmish Mode: Quick randomized battles with Easy, Medium, and Hard difficulty.

  ALL THEMES & DECALS INCLUDED (100% FREE)
  • 4 Paper Themes: Wide-Ruled Notebook, Engineering Graph Paper, Trapper Keeper Neon (1988), and Green-Screen Terminal.
  • 5 Hand-Drawn Unit Sets: Classic Tanks, Starfighters, UFO Invasion, Retro Mechs, and Paper Fleet.
  • Zero banner ads, zero forced video ads, and zero paywalls.
  ```
* **App Category:** `Game` → `Arcade`
* **Pricing & Distribution:** `Free` (`$0`)
* **Contains Ads:** `No`
* **In-App Purchases:** `No`

### App Content & Policy Declarations
* **Privacy Policy URL:** `https://russell-kv4s.github.io/PaperTanks/privacy.html`
* **Ads Declaration:** `No, my app does not contain ads`
* **App Access:** `All functionality is available without special access` (no login required)
* **Data Safety:**
  * Does your app collect or share any of the required user data types? **`No`**
  * All game progress and settings stay on-device in `localStorage`.
* **Content Rating (IARC):**
  * Category: `Game`
  * Violence: Abstract/doodle ink scribble-outs only (no realistic violence, blood, or gore) → **Everyone / E**
  * User-generated content / Sharing / Location / Purchases: `No`
* **Target Audience:** `13–15, 16–17, 18 and over` (or `Everyone`, ensuring Store Listing does not specifically target young children if avoiding Families policy extra review).
* **News / COVID-19 / Financial / Health / Government:** `No` to all.

### Store Graphics Checklist (To Generate / Capture Before Production Submit)
* **App Icon:** `512 × 512` px PNG (32-bit, max 1 MB)
* **Feature Graphic:** `1024 × 500` px PNG or JPEG (max 15 MB)
* **Phone Screenshots:** At least `2` portrait screenshots (e.g., `1080 × 1920` px PNG/JPEG) showing Title Cover and Active Gameplay

### Google Play Tip-Jar Compliance Fallback
`src/components/SupporterModal.svelte` currently shows an optional **"Buy Me a Coffee"** link (`https://buymeacoffee.com/RussellThomas`) with **zero unlocked perks or badges**.
If Google Play's automated reviewer ever flags the outbound tip link inside the Android binary, hide it on native Android only while keeping it live on itch.io/Web:
```ts
import { Capacitor } from '@capacitor/core';
const showTipButton = BUY_ME_A_COFFEE_CONFIGURED && !Capacitor.isNativePlatform();
```
Then rebuild `npm run build`, `npx cap sync android`, increment `versionCode` in `android/app/build.gradle`, and rebuild `paper-tanks-release.aab`.
