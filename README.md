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
3. EAS project linked (`548cd18a-6cad-42d2-b42f-328abad55495` in `app.json`)
4. Confirm privacy policy is live at https://www.aiventure-studios.com/drugwars-reloaded/privacy

### EAS build profiles

| Profile | Use |
|---------|-----|
| `development` | Dev client for local debugging |
| `preview` | Internal **APK** for device QA |
| `production` | Store submission **AAB** (Android) |

### Android preview APK (device QA)

```bash
eas build --platform android --profile preview
```

Install the APK on a physical device for smoke testing.

### Android production AAB (Play Store)

```bash
eas build --platform android --profile production
```

Upload the AAB to Google Play **Internal testing** track.

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

Smoke tests (local):

```bash
npx ts-node --compiler-options '{"module":"CommonJS"}' src/game/financeSmokeTest.ts
npx ts-node --compiler-options '{"module":"CommonJS"}' src/game/empireSmokeTest.ts
npx ts-node --compiler-options '{"module":"CommonJS"}' src/game/empireEdgeCaseTest.ts
```

## Automated EAS Builds

GitHub Actions runs validation on every pull request and push to `main`. Android preview and production builds are triggered manually from the Actions tab.

### Build types explained

| Artifact | Profile | Use |
|----------|---------|-----|
| **Expo Go** | — | **Not used** for this app. Drug Wars Reloaded requires a dev client or standalone build (native modules, dev client, store builds). |
| **Dev client** | `development` | Local debugging with `expo start --dev-client`. Internal distribution. |
| **Preview APK** | `preview` | Install on a physical Android device for QA. Not for Play Store. |
| **Production AAB** | `production` | Google Play upload (Android App Bundle). Required for store release. |

### Create `EXPO_TOKEN` (one-time)

1. Sign in at [expo.dev](https://expo.dev).
2. Open **Account Settings → Access Tokens**.
3. Create a token (**Robot** type is recommended for CI).
4. Grant permissions for **EAS Build** (and **EAS Submit** if you enable submit later).
5. Copy the token — it is shown only once.

### Add the GitHub secret

1. Open the repo on GitHub → **Settings → Secrets and variables → Actions**.
2. **New repository secret**
3. Name: `EXPO_TOKEN`
4. Value: paste the Expo access token.

Never commit tokens to the repository.

### CI workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `validate.yml` | PR + push to `main` | `tsc`, `expo-doctor`, smoke tests |
| `eas-preview-android.yml` | Manual | Preview **APK** for device QA |
| `eas-production-android.yml` | Manual | Production **AAB** for Play Store |
| `eas-submit-android.yml` | Disabled (docs only) | Play upload when service account is configured |

### Run a preview build manually

**GitHub UI:** Actions → **EAS Preview Android** → **Run workflow**

**GitHub CLI:**

```bash
gh workflow run eas-preview-android.yml
```

**Local (same profile):**

```bash
eas build --platform android --profile preview
```

### Run a production build manually

**GitHub UI:** Actions → **EAS Production Android** → **Run workflow**

Runs `tsc`, `expo-doctor`, then builds an **AAB** (`eas.json` → `production.android.buildType: app-bundle`).

**GitHub CLI:**

```bash
gh workflow run eas-production-android.yml
```

**Local:**

```bash
eas build --platform android --profile production
```

Upload the resulting AAB to Google Play **Internal testing** before promoting to production.

## Tech stack

- Expo SDK 56
- React Navigation (native stack)
- AsyncStorage for local saves
- No backend, analytics, or ads in v1.0.0

## License

See [LICENSE](LICENSE).
