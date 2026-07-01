#!/usr/bin/env npx tsx
/**
 * Scans assets/art/cities/** for runtime PNG/JPG files and regenerates cityImages.ts.
 * Reference / mockup crops are NEVER imported. Defaults folder is not bundled at runtime.
 *
 * Usage: npm run import:art
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(__dirname, '..');
const CITIES_ROOT = path.join(ROOT, 'assets/art/cities');
const REFERENCE_CITIES_ROOT = path.join(ROOT, 'assets/art/reference/cities');
const GENERATED = path.join(ROOT, 'src/assets/generated/cityImages.ts');

const CATEGORIES = ['master', 'districts', 'travel', 'command', 'loading', 'cinematic'] as const;
type Category = (typeof CATEGORIES)[number];

interface CityManifest {
  city: string;
  masterImage: string;
  districtImages: string[];
  travelCard: string;
  commandHeader: string;
  loadingImages: string[];
  cinematicImages: string[];
}

interface RuntimeEntry {
  key: string;
  relPath: string;
  width: number;
  height: number;
}

export function isReferenceFilename(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    lower.includes('reference') ||
    lower.includes('mockup') ||
    lower.includes('art_bible') ||
    lower.includes('ui_reference') ||
    lower.includes('prompt_board')
  );
}

export function isReferencePath(relPath: string): boolean {
  const normalized = relPath.replace(/\\/g, '/').toLowerCase();
  return normalized.includes('/reference/') || isReferenceFilename(path.basename(relPath));
}

function folderToSlug(folder: string): string {
  return folder
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
    .replace(/__+/g, '_');
}

function isImage(name: string): boolean {
  return /\.(png|jpg|jpeg|webp)$/i.test(name);
}

/** Canonical runtime master filename — never rename. */
const CANONICAL_MASTER = 'master.png';

function normalizeFilename(folder: string, category: Category, file: string): string {
  const ext = path.extname(file).toLowerCase() || '.png';
  const base = path.basename(file, ext);
  if (category === 'master' && base === 'master') return CANONICAL_MASTER;

  const slug = folderToSlug(folder);
  const prefix = `${slug}_${category}_`;
  if (base.startsWith(prefix)) return base + ext;
  if (base.startsWith(`${slug}_`)) return base + ext;
  const cleaned = base.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '').toLowerCase();
  return `${prefix}${cleaned}${ext}`;
}

function generatedKey(slug: string, category: Category, filename: string): string {
  const base = path.basename(filename, path.extname(filename));
  if (category === 'master' && base === 'master') return `${slug}__master`;
  const variant = base.replace(`${slug}_${category}_`, '');
  return `${slug}__${category}__${variant}`;
}

