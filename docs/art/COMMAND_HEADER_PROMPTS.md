# Command Header Prompts

Command headers power the **Command Center** hero banner (`AAAHeroBanner`).

## Template

```
CINEMATIC, AAA GAME ART, ultra-realistic command center header backdrop for [CITY NAME], [TIME OF DAY], [WEATHER], wide low-angle street in [DISTRICT], wet reflections, dramatic neo-noir lighting, cropped for UI banner (top third sky, bottom third street), no text, no logos, 16:9 --ar 16:9
```

**Save to:** `assets/art/cities/{CityFolder}/command/{city_slug}_command_{variant}.png`

## Composition guide

- **Safe zone:** Keep critical detail in center 70% — UI overlays location text on left, rank on right
- **Contrast:** Dark lower third for text legibility
- **Resolution:** 1920×1080 minimum; 2560×1440 preferred

## Example — New York

```
CINEMATIC, AAA GAME ART, command center header backdrop for New York, night, rain, wide low-angle view down 7th Avenue toward Times Square, wet street reflections, moody neo-noir, banner-safe composition, no text, 16:9
```

## Fallback chain

1. `command/` image for city
2. City `master/` image
3. `assets/art/defaults/command.png`
4. Remote Unsplash placeholder (via `cityArt.ts` gradient overlay)

Run `npm run import:art` after adding files.
