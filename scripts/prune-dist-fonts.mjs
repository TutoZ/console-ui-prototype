/**
 * 构建后移除 dist 中的 TTF（线上仅提供 WOFF2，约省 22MB）。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const distFonts = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'fonts');
if (!fs.existsSync(distFonts)) process.exit(0);

let removed = 0;
for (const name of fs.readdirSync(distFonts)) {
  if (!name.endsWith('.ttf')) continue;
  fs.unlinkSync(path.join(distFonts, name));
  removed += 1;
}
if (removed) console.log(`[prune] removed ${removed} TTF from dist/fonts`);
