// Slices img/character.png and img/material.png into public/assets (see design.md §9.3).
// Usage: node scripts/slice-assets.mjs   (run `npm install` in scripts/ first)
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public', 'assets');
const PREVIEW = path.join(ROOT, 'scripts', 'preview');

// Order of the face / mini rows in material.png (confirmed by the art owner).
const MATERIAL_ORDER = ['seven', 'luna', 'verna', 'serefi', 'crow', 'mint', 'rave', 'azria'];
// Cell order in character.png: row-major, 4 columns x 2 rows.
const CHARACTER_ORDER = ['luna', 'seven', 'verna', 'azria', 'crow', 'serefi', 'mint', 'rave'];

const WHITE_MIN = 236; // min(r,g,b) at or above this counts as background
const FEATHER_MIN = 214; // edge pixels between FEATHER_MIN and WHITE_MIN get partial alpha

/** Crop a region and turn the white background (connected to the border) into alpha. */
async function cutout(img, rect, { maxW, maxH, keepOpaque = false }) {
  const crop = img.clone().extract({ left: rect.x, top: rect.y, width: rect.w, height: rect.h });
  const { data, info } = await crop.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  if (!keepOpaque) {
    const isBg = (i) => Math.min(data[i], data[i + 1], data[i + 2]) >= WHITE_MIN;
    const seen = new Uint8Array(w * h);
    const stack = [];
    const push = (x, y) => {
      const p = y * w + x;
      if (!seen[p] && isBg(p * 4)) {
        seen[p] = 1;
        stack.push(p);
      }
    };
    for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
    for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
    while (stack.length) {
      const p = stack.pop();
      const x = p % w, y = (p - x) / w;
      if (x > 0) push(x - 1, y);
      if (x < w - 1) push(x + 1, y);
      if (y > 0) push(x, y - 1);
      if (y < h - 1) push(x, y + 1);
    }
    const removed = (x, y) => x >= 0 && y >= 0 && x < w && y < h && seen[y * w + x] === 1;
    for (let p = 0; p < w * h; p++) {
      const i = p * 4;
      if (seen[p]) { data[i + 3] = 0; continue; }
      const x = p % w, y = (p - x) / w;
      const nearBg = removed(x - 1, y) || removed(x + 1, y) || removed(x, y - 1) || removed(x, y + 1);
      if (nearBg) {
        const m = Math.min(data[i], data[i + 1], data[i + 2]);
        if (m > FEATHER_MIN) data[i + 3] = Math.round(255 * (1 - (m - FEATHER_MIN) / (WHITE_MIN - FEATHER_MIN)));
      }
    }
  }
  let out = sharp(data, { raw: { width: w, height: h, channels: 4 } });
  if (maxW || maxH) out = out.resize({ width: maxW, height: maxH, fit: 'inside', withoutEnlargement: true });
  return out;
}

const manifest = {};
const previews = []; // { name, file }

async function emit(img, rect, rel, opts) {
  const file = path.join(OUT, rel);
  await mkdir(path.dirname(file), { recursive: true });
  const out = await cutout(img, rect, opts);
  const { width, height } = await out.clone().webp({ quality: 88, alphaQuality: 95 }).toFile(file);
  const key = rel.replace(/\\/g, '/');
  manifest[key] = { src: `/assets/${key}`, width, height };
  previews.push({ name: key, file });
}

/** Split a row region into `count` equal cells. */
function row(region, count) {
  const pitch = region.w / count;
  return Array.from({ length: count }, (_, i) => ({
    x: Math.round(region.x + i * pitch),
    y: region.y,
    w: Math.round(pitch),
    h: region.h,
  }));
}

const characterSheet = sharp(path.join(ROOT, 'img', 'character.png'));
const materialSheet = sharp(path.join(ROOT, 'img', 'material.png'));

// character.png -> full body
for (let i = 0; i < 8; i++) {
  const col = i % 4, r = Math.floor(i / 4);
  await emit(characterSheet, { x: col * 384, y: r * 512, w: 384, h: 512 }, `characters/${CHARACTER_ORDER[i]}/full.webp`, { maxH: 720 });
}

