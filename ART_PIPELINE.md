# Drug Wars Reloaded — Art Pipeline

End-to-end guide for city artwork: folder structure, importing Midjourney exports, and in-game usage.

## Overview

```
assets/art/
├── reference/          # Art Bible crops (reference_01.png … reference_12.png)
├── defaults/           # Fallback images (never delete)
└── cities/
    └── {CityFolder}/
        ├── manifest.json
        ├── master/       # City hero / splash
        ├── districts/    # Per-district backgrounds
        ├── travel/       # Travel screen cards
        ├── command/      # Command Center header
        ├── loading/      # Loading splashes (rotates)
        └── cinematic/    # Location intro overrides
```

**City folders:** NewYork, Miami, LosAngeles, Chicago, Detroit, LasVegas, Seattle, Atlanta, Houston, Toronto, NewOrleans, Boston, Philadelphia, WashingtonDC, SanFrancisco

## In-game API

Screens must use **`src/assets/imageRegistry.ts`** only:

| Function | Used by |
|----------|---------|
| `getCityMaster(cityId)` | Travel — current city panel |
| `getDistrictImage(cityId, areaId)` | Properties, cinematic fallback |
| `getTravelCard(cityId)` | Travel city cards |
| `getCommandHeader(cityId)` | Command Center hero |
| `getLoadingImage(cityId, seed)` | Command boot loading |
| `getCinematicImage(cityId, areaId, day)` | Location intro |

Never `require()` asset paths from screens.

## Naming convention

After import, files are normalized to:

```
{city_slug}_{category}_{descriptor}.png
```

Examples:
- `new_york_master_night_rain.png`
- `miami_districts_beach_district_night.png`
- `chicago_travel_loop_night.png`
- `detroit_command_downtown_sunset.png`
- `seattle_loading_01.png`

### Future variants (no code changes)

Embed time, weather, and events in filenames:

| Token | Values |
|-------|--------|
| Time | `morning`, `afternoon`, `evening`, `night` |
| Weather | `clear`, `rain`, `fog`, `snow`, `storm` |
| Event | `holiday`, `event_{name}` |

Example: `las_vegas_master_night_clear_holiday.png`

The registry picks the best match; otherwise falls back to any image in the category, then defaults.

## Importing new Midjourney art

1. Export PNG or JPG from Midjourney (16:9, 1920×1080 or 2560×1440).
2. Drop files into the correct city subfolder (any filename).
3. Run:

```bash
npm run import:art
```

This will:
- Rename files consistently
- Update each city's `manifest.json`
- Regenerate `src/assets/generated/cityImages.ts` with static `require()` entries

4. Verify: `npm run typecheck`

## Replacing placeholders

Reference crops from the Art Bible are seeded as `{city}_master_reference.png` for 11 cities. Replace by adding a new master file; the import script uses the first sorted master file — remove old reference files when final art is ready.

Cities without reference art (Boston, Philadelphia, Washington DC, San Francisco) use `assets/art/defaults/` until master images exist.

## Supported sizes

| Use | Min | Recommended |
|-----|-----|-------------|
| Master / cinematic | 1920×1080 | 2560×1440 |
| Command header | 1920×1080 | 2560×1440 |
| Travel card | 1280×720 | 1920×1080 |
| District | 1920×1080 | 2560×1440 |
| Loading | 1920×1080 | 2560×1440 |

Aspect ratio: **16:9** everywhere.

## Optimization before release

1. Export final PNG from Midjourney at target resolution.
2. Optional: convert to WebP with `cwebp -q 85` for smaller bundles (keep PNG in repo if preferred).
3. Run `npm run import:art` after renames.
4. Test on device — Command, Travel, Properties, Location Intro.
5. Remove unused reference/duplicate masters to shrink bundle.

## Performance

`src/assets/imagePreload.ts` preloads:
- Current city bundle on Command Center mount
- Expanded travel destination on Travel screen
- First-session sample of travel cities

All other cities lazy-load on first display. Images cache via `expo-image` (`memory-disk`).

## Prompt libraries

See `docs/art/`:
- `MASTER_CITY_PROMPTS.md`
- `DISTRICT_PROMPTS.md`
- `LOADING_SCREEN_PROMPTS.md`
- `TRAVEL_CARD_PROMPTS.md`
- `COMMAND_HEADER_PROMPTS.md`

## manifest.json schema

```json
{
  "city": "New York",
  "masterImage": "master/new_york_master_night_rain.png",
  "districtImages": ["districts/new_york_districts_harlem_night.png"],
  "travelCard": "travel/new_york_travel_night.png",
  "commandHeader": "command/new_york_command_night.png",
  "loadingImages": ["loading/new_york_loading_01.png"],
  "cinematicImages": []
}
```

Auto-maintained by `npm run import:art` — edit paths manually only if needed.

## Reference board

Original Art Bible panels: `assets/art/reference/reference_01.png` … `reference_12.png`

Mapped order: NY, Miami, LA, Chicago, Detroit, Atlanta, Vegas, Seattle, New Orleans, Houston, Phoenix (reference only), Toronto.
