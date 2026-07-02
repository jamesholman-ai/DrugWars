# Play Store Assets — Drug Wars Reloaded

**Developer:** AIventure Studios  
**Support:** contact@aiventure-studios.com  
**Privacy:** https://www.aiventure-studios.com/drugwars-reloaded/privacy

Use these files when completing the Google Play Console store listing.

## Included in repo

| Asset | Path | Size | Status |
|-------|------|------|--------|
| App icon (Play Console) | `store-assets/icon-512.png` | 512×512 | Ready |
| Feature graphic | `store-assets/feature-graphic-1024x500.png` | 1024×500 | Ready |
| Master icon source | `assets/source/app-icon-master.png` | source | Ready |
| Expo app icon | `assets/icon.png` | 1024×1024 | Ready |
| Adaptive icon | `assets/adaptive-icon.png` | 1024×1024 | Ready |
| Android foreground | `assets/android-icon-foreground.png` | 1024×1024 | Ready |
| Android background | `assets/android-icon-background.png` | 1024×1024 | Ready |
| Splash image | `assets/splash-icon.png` | 512×512 | Ready |

Regenerate Expo / Play icons after updating the master artwork:

```bash
npx tsx scripts/generateAppIcons.ts
```

## Phone screenshots (capture before production upload)

Google Play requires **at least 2** phone screenshots; recommend **4–8** at **1080×1920** or **1440×2560** (portrait).

Save captures under `store-assets/screenshots/phone/` using these filenames:

1. `01-title.png` — Title screen
2. `02-home.png` — Home / New Game / Continue
3. `03-hub.png` — Command hub (cash, debt, missions)
4. `04-market.png` — Market with price trends
5. `05-travel.png` — Travel / city map
6. `06-missions.png` — Missions / objectives
7. `07-empire.png` — Properties, businesses, or crew
8. `08-about.png` — About / privacy disclaimer

Suggested captions are in `STORE_LISTING.md`.

## Store copy (ready)

- **Short description:** see `STORE_LISTING.md` (80 chars max)
- **Full description:** see `STORE_LISTING.md`
- **Content rating notes:** see `CONTENT_RATING_NOTES.md`
- **Privacy policy URL:** https://www.aiventure-studios.com/drugwars-reloaded/privacy

## v1.0.0 declarations

- No account required
- Offline single-player
- No ads
- No personal data collected
- In-app purchases **disabled** in this release