// material.png rows
// Cards touch each other in the sheet, so boundaries are measured by hand (x ranges, absolute px).
const FACE_X = [[17, 194], [198, 398], [399, 586], [592, 764], [772, 951], [958, 1114], [1118, 1294], [1306, 1518]];
const MINI_X = [[12, 190], [190, 392], [392, 592], [592, 772], [772, 958], [958, 1138], [1138, 1310], [1310, 1526]];
for (let i = 0; i < 8; i++) {
  const id = MATERIAL_ORDER[i];
  await emit(materialSheet, { x: FACE_X[i][0], y: 12, w: FACE_X[i][1] - FACE_X[i][0], h: 234 }, `characters/${id}/face.webp`, { maxW: 256 });
  await emit(materialSheet, { x: MINI_X[i][0], y: 255, w: MINI_X[i][1] - MINI_X[i][0], h: 192 }, `characters/${id}/mini.webp`, { maxH: 256 });
}
for (let i = 0; i < 8; i++) {
  await emit(materialSheet, { x: Math.round(10 + i * 99.2), y: 457, w: 84, h: 82 }, `skills/skill-${i + 1}.webp`, { maxW: 96 });
}
const badges = row({ x: 820, y: 458, w: 705, h: 78 }, 9);
for (let i = 0; i < 9; i++) await emit(materialSheet, badges[i], `badges/badge-${i + 1}.webp`, { maxW: 96 });

const singles = [
  ['scenes/city-map.webp', { x: 980, y: 548, w: 210, h: 148 }, { keepOpaque: true }],
  ['ui/map-thumb.webp', { x: 440, y: 730, w: 118, h: 80 }, { keepOpaque: true }],
  ['ui/quest-complete.webp', { x: 815, y: 705, w: 430, h: 95 }, {}],
  ['effects/summon-swirl.webp', { x: 15, y: 840, w: 220, h: 170 }, {}],
  ['effects/summon-pillar.webp', { x: 235, y: 835, w: 135, h: 175 }, {}],
  ['effects/burst-purple.webp', { x: 440, y: 870, w: 280, h: 140 }, {}],
  ['effects/pixel-slash.webp', { x: 715, y: 815, w: 190, h: 195 }, {}],
  ['effects/bat.webp', { x: 950, y: 820, w: 230, h: 125 }, {}],
  ['scenes/night-city.webp', { x: 1190, y: 825, w: 335, h: 190 }, {}],
];
for (const [rel, rect, opts] of singles) await emit(materialSheet, rect, rel, opts);
// Quest cards: img/quest.png is a 3x2 sheet of finished cards (title, priority, dates and reward are baked in).
// Order is row-major and matches the quest ids below. Cards keep their frame; there is no transparency to cut out.
const QUEST_IDS = ['haunted-mall-webar', 'cyber-ghost-vr', 'specter-promo-video', 'phantom-museum-ar', 'moonlit-concert', 'grave-shift-launch'];
const QUEST_COLS = [22, 522, 1022];
const QUEST_ROWS = [24, 514];
const QUEST_CARD = { w: 492, h: 480 };
const questSheet = sharp(path.join(ROOT, 'img', 'quest.png'));
for (let i = 0; i < QUEST_IDS.length; i++) {
  const rect = { x: QUEST_COLS[i % 3], y: QUEST_ROWS[Math.floor(i / 3)], ...QUEST_CARD };
  await emit(questSheet, rect, `quests/${QUEST_IDS[i]}.webp`, { keepOpaque: true });
}// Title picture: used whole. The logo "NecroCrew Phantom Squad" is part of the picture.
{
  const rel = 'scenes/title.webp';
  const file = path.join(OUT, rel);
  await mkdir(path.dirname(file), { recursive: true });
  const { width, height } = await sharp(path.join(ROOT, 'img', 'title.jpg')).webp({ quality: 85 }).toFile(file);
  manifest[rel] = { src: `/assets/${rel}`, width, height };
  previews.push({ name: rel, file });
}// Studio background: the whole company-house picture, kept as is (3x3 rooms, labels baked in).
{
  const rel = 'scenes/company-house.webp';
  const file = path.join(OUT, rel);
  await mkdir(path.dirname(file), { recursive: true });
  const { width, height } = await sharp(path.join(ROOT, 'img', 'companyhouse.jpg')).webp({ quality: 82 }).toFile(file);
  manifest[rel] = { src: `/assets/${rel}`, width, height };
  previews.push({ name: rel, file });
}
await writeFile(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));

// Contact sheet on the app's void colour, to check crops and white halos by eye.
await mkdir(PREVIEW, { recursive: true });
const CELL = 200, COLS = 8;
const tiles = [];
for (let i = 0; i < previews.length; i++) {
  const buf = await sharp(previews[i].file).resize(CELL - 8, CELL - 8, { fit: 'inside' }).png().toBuffer();
  tiles.push({ input: buf, left: (i % COLS) * CELL + 4, top: Math.floor(i / COLS) * CELL + 4 });
}
await sharp({ create: { width: COLS * CELL, height: Math.ceil(previews.length / COLS) * CELL, channels: 4, background: '#0a0a0f' } })
  .composite(tiles)
  .png()
  .toFile(path.join(PREVIEW, 'contact-sheet.png'));
await writeFile(path.join(PREVIEW, 'order.txt'), previews.map((p, i) => `${i}: ${p.name}`).join('\n'));
console.log(`Wrote ${previews.length} assets to ${OUT}`);


