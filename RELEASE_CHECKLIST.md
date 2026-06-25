# Release Checklist — Drug Wars Reloaded v1.0.0

**Developer:** AIventure Studios  
**Bundle ID:** `com.aiventurestudios.drugwarsreloaded`  
**Privacy:** https://www.aiventure-studios.com/drugwars-reloaded/privacy  
**Support:** support@aiventure-studios.com

## Pre-build identity

- [x] Bundle ID set to `com.aiventurestudios.drugwarsreloaded` in `app.json`, `src/constants/appInfo.ts`, and Android native projects
- [x] Privacy policy URL set in `src/constants/appInfo.ts` and About screen
- [x] Studio credits and support email updated in app and docs
- [ ] Run `eas init` and replace `REPLACE_WITH_EAS_PROJECT_ID` in `app.json` (pending — no EAS project linked yet)
- [ ] Confirm privacy policy is live at https://www.aiventure-studios.com/drugwars-reloaded/privacy

## Assets needed

- [ ] **App icon** — 1024×1024 PNG (`assets/icon.png` exists; verify final art)
- [ ] **Splash screen** — dark background (`assets/splash-icon.png` + `#08080c` in config)
- [ ] **Android adaptive icons** — foreground/background/monochrome (`assets/android-*`)
- [ ] **Screenshots** — phone 6.7" and 6.1" (iOS); phone + 7" tablet (Android)
- [ ] **Feature graphic** — 1024×500 (Google Play only)

## Store metadata

- [ ] Copy listing from `STORE_LISTING.md` into App Store Connect / Play Console
- [ ] Upload screenshots with captions from `STORE_LISTING.md`
- [ ] Add privacy policy URL to store listings (matches in-app About screen)
- [ ] Complete content rating questionnaire using `CONTENT_RATING_NOTES.md`
- [ ] Set age rating (recommended 17+ / Mature)

## Technical QA

- [ ] `npx tsc --noEmit` passes
- [ ] `npx expo-doctor` passes (or document known warnings)
- [ ] New game → tutorial → first sale → mission claim
- [ ] Continue game loads save correctly
- [ ] Reset save confirmation works (iOS, Android, web)
- [ ] All hub routes reachable: Upgrades, Contacts, Properties, Businesses, Missions
- [ ] Portrait lock on device
- [ ] Dark UI on splash, status bar, and in-app

## Android internal testing

- [ ] Create Google Play app listing (internal testing track)
- [ ] Upload AAB from EAS production or preview build
- [ ] Add internal testers by email
- [ ] Verify install on physical Android device
- [ ] Verify offline play with airplane mode

## iOS TestFlight

- [ ] Enroll in Apple Developer Program
- [ ] Create App Store Connect app record
- [ ] Upload IPA via EAS Submit or Transporter
- [ ] Add internal / external TestFlight testers
- [ ] Verify install on physical iPhone
- [ ] Verify offline play with airplane mode

## Device testing matrix

- [ ] iPhone (recent iOS)
- [ ] Android phone (recent API level)
- [ ] Small screen (SE-class) — UI not clipped
- [ ] Tablet (optional) — acceptable layout

## Production build commands

See README **Release builds** section.

- [ ] `eas build --platform android --profile production`
- [ ] `eas build --platform ios --profile production`
- [ ] `eas submit --platform android --profile production` (when ready)
- [ ] `eas submit --platform ios --profile production` (when ready)

## Final sign-off

- [ ] Store description reviewed for fiction disclaimer
- [ ] Privacy policy matches in-app About screen
- [ ] Version 1.0.0 / build 1 confirmed in stores
- [ ] Support email live and monitored
