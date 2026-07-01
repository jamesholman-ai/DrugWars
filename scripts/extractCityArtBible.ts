#!/usr/bin/env npx tsx
/**
 * Extracts clean city master artwork from the official City Art Bible grid.
 * Crops artwork only — no labels, prompt text, or surrounding UI chrome.
 *
 * Usage: npm run extract:art-bible
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_SOURCE = path.join(ROOT, 'assets/art/reference/CITY_ART_BIBLE.jpg');

/** 3×4 grid order (row-major) matching the official City Art Bible. */
const CITY_GRID: readonly (readonly string[])[] = [
  ['NewYork', 'Miami', 'LosAngeles', 'Chicago'],
  ['Detroit', 'Atlanta', 'LasVegas', 'Seattle'],
  ['NewOrleans', 'Houston', 'Phoenix', 'Toronto'],
] as const;

/** Measured from assets/art/reference/CITY_ART_BIBLE.jpg (1024×682). */
const GRID = {
  left: 278,
  top: 88,
  cellWidth: 182,
  cellHeight: 192,
  artHeight: 102,
  padX: 3,
  padY: 3,
} as const;

/** Target 16:9 masters — upscaled at build time so runtime never blows up tiny crops. */
const OUTPUT_WIDTH = 1280;
const OUTPUT_HEIGHT = 720;

function cropRect(col: number, row: number) {
  const left = GRID.left + col * GRID.cellWidth + GRID.padX;
  const top = GRID.top + row * GRID.cellHeight + GRID.padY;
  const width = GRID.cellWidth - GRID.padX * 2;
  const height = GRID.artHeight - GRID.padY;
  return { left, top, width, height };
}

async function main(): Promise<void> {
  const sourceArg = process.argv[2];
  const source = sourceArg ? path.resolve(sourceArg) : DEFAULT_SOURCE;

  if (!fs.existsSync(source)) {
    console.error('City Art Bible not found:', source);
    console.error('Place the official bible at assets/art/reference/CITY_ART_BIBLE.jpg');
    process.exit(1);
  }

  const meta = await sharp(source).metadata();
  console.log(`City Art Bible: ${source} (${meta.width}×${meta.height})\n`);

  for (let row = 0; row < CITY_GRID.length; row++) {
    for (let col = 0; col < CITY_GRID[row].length; col++) {
      const folder = CITY_GRID[row][col];
      const rect = cropRect(col, row);
      const outDir = path.join(ROOT, 'assets/art/cities', folder, 'master');
      fs.mkdirSync(outDir, { recursive: true });
      const outPath = path.join(outDir, 'master.png');

      await sharp(source)
        .extract(rect)
        .resize(OUTPUT_WIDTH, OUTPUT_HEIGHT, {
          kernel: sharp.kernel.lanczos3,
          fit: 'fill',
        })
        .sharpen({ sigma: 0.6, m1: 0.5, m2: 0.25 })
        .png({ compressionLevel: 6 })
        .toFile(outPath);

      const outMeta = await sharp(outPath).metadata();
      console.log(`  ✓ ${folder}/master/master.png (${outMeta.width}×${outMeta.height})`);
    }
  }

  console.log('\nDone. Run `npm run import:art` to regenerate cityImages.ts');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
