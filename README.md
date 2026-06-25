# Drug Wars Reloaded

A fictional offline crime-economy strategy game built with **React Native**, **Expo**, and **TypeScript**.

Inspired by classic calculator-era trading games, with original code, neon UI, and empire mechanics. No real-world instructions — pure strategy fiction.

**Version:** 1.0.0 (build 1)  
**Developer:** [AIventure Studios](https://www.aiventure-studios.com)  
**Bundle ID:** `com.aiventurestudios.drugwarsreloaded`

## Quick start

```bash
npm install
npx expo start --web --clear
```

Or for a native dev client:

```bash
npx expo start --dev-client --clear
```

Then press `i` for iOS simulator, `a` for Android emulator, or `w` for web.

## Gameplay

- **Buy low, sell high** across 15 cities and 7 districts per city
- **6 commodity types** with volatility, heat, and area-specific demand
- **Empire loop:** crew, suppliers, contracts, properties, businesses, laundering
- **Story missions** and daily objectives guide progression
- **Fully offline** — local save, no account required

## Project structure

```
src/
  components/   UI building blocks
  constants/    App metadata (version, privacy, bundle ID)
  data/         Commodities, locations, events, missions
  game/         Engine logic + React context
  screens/      Home, Hub, Market, Travel, Storage, Status, etc.
  types/        TypeScript definitions
  theme/        Dark neon design tokens
```

## Store & release docs

| File | Purpose |
|------|---------|
| `STORE_LISTING.md` | App Store / Play Store copy and screenshot captions |
| `PRIVACY_POLICY.md` | Privacy policy (host at public URL before submission) |
| `CONTENT_RATING_NOTES.md` | Age rating questionnaire guidance |
| `RELEASE_CHECKLIST.md` | Pre-submission checklist |
| `eas.json` | EAS Build profiles |

## Release builds

### Prerequisites

1. Install EAS CLI: `npm install -g eas-cli`
2. Log in: `eas login`
3. Initialize project: `eas init` (replaces `REPLACE_WITH_EAS_PROJECT_ID` in `app.json` — **pending**)
4. Confirm privacy policy is live at https://www.aiventure-studios.com/drugwars-reloaded/privacy

### EAS build profiles

| Profile | Use |
|---------|-----|
| `development` | Dev client for local debugging |
| `preview` | Internal APK/IPA for testers |
| `production` | Store submission builds |

### Android internal test build

```bash
eas build --platform android --profile preview
```

Upload the AAB/APK to Google Play **Internal testing** track.

For production store build:

```bash
eas build --platform android --profile production
eas submit --platform android --profile production
```

### iOS TestFlight build

```bash
eas build --platform ios --profile production
eas submit --platform ios --profile production
```

Add testers in App Store Connect → TestFlight.

### Local native runs (optional)

```bash
npx expo run:android
npx expo run:ios
```

After changing `app.json` identity fields, regenerate native projects if needed:

```bash
npx expo prebuild --clean
```

## Validation

```bash
npx tsc --noEmit
npx expo-doctor
```

## Tech stack

- Expo SDK 56
- React Navigation (native stack)
- AsyncStorage for local saves
- No backend, analytics, or ads in v1.0.0

## License

See [LICENSE](LICENSE).
