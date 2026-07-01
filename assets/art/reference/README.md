# Reference art — NOT for runtime UI

These files are Art Bible crops, mockup boards, and UI extraction references.
They must **never** be used by `imageRegistry` or live screens.

## Folders

- `reference_*.png` — city hero Art Bible panels
- `ui/` — UI mockup extraction boards
- `cities/` — quarantined `*_master_reference.png` files moved from `assets/art/cities/*/master/`

## Runtime art

Drop approved Midjourney output into:

```
assets/art/cities/<CityName>/{master,districts,travel,command,loading,cinematic}/
```

Then run: `npm run import:art`
