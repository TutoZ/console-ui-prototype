/**
 * 构建前优化 public/ 静态资源：字体 WOFF2、大图 WebP/压缩 PNG、头像缩略。
 * 由 npm run build 自动调用。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { compress as ttfToWoff2 } from 'wawoff2';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'public');

function isNewer(src, dest) {
  if (!fs.existsSync(dest)) return true;
  return fs.statSync(src).mtimeMs > fs.statSync(dest).mtimeMs;
}

async function optimizeFonts() {
  const fontDir = path.join(publicDir, 'fonts');
  if (!fs.existsSync(fontDir)) return;

  for (const name of fs.readdirSync(fontDir)) {
    if (!name.endsWith('.ttf')) continue;
    const ttfPath = path.join(fontDir, name);
    const woff2Path = path.join(fontDir, name.replace(/\.ttf$/i, '.woff2'));
    if (!isNewer(ttfPath, woff2Path)) {
      console.log(`[optimize] font skip ${name}`);
      continue;
    }
    const buf = fs.readFileSync(ttfPath);
    const out = await ttfToWoff2(buf);
    fs.writeFileSync(woff2Path, out);
    const ratio = ((1 - out.length / buf.length) * 100).toFixed(0);
    console.log(
      `[optimize] font ${name} → ${path.basename(woff2Path)} (${(buf.length / 1e6).toFixed(1)}MB → ${(out.length / 1e6).toFixed(1)}MB, -${ratio}%)`,
    );
  }
}

async function optimizeLoginPanels() {
  const targets = [
    { file: 'login-left-panel.png', maxWidth: 1400, webpQuality: 82 },
    { file: 'login-left-panel-feature.png', maxWidth: 1400, webpQuality: 82 },
    { file: 'login-hero.png', maxWidth: 1200, webpQuality: 85 },
    { file: 'joy-support-logo.png', maxWidth: 512, webpQuality: 90 },
    { file: 'joy-support-logo-wordmark.png', maxWidth: 640, webpQuality: 90 },
    { file: 'ai-assistant-avatar.png', maxWidth: 400, webpQuality: 85 },
    { file: 'login-brand-logo.png', maxWidth: 320, webpQuality: 90 },
  ];

  const assetsDir = path.join(publicDir, 'assets');
  for (const { file, maxWidth, webpQuality } of targets) {
    const src = path.join(assetsDir, file);
    if (!fs.existsSync(src)) continue;

    const webpPath = src.replace(/\.png$/i, '.webp');
    const meta = await sharp(src).metadata();
    const pipeline = sharp(src).resize({
      width: meta.width && meta.width > maxWidth ? maxWidth : undefined,
      withoutEnlargement: true,
    });

    if (isNewer(src, webpPath)) {
      await pipeline.clone().webp({ quality: webpQuality, effort: 4 }).toFile(webpPath);
      const webpSize = fs.statSync(webpPath).size;
      console.log(`[optimize] image ${file} → webp ${(webpSize / 1e3).toFixed(0)}KB`);
    }

    const before = fs.statSync(src).size;
    const optimized = await pipeline
      .clone()
      .png({ compressionLevel: 9, palette: Boolean(meta.hasAlpha) })
      .toBuffer();
    if (optimized.length < before * 0.92) {
      fs.writeFileSync(src, optimized);
      console.log(`[optimize] image ${file} png → ${(optimized.length / 1e3).toFixed(0)}KB`);
    }
  }
}

async function optimizeAvatars() {
  const dir = path.join(publicDir, 'assets', 'agent-avatars');
  if (!fs.existsSync(dir)) return;

  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.png')) continue;
    const src = path.join(dir, name);
    const webpPath = src.replace(/\.png$/i, '.webp');
    const st = fs.statSync(src);

    if (st.size < 80_000 && fs.existsSync(webpPath)) continue;

    if (isNewer(src, webpPath)) {
      await sharp(src)
        .resize(256, 256, { fit: 'cover' })
        .webp({ quality: 82, effort: 4 })
        .toFile(webpPath);

      const optimizedPng = await sharp(src)
        .resize(256, 256, { fit: 'cover' })
        .png({ compressionLevel: 9 })
        .toBuffer();
      if (optimizedPng.length < st.size) {
        fs.writeFileSync(src, optimizedPng);
      }
      console.log(
        `[optimize] avatar ${name} → webp ${(fs.statSync(webpPath).size / 1e3).toFixed(0)}KB, png ${(fs.statSync(src).size / 1e3).toFixed(0)}KB`,
      );
    }
  }
}

async function main() {
  console.log('[optimize] static assets…');
  await optimizeFonts();
  await optimizeLoginPanels();
  await optimizeAvatars();
  console.log('[optimize] done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
