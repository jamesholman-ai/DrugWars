/**
 * Generate Expo / Play Store icon assets from the master app icon.
 * Run: npx tsx scripts/generateAppIcons.ts [sourcePath]
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const DEFAULT_SOURCE = path.join(
  ROOT,
  'assets',
  'source',
  'app-icon-master.png'
);

const BG = '#08080c';

async function ensureDir(dir: string): Promise<void> {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function writeSquareIcon(
  source: sharp.Sharp,
  size: number,
  outPath: string,
  insetRatio = 0
): Promise<void> {
  const inset = Math.round(size * insetRatio);
  const inner = size - inset * 2;
  const resized = await source
    .clone()
    .resize(inner, inner, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BG,
    },
  })
    .composite([{ input: resized, gravity: 'centre' }])
    .png()
    .toFile(outPath);
}

async function writeSolid(size: number, color: string, outPath: string): Promise<void> {
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: color,
    },
  })
    .png()
    .toFile(outPath);
}

async function writeMonochrome(source: sharp.Sharp, size: number, outPath: string): Promise<void> {
  await source
    .clone()
    .resize(Math.round(size * 0.72), Math.round(size * 0.72), {
      fit: 'cover',
      position: 'centre',
    })
    .flatten({ background: BG })
    .greyscale()
    .normalise()
    .extend({
      top: Math.round(size * 0.14),
      bottom: Math.round(size * 0.14),
      left: Math.round(size * 0.14),
      right: Math.round(size * 0.14),
      background: BG,
    })
    .png()
    .toFile(outPath);
}

async function writeFeatureGraphic(source: sharp.Sharp, outPath: string): Promise<void> {
  const width = 1024;
  const height = 500;
  const iconSize = 360;
  const icon = await source
    .clone()
    .resize(iconSize, iconSize, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer();

  const titleSvg = Buffer.from(`
    <svg width="560" height="220" xmlns="http://www.w3.org/2000/svg">
      <text x="0" y="72" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="54" font-weight="800">DRUG WARS</text>
      <text x="0" y="140" fill="#ff3344" font-family="Arial, Helvetica, sans-serif" font-size="54" font-weight="800">RELOADED</text>
      <text x="0" y="196" fill="#9aa3b2" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="600">Offline empire strategy</text>
    </svg>
  `);

  await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: BG,
    },
  })
    .composite([
      { input: icon, left: 56, top: Math.round((height - iconSize) / 2) },
      { input: titleSvg, left: 430, top: 130 },
    ])
    .png()
    .toFile(outPath);
}

async function main(): Promise<void> {
  const sourcePath = path.resolve(process.argv[2] ?? DEFAULT_SOURCE);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source icon not found: ${sourcePath}`);
  }

  const source = sharp(sourcePath).rotate();
  const assetsDir = path.join(ROOT, 'assets');
  const storeDir = path.join(ROOT, 'store-assets');
  await ensureDir(assetsDir);
  await ensureDir(storeDir);

  await writeSquareIcon(source, 1024, path.join(assetsDir, 'icon.png'));
  await writeSquareIcon(source, 1024, path.join(assetsDir, 'adaptive-icon.png'));
  await writeSquareIcon(source, 1024, path.join(assetsDir, 'android-icon-foreground.png'), 0.08);
  await writeSolid(1024, BG, path.join(assetsDir, 'android-icon-background.png'));
  await writeMonochrome(source, 1024, path.join(assetsDir, 'android-icon-monochrome.png'));
  await writeSquareIcon(source, 512, path.join(assetsDir, 'splash-icon.png'), 0.12);
  await writeSquareIcon(source, 1024, path.join(assetsDir, 'splash.png'), 0.18);
  await writeSquareIcon(source, 48, path.join(assetsDir, 'favicon.png'), 0.1);
  await writeSquareIcon(source, 512, path.join(storeDir, 'icon-512.png'));
  await writeFeatureGraphic(source, path.join(storeDir, 'feature-graphic-1024x500.png'));

  console.log('Generated app icons from', sourcePath);
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
