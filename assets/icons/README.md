# UI / Icon assets

Drop transparent PNG icons here. Naming convention:

```
{category}_{name}.png
```

Examples:
- `finance_cash.png`
- `finance_debt.png`
- `finance_net_worth.png`
- `drug_cocaine.png`
- `nav_market.png`
- `status_heat.png`

The game currently uses vector icons via `@expo/vector-icons` in `src/theme/icons.tsx`.
Replace with local PNGs once Midjourney / design exports are ready.

Import through `src/assets/uiAssetRegistry.ts` (never raw paths in screens).
