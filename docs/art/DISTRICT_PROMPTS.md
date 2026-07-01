# District Prompts — Drug Wars Reloaded

District images power **Properties**, **Cinematic Intro** (district fallback), and **Command** district context.

## Template

```
CINEMATIC, AAA GAME ART, ultra-realistic photorealistic [DISTRICT NAME] in [CITY NAME], [TIME OF DAY], [WEATHER], street-level neo-noir perspective, wet pavement reflections, dramatic lighting, atmospheric haze, premium crime strategy game style, no text, no logos, 16:9 --ar 16:9
```

**Save to:** `assets/art/cities/{CityFolder}/districts/{city_slug}_districts_{district_slug}_{time}_{weather}.png`

---

## New York
| District slug | Prompt focus |
|---------------|--------------|
| `downtown` | Times Square canyon, neon billboards, rain |
| `harlem` | Brownstones, elevated tracks, amber streetlights, night rain |
| `brooklyn` | Bridge view, warehouse row, wet industrial street, night |
| `queens` | Mixed residential/commercial, airport glow distant, night fog |
| `airport` | JFK approach road, terminal lights, wet tarmac reflections |

## Miami
| `downtown` | Biscayne glass towers, pink neon, post-rain |
| `beach_district` | Ocean Drive art deco, palm silhouettes, night |
| `port` | Container cranes, floodlights, misty harbor night |

## Los Angeles
| `downtown` | Bunker Hill towers, golden hour haze |
| `hollywood` | Vine Street, marquee glow, night rain |
| `south_central` | Low-rise urban grid, sodium vapor, night |
| `airport` | LAX theme building area, landing lights |

## Chicago
| `downtown` | The Loop, elevated L train, night |
| `south_side` | Industrial corridor, cold blue night |
| `airport` | O'Hare approach, runway light streaks |

## Detroit
| `downtown` | GM Renaissance Center area, sunset storm |
| `east_side` | Abandoned factory edge, moody fog night |

## Las Vegas
| `strip` | Dense casino frontage, saturated neon |
| `north` | Suburban sprawl meets strip glow, night |

## Seattle
| `downtown` | Pike/Pine grid, Space Needle peek, rain |
| `port` | Ferry terminal, grey harbor mist |

## Atlanta
| `downtown` | Peachtree corridor, modern towers, night |
| `airport` | Hartsfield approach, glass terminal glow |

## Houston
| `downtown` | Texas-sized glass canyon, night cloudy |

## Toronto
| `downtown` | Bay Street, CN Tower backdrop, night clear |

## New Orleans
| `french_quarter` | Balcony ironwork, warm lamps, wet stones |
| `warehouse` | Industrial riverfront, fog night |

## Boston
| `downtown` | Financial district, brick alleys, fog night |
| `harbor` | Waterfront warehouses, cold blue mist |

## Philadelphia
| `center_city` | Broad Street, classical facades, rain night |
| `north_philly` | Row homes, corner store neon, night |

## Washington DC
| `downtown` | Federal corridor, clean wide avenue, night |
| `anacostia` | Residential grid, distant monument glow |

## San Francisco
| `financial` | Market Street grade, fog banks, night |
| `mission` | Mission murals muted, wet street, evening |
| `port` | Embarcadero pier lights, bay fog |

---

After adding images, run:

```bash
npm run import:art
```