function readManifest(cityDir: string): CityManifest {
  const manifestPath = path.join(cityDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Missing manifest: ${manifestPath}`);
  }
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as CityManifest;
}

function writeManifest(cityDir: string, manifest: CityManifest): void {
  fs.writeFileSync(path.join(cityDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
}

function ensureManifest(folder: string): void {
  const manifestPath = path.join(CITIES_ROOT, folder, 'manifest.json');
  if (fs.existsSync(manifestPath)) return;
  const display = folder.replace(/([A-Z])/g, ' $1').trim();
  writeManifest(path.join(CITIES_ROOT, folder), {
    city: display,
    masterImage: '',
    districtImages: [],
    travelCard: '',
    commandHeader: '',
    loadingImages: [],
    cinematicImages: [],
  });
}

function quarantineReferenceMasters(folder: string): void {
  const masterDir = path.join(CITIES_ROOT, folder, 'master');
  if (!fs.existsSync(masterDir)) return;

  for (const entry of fs.readdirSync(masterDir)) {
    if (!isImage(entry) || !isReferenceFilename(entry)) continue;
    const src = path.join(masterDir, entry);
    if (!fs.statSync(src).isFile()) continue;

    const destDir = path.join(REFERENCE_CITIES_ROOT, folder);
    fs.mkdirSync(destDir, { recursive: true });
    const dest = path.join(destDir, entry);
    if (!fs.existsSync(dest)) {
      fs.renameSync(src, dest);
      console.log(`  quarantined reference: ${folder}/master/${entry}`);
    }
  }
}

function runtimeImagesInDir(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => isImage(f) && !isReferenceFilename(f))
    .sort((a, b) => {
      if (a === CANONICAL_MASTER) return -1;
      if (b === CANONICAL_MASTER) return 1;
      return a.localeCompare(b);
    });
}

function processCityFolder(folder: string): CityManifest {
  ensureManifest(folder);
  quarantineReferenceMasters(folder);

  const cityDir = path.join(CITIES_ROOT, folder);
  const manifest = readManifest(cityDir);

  for (const category of CATEGORIES) {
    const catDir = path.join(cityDir, category);
    if (!fs.existsSync(catDir)) continue;

    for (const entry of fs.readdirSync(catDir)) {
      if (!isImage(entry) || isReferenceFilename(entry)) continue;
      const src = path.join(catDir, entry);
      if (!fs.statSync(src).isFile()) continue;

      const normalized = normalizeFilename(folder, category, entry);
      const dest = path.join(catDir, normalized);
      if (entry !== normalized) {
        fs.renameSync(src, dest);
        console.log(`  renamed ${folder}/${category}/${entry} -> ${normalized}`);
      }
    }
  }

  const masterDir = path.join(cityDir, 'master');
  const masterFiles = runtimeImagesInDir(masterDir);
  manifest.masterImage = masterFiles[0] ? `master/${masterFiles[0]}` : '';

  const districtDir = path.join(cityDir, 'districts');
  manifest.districtImages = runtimeImagesInDir(districtDir).map((f) => `districts/${f}`);

  const travelDir = path.join(cityDir, 'travel');
  const travelFiles = runtimeImagesInDir(travelDir);
  manifest.travelCard = travelFiles[0] ? `travel/${travelFiles[0]}` : '';

  const commandDir = path.join(cityDir, 'command');
  const commandFiles = runtimeImagesInDir(commandDir);
  manifest.commandHeader = commandFiles[0] ? `command/${commandFiles[0]}` : '';

  const loadingDir = path.join(cityDir, 'loading');
  manifest.loadingImages = runtimeImagesInDir(loadingDir).map((f) => `loading/${f}`);

  const cinematicDir = path.join(cityDir, 'cinematic');
  manifest.cinematicImages = runtimeImagesInDir(cinematicDir).map((f) => `cinematic/${f}`);

  writeManifest(cityDir, manifest);
  return manifest;
}

async function collectRuntimeRequires(): Promise<RuntimeEntry[]> {
  const entries: RuntimeEntry[] = [];

  if (!fs.existsSync(CITIES_ROOT)) return entries;

  for (const folder of fs.readdirSync(CITIES_ROOT).sort()) {
    const cityDir = path.join(CITIES_ROOT, folder);
    if (!fs.statSync(cityDir).isDirectory()) continue;
    const slug = folderToSlug(folder);

    for (const category of CATEGORIES) {
      const catDir = path.join(cityDir, category);
      if (!fs.existsSync(catDir)) continue;
      for (const file of fs.readdirSync(catDir).filter(isImage)) {
        const rel = `assets/art/cities/${folder}/${category}/${file}`;
        if (isReferenceFilename(file) || isReferencePath(rel)) {
          console.warn(`  skipped reference: ${rel}`);
          continue;
        }
        const abs = path.join(ROOT, rel);
        const meta = await sharp(abs).metadata();
        entries.push({
          key: generatedKey(slug, category, file),
          relPath: rel,
          width: meta.width ?? 16,
          height: meta.height ?? 9,
        });
      }
    }
  }

  return entries;
}

const GENERATED_REQUIRE_PREFIX = '../../../';

function generateCityImagesTs(entries: RuntimeEntry[]): void {
  const lines: string[] = [
    '/** AUTO-GENERATED by scripts/importMidjourneyAssets.ts — do not edit manually. */',
    '/** Runtime city art from assets/art/cities/ only. */',
    '',
    'export type GeneratedImageKey = string;',
    '',
    'export const GENERATED_IMAGES: Record<GeneratedImageKey, number> = {',
  ];

  for (const { key, relPath } of entries) {
    lines.push(`  '${key}': require('${GENERATED_REQUIRE_PREFIX}${relPath}'),`);
  }

  lines.push('};', '', 'export const GENERATED_IMAGE_META: Record<GeneratedImageKey, { width: number; height: number }> = {');

  for (const { key, width, height } of entries) {
    lines.push(`  '${key}': { width: ${width}, height: ${height} },`);
  }

  lines.push('};', '');

  fs.mkdirSync(path.dirname(GENERATED), { recursive: true });
  fs.writeFileSync(GENERATED, lines.join('\n'));
  console.log(`Wrote ${GENERATED} (${entries.length} runtime images)`);
}

async function main(): Promise<void> {
  console.log('Drug Wars Reloaded — city art import\n');

  if (!fs.existsSync(CITIES_ROOT)) {
    console.error('Missing cities root:', CITIES_ROOT);
    process.exit(1);
  }

  for (const folder of fs.readdirSync(CITIES_ROOT).sort()) {
    const cityDir = path.join(CITIES_ROOT, folder);
    if (!fs.statSync(cityDir).isDirectory()) continue;
    console.log(`Processing ${folder}...`);
    processCityFolder(folder);
  }

  const entries = await collectRuntimeRequires();
  generateCityImagesTs(entries);
  console.log('\nDone. Run `npm run typecheck` to verify.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
