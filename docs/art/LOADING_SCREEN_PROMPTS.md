# Loading Screen Prompts

Loading images appear on **Command Center** boot and any future dedicated loading routes.

## Template

```
CINEMATIC, AAA GAME ART, ultra-realistic loading splash for [CITY NAME], [TIME OF DAY], [WEATHER], wide neo-noir cityscape, subtle vignette, wet streets, atmospheric haze, premium crime strategy game loading screen, minimal foreground, no text, no logos, 16:9 --ar 16:9
```

**Save to:** `assets/art/cities/{CityFolder}/loading/{city_slug}_loading_{variant}.png`

Provide **2–4 variants per city** for rotation. The registry picks by day seed.

## Examples

**New York — night rain**
```
CINEMATIC, AAA GAME ART, ultra-realistic loading splash for New York, night, rain, wide Times Square perspective, heavy atmospheric haze, wet reflective streets, moody neo-noir, no text, 16:9
```

**Miami — night post-rain**
```
CINEMATIC, AAA GAME ART, loading splash for Miami, night, post-rain, downtown avenue with palm silhouettes, pink neon reflections, no text, 16:9
```

**Chicago — night cloudy**
```
CINEMATIC, AAA GAME ART, loading splash for Chicago, night, cloudy, The Loop wide shot, elevated train light trails, wet street, no text, 16:9
```

Repeat for all cities in `assets/art/cities/`. Missing loading art falls back to `assets/art/defaults/loading.png` or the city master image.
