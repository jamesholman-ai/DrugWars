# Travel Card Prompts

Travel cards appear on the **Travel** screen city list headers.

## Template

```
CINEMATIC, AAA GAME ART, compact travel postcard of [CITY NAME], [TIME OF DAY], [WEATHER], iconic skyline or street landmark, wet neo-noir reflections, high contrast, premium crime strategy game travel card, no text, no logos, 16:9 --ar 16:9
```

**Save to:** `assets/art/cities/{CityFolder}/travel/{city_slug}_travel_{variant}.png`

Design notes:
- Slightly tighter crop than master hero — reads well at ~120px height
- Strong silhouette / landmark recognition at small size
- Keep center-weighted composition

## Per city quick prompts

| City | Landmark focus |
|------|----------------|
| New York | Times Square glow / Midtown canyon |
| Miami | Downtown pink neon + palms |
| Los Angeles | DTLA sunset palm silhouette |
| Chicago | Loop + L train structure |
| Detroit | Sunset stone towers |
| Las Vegas | Strip neon density |
| Seattle | Space Needle + rain mist |
| Atlanta | Modern downtown blue night |
| Houston | Glass tower canyon |
| Toronto | CN Tower backdrop |
| New Orleans | French Quarter lamps |
| Boston | Harbor + financial towers fog |
| Philadelphia | Broad Street classical |
| Washington DC | Monument axis haze |
| San Francisco | Market Street fog grade |

After export, run `npm run import:art`.
