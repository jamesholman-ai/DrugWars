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
npx tsc --noEmit
npx expo-doctor
```

- [ ] `npx tsc --noEmit` passes
- [ ] `npx expo-doctor` passes (or document any known network-only warnings)
- [ ] `app.json` — name, package, version 1.0.0, versionCode 1, portrait, dark UI
- [ ] `ENABLE_REAL_IAP` is **false** until Play Billing is wired
- [ ] Production builds do **not** enable dev mock purchases (`__DEV__` is false in release)
- [ ] Privacy policy live at https://www.aiventure-studios.com/drugwars-reloaded/privacy

---

## 2. Build commands

### Preview APK (device QA / sideload)

```bash
eas build --platform android --profile preview
```

- Output: **APK** (`preview` profile → `android.buildType: apk`)
- Install on physical Android device for smoke testing

### Production AAB (Google Play upload)

```bash
eas build --platform android --profile production
```

- Output: **AAB** (`production` profile → `android.buildType: app-bundle`)
- Upload this file to Google Play Console

---

## 3. Device QA (preview APK)

Test on a physical Android device before uploading production AAB:

- [ ] App opens to **Title screen**
- [ ] **Enter** → main menu
- [ ] **New Game** works
- [ ] **Continue** works after force-close and reopen
- [ ] Tutorial completes or skips
- [ ] **Buy** and **Sell** work in Market
- [ ] **Stay Here** works (day does not advance)
- [ ] **Move Area** does **not** advance day
- [ ] **Travel City** advances day
- [ ] Mission reward claim shows feedback toast
- [ ] Market trend arrows and price changes display
- [ ] **Store** does **not** grant purchases in production (IAP disabled)
- [ ] **Reset Run** preserves wallet credits
- [ ] **Reset All Data (Dev)** warns before deleting wallet (dev builds only)
- [ ] **About / Privacy** opens; disclaimer visible; matches `PRIVACY_POLICY.md`
- [ ] Portrait lock; dark theme throughout
- [ ] Offline play with airplane mode

---

## 4. Google Play Console — internal testing

1. Create app (or open existing) in [Google Play Console](https://play.google.com/console)
2. Upload production **AAB** to **Internal testing** track
3. Complete **App content** forms:
   - [ ] Privacy policy URL: https://www.aiventure-studios.com/drugwars-reloaded/privacy
   - [ ] **Data safety** — no data collected (see `PRIVACY_POLICY.md`)
   - [ ] **Content rating** (IARC) — use `CONTENT_RATING_NOTES.md`
   - [ ] Target audience / ads declaration (no ads in v1.0.0)
   - [ ] In-app purchases declaration: **No** (until billing goes live)
4. Store listing:
   - [ ] Copy from `STORE_LISTING.md` (v1.0.0 — no live IAP claim)
   - [ ] **512×512** icon
   - [ ] **1024×500** feature graphic
   - [ ] Phone screenshots (see captions in `STORE_LISTING.md`)
5. Add internal testers by email
6. Submit internal test release
7. Verify install from Play internal link on device
8. Promote to **Production** only after full QA sign-off

---

## 5. Store / IAP status (v1.0.0)

- [ ] `ENABLE_REAL_IAP = false` in `src/services/platformBilling.ts`
- [ ] Store UI shows **Not available in this release** for Buy buttons
- [ ] No dev mock purchases in production release builds
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
- [ ] Content rating notes filed (`CONTENT_RATING_NOTES.md`)

---

## 7. Assets checklist

- [ ] `assets/icon.png` — 1024×1024 app icon
- [ ] `assets/splash-icon.png` + dark splash (`#08080c`)
- [ ] Android adaptive icons (`assets/android-icon-*`)
- [ ] Play Store feature graphic 1024×500
- [ ] Screenshots (minimum phone set)

---

## 8. Final sign-off

- [ ] Version **1.0.0** / version code **1** confirmed in Play Console
- [ ] Support email **contact@aiventure-studios.com** monitored
- [ ] Internal test approved by team
- [ ] Production rollout staged (optional staged %)
