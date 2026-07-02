# Release Checklist — Drug Wars Reloaded v1.0.0

**Developer:** AIventure Studios  
**App name:** Drug Wars Reloaded  
**Android package:** `com.aiventurestudios.drugwarsreloaded`  
**Version:** 1.0.0 (version code **1**)  
**EAS project ID:** `548cd18a-6cad-42d2-b42f-328abad55495`  
**Privacy:** https://www.aiventure-studios.com/drugwars-reloaded/privacy  
**Support:** contact@aiventure-studios.com

---

## 1. Pre-build validation

Run locally before every release candidate:

```bash
npm ci
npm run typecheck
npx expo-doctor
npx tsx src/game/financeSmokeTest.ts
npx tsx src/game/empireSmokeTest.ts
npx tsx src/game/empireEdgeCaseTest.ts
npx tsx src/game/marketTrendTest.ts
```

- [ ] `npm ci` succeeds (requires committed `package-lock.json`)
- [ ] `npm run typecheck` passes
- [ ] `npx expo-doctor` passes
- [ ] All smoke tests above pass
- [ ] `app.json` — name, package, version 1.0.0, versionCode 1, portrait, dark UI
- [ ] `eas.json` — preview → APK, production → AAB
- [ ] `ENABLE_REAL_IAP` is **false** until Play Billing is wired
- [ ] Production builds do **not** enable dev mock purchases (`__DEV__` is false in release)
- [ ] Privacy policy live at https://www.aiventure-studios.com/drugwars-reloaded/privacy

---

## 2. Build commands

### Preview APK (device QA / sideload)

```bash
eas build --platform android --profile preview --clear-cache
```

- Output: **APK** (`preview` profile → `android.buildType: apk`)
- Install on a physical Android device for smoke testing

### Production AAB (Google Play upload)

```bash
eas build --platform android --profile production --clear-cache
```

- Output: **AAB** (`production` profile → `android.buildType: app-bundle`)
- Upload this file to Google Play Console

---

## 3. Final phone QA (preview APK)

Test on a physical Android device before uploading the production AAB:

- [ ] Install preview APK on device
- [ ] App opens to **Title screen**
- [ ] **New Game** works
- [ ] **Cinematic intro** plays on first arrival / travel (when applicable)
- [ ] **Buy** and **Sell** work in Market
- [ ] Market **trend arrows** and price changes display correctly
- [ ] **Stay Here** advances the day
- [ ] **Move Area** does **not** advance the day
- [ ] **Travel City** advances the day
- [ ] Random **events popup** — choices resolve in modal **RESULT** screen before returning to hub
- [ ] **Finance** — debt payment / borrow flows work
- [ ] **Crew**, **Business**, and **Property** screens load without errors
- [ ] **Store** shows purchases **unavailable** (IAP disabled in v1.0.0)
- [ ] No mock purchases in production release build
- [ ] **Continue** restores saved run after force-close
- [ ] **Reset Run** works; wallet credits preserved per design
- [ ] No stretched images or obvious layout breaks
- [ ] No placeholder text or missing icons in core screens
- [ ] **About / Privacy** opens; disclaimer visible; matches `PRIVACY_POLICY.md`
- [ ] Portrait lock; dark theme throughout
- [ ] Offline play with airplane mode (no account required)

---

## 4. Google Play Console — internal testing

1. Create app (or open existing) in [Google Play Console](https://play.google.com/console)
2. Upload production **AAB** to **Internal testing** track
3. Complete **App content** forms:
   - [ ] Privacy policy URL: https://www.aiventure-studios.com/drugwars-reloaded/privacy
   - [ ] **Data safety** — no data collected (see `PRIVACY_POLICY.md`)
   - [ ] **Content rating** (IARC) — use `CONTENT_RATING_NOTES.md`
   - [ ] Target audience / ads declaration (**no ads** in v1.0.0)
   - [ ] In-app purchases declaration: **No** (until billing goes live)
4. Store listing:
   - [ ] Copy from `STORE_LISTING.md`
   - [ ] **512×512** icon → `store-assets/icon-512.png`
   - [ ] **1024×500** feature graphic → `store-assets/feature-graphic-1024x500.png`
   - [ ] Phone screenshots (minimum 4) — see `store-assets/README.md`
5. Add internal testers by email
6. Submit internal test release
7. Verify install from Play internal link on device
8. Promote to **Production** only after full QA sign-off

---

## 5. Store / IAP status (v1.0.0)

- [ ] `ENABLE_REAL_IAP = false` in `src/services/platformBilling.ts`
- [ ] Store UI shows **Not available in this release** on product cards
- [ ] Billing status banner states purchases are unavailable
- [ ] No dev mock purchases in production release builds
- [ ] No external payment links
- [ ] `STORE_LISTING.md` does not claim IAP is live
- [ ] Play Console IAP products **not required** until billing enabled

When enabling IAP later:

1. Create products in Play Console (SKUs in `src/data/products.ts`)
2. Wire `expo-iap` / `react-native-iap` in `platformBilling.ts`
3. Set `ENABLE_REAL_IAP = true`
4. Update store listing and data safety forms
5. Re-test preview APK + internal track with licensed testers

---

## 6. Policy & content sign-off

- [ ] Fictional drug trade only — no real-world instructions (`GAME_DISCLAIMER` in About)
- [ ] No real-money gambling, loot boxes, or external payment links
- [ ] No user-generated content
- [ ] No account required; offline single-player
- [ ] No ads in v1.0.0
- [ ] No personal data collected in v1.0.0
- [ ] Content rating notes filed (`CONTENT_RATING_NOTES.md`)

---

## 7. Assets checklist

- [ ] `assets/icon.png` — 1024×1024 app icon
- [ ] `assets/adaptive-icon.png` — 1024×1024
- [ ] `assets/android-icon-foreground.png` / `android-icon-background.png`
- [ ] `assets/splash-icon.png` + dark splash (`#08080c`)
- [ ] `store-assets/icon-512.png`
- [ ] `store-assets/feature-graphic-1024x500.png`
- [ ] Phone screenshots exported to `store-assets/screenshots/phone/` (minimum 4)

Regenerate icons from master artwork:

```bash
npx tsx scripts/generateAppIcons.ts
```

---

## 8. Final sign-off

- [ ] Version **1.0.0** / version code **1** confirmed in Play Console
- [ ] Support email **contact@aiventure-studios.com** monitored
- [ ] Internal test approved by team
- [ ] Production rollout staged (optional staged %)
