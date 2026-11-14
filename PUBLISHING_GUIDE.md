# Paper Tanks — Publishing Checklist (itch.io & Google Play)

## 1. Add Your Buy Me a Coffee URL
Edit `src/lib/config.ts`:
```ts
export const BUY_ME_A_COFFEE_URL = 'https://buymeacoffee.com/YOUR_HANDLE';
export const BUY_ME_A_COFFEE_CONFIGURED = true;
```
Then run `npm run build` and `npx cap sync android`.

---

## 2. Publish to itch.io (HTML5 Web Game)
1. A ready-to-upload zip is generated at `release/paper-tanks-itch.zip` (built from `dist/`).
2. On itch.io, create a **New Project**:
   - **Kind of project:** `HTML`
   - **Pricing:** `No payments` or `$0 or donate` (Pay-What-You-Want — itch.io handles tips natively!)
   - **Embed options:**
     - **Viewport dimensions:** `450` × `800` (Portrait)
     - Check **Mobile friendly** and **Enable fullscreen button**
   - Upload `release/paper-tanks-itch.zip` and check **This file will be played in the browser**.
3. Optionally link your **Buy Me a Coffee** page in the itch.io project description.

---

## 3. Publish to Google Play Store (Android `.aab`)
### A. Generate an Upload Keystore (one-time)
Run from the `android/` directory:
```powershell
keytool -genkey -v -keystore paper-tanks-upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias paper-tanks
```
*(Keep `paper-tanks-upload.jks` and its password backed up safely — never commit it to git!)*

### B. Build Signed Release Bundle (`.aab`)
`android/paper-tanks-upload.jks` and `android/keystore.properties` are already configured (and gitignored). To rebuild the signed Google Play bundle:
```powershell
npm run build
npx cap sync android
cd android
.\gradlew.bat bundleRelease --no-daemon
```
Output bundle: `android/app/build/outputs/bundle/release/paper-tanks-release.aab` (copied to `release/paper-tanks-play.aab`).

### C. Google Play Compliance Notes
- All 4 paper themes and 5 decal sets are unlocked for free (Option A) with zero ads or paywalls.
- Avoid using the word **"Donate"** in your Play Store listing or app UI (Google reserves that term for registered charities). Use **"Tip Jar"** or **"Buy Me a Coffee"**.
- Upload `PRIVACY_POLICY.md` to a public URL (e.g., on `kv4s.com` or GitHub Pages) and paste that URL in Google Play Console → App Content → Privacy Policy.
