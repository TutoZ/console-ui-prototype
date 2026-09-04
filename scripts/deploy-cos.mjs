/**
 * 将 Vite 构建产物 dist/ 上传到腾讯云 COS（静态网站）。
 *
 * 用法：
 *   1. 复制 .env.example 中 COS 段到 .env.local 并填值
 *   2. npm run deploy:cos
 *
 * 控制台准备（一次性）：
 *   - 创建 COS 桶（建议公有读，或仅静态网站读）
 *   - 基础配置 → 静态网站：开启；索引 / 错误文档均填 index.html
 *   - （推荐）绑定 CDN / 自定义域名，国内访问更稳
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import COS from 'cos-nodejs-sdk-v5';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');

dotenv.config({ path: path.join(root, '.env.local') });
dotenv.config({ path: path.join(root, '.env') });

const SECRET_ID = String(process.env.TENCENT_COS_SECRET_ID || '').trim();
const SECRET_KEY = String(process.env.TENCENT_COS_SECRET_KEY || '').trim();
const BUCKET = String(process.env.TENCENT_COS_BUCKET || '').trim();
const REGION = String(process.env.TENCENT_COS_REGION || '').trim();
const PREFIX = String(process.env.TENCENT_COS_SITE_PREFIX || '')
  .trim()
  .replace(/^\/+|\/+$/g, '');
const PUBLIC_BASE = String(process.env.TENCENT_COS_PUBLIC_BASE || '').trim().replace(/\/+$/, '');

function fail(msg) {
  console.error(`\n[deploy:cos] ${msg}\n`);
  process.exit(1);
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.map': 'application/json',
    '.txt': 'text/plain; charset=utf-8',
    '.csv': 'text/csv; charset=utf-8',
  };
  return map[ext] || 'application/octet-stream';
}

function cacheControl(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html') return 'no-cache';
  if (['.js', '.css', '.woff', '.woff2', '.ttf', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico'].includes(ext)) {
    return 'public, max-age=31536000, immutable';
  }
  return 'public, max-age=3600';
}

function walk(dir) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function toKey(absFile) {
  const rel = path.relative(distDir, absFile).split(path.sep).join('/');
  return PREFIX ? `${PREFIX}/${rel}` : rel;
}

function putObject(cos, Body, Key, filePath) {
  return new Promise((resolve, reject) => {
    cos.putObject(
      {
        Bucket: BUCKET,
        Region: REGION,
        Key,
        Body,
        ContentType: contentType(filePath),
        CacheControl: cacheControl(filePath),
      },
      (err, data) => (err ? reject(err) : resolve(data)),
    );
  });
}

async function main() {
  if (!SECRET_ID || !SECRET_KEY || !BUCKET || !REGION) {
    fail(
      [
        '缺少环境变量，请在 .env.local 配置：',
        '  TENCENT_COS_SECRET_ID',
        '  TENCENT_COS_SECRET_KEY',
        '  TENCENT_COS_BUCKET     例如 joysupport-web-1250000000',
        '  TENCENT_COS_REGION     例如 ap-guangzhou',
        '可选：',
        '  TENCENT_COS_SITE_PREFIX   上传子目录前缀',
        '  TENCENT_COS_PUBLIC_BASE   对外访问根地址（CDN/静态网站域名）',
      ].join('\n'),
    );
  }

  if (!fs.existsSync(distDir)) {
    fail('未找到 dist/，请先执行 npm run build');
  }

  const files = walk(distDir).filter((f) => !f.endsWith('.ttf'));
  if (files.length === 0) fail('dist/ 为空');

  const cos = new COS({ SecretId: SECRET_ID, SecretKey: SECRET_KEY });
  console.log(`[deploy:cos] 上传 ${files.length} 个文件 → ${BUCKET} (${REGION})${PREFIX ? ` /${PREFIX}` : ''}`);

  let ok = 0;
  for (const file of files) {
    const Key = toKey(file);
    const Body = fs.createReadStream(file);
    process.stdout.write(`  ↑ ${Key} ... `);
    try {
      await putObject(cos, Body, Key, file);
      ok += 1;
      console.log('ok');
    } catch (e) {
      console.log('FAIL');
      fail(e?.message || String(e));
    }
  }

  const siteUrl =
    PUBLIC_BASE ||
    `https://${BUCKET}.cos-website.${REGION}.myqcloud.com${PREFIX ? `/${PREFIX}` : ''}`;

  console.log(`\n[deploy:cos] 完成 ${ok}/${files.length}`);
  console.log(`[deploy:cos] 访问地址：${siteUrl}/`);
  console.log(
    [
      '',
      '若打不开，请到腾讯云 COS 控制台确认：',
      '  1) 桶「静态网站」已开启，索引/错误文档均为 index.html',
      '  2) 访问权限允许公网读（或已绑 CDN）',
      '  3) 推荐把静态网站域名接到 CDN，国内更稳',
      '',
    ].join('\n'),
  );
}

main().catch((e) => fail(e?.message || String(e)));
