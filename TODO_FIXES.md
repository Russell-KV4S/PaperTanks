# Paper Tanks — Things To Fix / Finish

Status as of 2026-11-16. Code review fixes are committed but not yet in any uploaded build (see the last section). itch.io is live; Google Play has version 1 (1.0) active on the Closed testing - Alpha track.

## Done
- [x] itch.io page published: https://russell-kv4s.itch.io/paper-tanks (HTML5, 450x800 portrait, free, No payments)
- [x] Genre corrected to Action (was Strategy)
- [x] Legacy launcher icons (`mipmap-*/ic_launcher*.png`) replaced with the real notebook/tank/pencil artwork
- [x] `release/paper-tanks-play.aab` rebuilt and signed with the new icons (versionCode 1, not yet uploaded)
- [x] Store art generated in `release/art/` (icon-512, feature-1024x500, itch cover, 5 phone screenshots `01`–`05` at 1080×1920)
- [x] Fixed `VictoryModal.svelte` `.grade-circle` hardcoded light background so dark themes (`trapper`, `terminal`) keep proper contrast
- [x] Verified all 15 Android `mipmap-*` PNGs (valid signatures, exact density dimensions, intact `IEND` chunks) and adaptive icon XMLs (`mipmap-anydpi-v26/`)

## Google Play (closed test running)
Done:
- [x] App created in Play Console (`com.papertanks.arcade`, Game, Free, category Arcade)
- [x] Privacy policy URL, all App content declarations, store listing text, contact email
- [x] Closed testing - Alpha: 178 countries targeted
- [x] Version 1 (1.0) uploaded (Play shows "Nov 14, 2026, 10:16 PM", status Active, "App update published")

Still to do:
- [ ] Confirm 12+ real testers are on the track's email list and have opted in (they must stay opted in 14 days in a row)
- [ ] After 12 testers x 14 days: Dashboard > Apply for production (answer the closed-test questions)
- [ ] Verify store listing graphics attached (icon-512, feature-1024x500, phone screenshots `01`–`05` from `release/art/`)
- [ ] Ship the bug-fix build (see "Code review fixes" below, plus the `VictoryModal.svelte` dark-theme fix the uploaded bundle most likely predates). `versionCode` is now 2 / `versionName` 1.0.1 in `android/app/build.gradle`; still to do: `npm run android:sync`, rebuild and sign the `.aab`, upload as a new closed-test release. The local `release/paper-tanks-play.aab` is still versionCode 1 and cannot be uploaded as-is.
- [ ] Back up `android/paper-tanks-upload.jks` outside OneDrive-only storage (losing it blocks future updates)
- [ ] Optional: phone number / website in Store settings contact details

## itch.io polish
- [x] Re-uploaded build: the itch page now lists a single `paper-tanks-itch.zip` dated 7:00 PM (replacing the 3:27 PM one), "played in the browser" ticked, and the embed loads the title screen. `release/paper-tanks-itch.zip` matches a fresh build, so this should include the `VictoryModal.svelte` fix (not byte-verified against the upload)
- [ ] Rebuild `release/paper-tanks-itch.zip` and re-upload so the itch page gets the code review fixes below
- [ ] `release/ITCH_LISTING_ENHANCED.md` says Pricing "$0 or donate"; the live page is set to "No payments" (no payout account configured). Pick one and make them agree
- [ ] Description has big gaps between lines (plain text typed into the rich editor). Retidy with bullet list / bold headings
- [ ] Check the **AI generation disclosure** wording matches what you want public (currently "Yes", shows "AI Assisted: Code")
- [ ] Dismiss or ignore the "post a devlog" banner (optional)
- [ ] Optional: upload screenshots `03`–`05` from `release/art/` (itch recommends 3-5; 5 now ready locally)
- [ ] Optional: confirm Input methods (Mouse, Touchscreen) if itch offers the field
- [ ] Optional: set up payouts later only if you want tips through itch (Publisher Terms + PayPal/Stripe); Buy Me a Coffee link is already in the description

## Testing (automated + remaining device checks)
- [x] Full 1P campaign (10 stages) — automated physics/AI reachability + progression store tests + live headless browser verification
- [x] 2P pass-and-play mode, including the HUD flip — verified in headless browser (`.hud-top.flipped` rotates 180° on P2 turn)
- [x] All 4 themes and 5 decal sets — verified in unit tests + live headless browser rendering
- [x] Easy and Hard skirmish difficulty — verified AI profile scaling in unit tests + live browser launch
- [ ] Touch controls on a real phone (itch embed and the Android build). Specifically re-check after the review fixes: a second finger while aiming is ignored, an interrupted touch (notification shade / back gesture) cancels the shot instead of firing, and Direct Flick does not fire when you stop and then lift
- [ ] Install `paper-tanks-debug.apk` on a device and check the launcher icon on Android 7.x and 8+ (no ADB device connected)

## Code / repo
- [x] Commit pending changes (10 `mipmap-*` PNGs, `VictoryModal.svelte`, `tests/engine.test.ts`, `TODO_FIXES.md`) — in commit `8f72c3c`
- [x] `npm test` script added (bundles `tests/engine.test.ts` with the rolldown that ships with Vite; no extra install)
- [ ] Decide whether `release/art/` should be committed or gitignored (`release/` appears ignored)
- [ ] If Play flags the tip link: hide it on native Android only (snippet in DEPLOYMENT.md, then bump `versionCode`, rebuild `.aab`)
- [ ] Optional: install `butler` for future itch.io updates (`butler push release/paper-tanks-itch.zip <user>/paper-tanks:html5`)

## Code review fixes (2026-11-16, not yet in any uploaded build)
Verified with `npm run check`, `npm test` (9/9) and a headless-browser playthrough of stage 1.
- [x] Interrupted touch fired a shot: `pointercancel` was wired to the release handler. It now aborts the aim (`GameEngine.handlePointerCancel`)
- [x] A second finger during an aim took over the drag; extra pointers are now ignored
- [x] Opening MENU mid-drag could still launch a shot behind the pause card; pausing now cancels the aim
- [x] Direct Flick used a stale swipe velocity when the finger stopped before lifting, changing angle and power
- [x] Screen shook forever behind the report card / pause menu (shake only decays while unpaused). The report card now also waits 0.9 s so the final explosion plays instead of freezing mid-burst
- [x] `ctx.roundRect` (erasers, pencil) is missing on WebView < Chrome 99 / Safari < 16 and froze the game loop there; added a fallback
- [x] Canvas was forced to at least 320x480, pushing the arena off-screen in short/narrow viewports; it now fits the container
- [x] A corrupt or outdated save (unknown theme id, bad level number) crashed on load; saved data is now validated
- [x] A new `AudioContext` leaked on every visit to the game screen; it is closed on exit
- [x] HUD badges blocked touches on the canvas beneath them; only MENU takes input now
- [x] AI turn could stall forever if no shot was chosen; it now hands the turn back
- [x] Graph / terminal paper themes were missing major grid lines in the letterbox margins

Noted, left as is (behaviour choices, not defects):
- Theme changed mid-match keeps scars already drawn in the old theme's colours until the next sheet
- Shots pass through your own units
- `window.devicePixelRatio` changes (browser zoom, moving between monitors) are only picked up on the next resize
