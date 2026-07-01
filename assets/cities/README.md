# City Artwork Assets

Drop custom hero and district images here. The app loads artwork via `src/assets/cityArt.ts`.

## Structure

```
assets/cities/
  new_york/
    hero.webp
    district_downtown.webp
    district_harlem.webp
    district_brooklyn.webp
  miami/
    hero.webp
    district_downtown.webp
    ...
  los_angeles/
  detroit/
  las_vegas/
  chicago/
  atlanta/
  ...
```

## Naming

- `hero.webp` — full-screen cinematic intro + command banner fallback
- `district_{areaId_suffix}.webp` — district-specific art (match `areaId` from `src/data/areas.ts`)

## Current behavior

Until local files are added, the app uses curated Unsplash URLs defined in `src/assets/cityArt.ts`. To switch to local assets, update `getCityHeroArt()` / `getDistrictArt()` to `require()` files from this folder.

## Recommended specs

- Hero: 1200×800 minimum, WebP or JPEG, dark/moody city photography
- District: 800×600 minimum
- Optimize for mobile (< 300KB per image)
