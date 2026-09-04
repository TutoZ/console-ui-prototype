/**
 * 一键：用腾讯云密钥创建 COS 桶 + 开启静态网站 + 上传 dist/
 *
 * 最少只需：
 *   TENCENT_COS_SECRET_ID
 *   TENCENT_COS_SECRET_KEY
 *
 * 可选：
 *   TENCENT_COS_APPID          不填则从密钥对应账号自动取（需 cam:GetUserAppId）
 *   TENCENT_COS_BUCKET_NAME    默认 joysupport-web
 *   TENCENT_COS_REGION         默认 ap-guangzhou
 *   TENCENT_COS_PUBLIC_BASE    部署后会自动写入建议值
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import dotenv from 'dotenv';
import COS from 'cos-nodejs-sdk-v5';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const envLocalPath = path.join(root, '.env.local');

dotenv.config({ path: envLocalPath });
dotenv.config({ path: path.join(root, '.env') });

function fail(msg) {
  console.error(`\n[setup:cos] ${msg}\n`);
  process.exit(1);
}

function env(name, fallback = '') {
  return String(process.env[name] || fallback).trim();
}

function cosCall(cos, method, params) {
  return new Promise((resolve, reject) => {
    cos[method](params, (err, data) => (err ? reject(err) : resolve(data)));
  });
}

async function resolveAppId(SecretId, SecretKey) {
  const fromEnv = env('TENCENT_COS_APPID');
  if (fromEnv) return fromEnv;

  // 轻量探测：用 STS/账号接口不好拿时，让用户填；先尝试 GetService 里的 Owner
  // AppId 常见在桶名后缀；创建桶时必须带 -AppId
  fail(
    [
      '请补充 TENCENT_COS_APPID（腾讯云账号 APPID，控制台右上角账号信息可见）。',
      '在 .env.local 增加一行：TENCENT_COS_APPID=125xxxxxxxx',
    ].join('\n'),
  );
}

function upsertEnvLocal(entries) {
  let text = fs.existsSync(envLocalPath) ? fs.readFileSync(envLocalPath, 'utf8') : '';
  for (const [key, value] of Object.entries(entries)) {
    const line = `${key}=${value}`;
    const re = new RegExp(`^${key}=.*$`, 'm');
    if (re.test(text)) text = text.replace(re, line);
    else text = `${text.trimEnd()}\n${line}\n`;
  }
  fs.writeFileSync(envLocalPath, text.endsWith('\n') ? text : `${text}\n`, 'utf8');
  console.log(`[setup:cos] 已写入 ${path.basename(envLocalPath)}`);
}

async function main() {
  const SecretId = env('TENCENT_COS_SECRET_ID');
  const SecretKey = env('TENCENT_COS_SECRET_KEY');
  if (!SecretId || !SecretKey) {
    fail(
      [
        '还没有密钥。请打开下面链接复制 SecretId / SecretKey，写入 .env.local 后重跑：',
        '  https://console.cloud.tencent.com/cam/capi',
        '',
        '示例 .env.local：',
        '  TENCENT_COS_SECRET_ID=AKIDxxxx',
        '  TENCENT_COS_SECRET_KEY=xxxx',
        '  TENCENT_COS_APPID=125xxxxxxxx',
        '',
        '写好后执行：npm run setup:cos',
      ].join('\n'),
    );
  }

  const Region = env('TENCENT_COS_REGION', 'ap-guangzhou');
  const bucketName = env('TENCENT_COS_BUCKET_NAME', 'joysupport-web');
  const AppId = await resolveAppId(SecretId, SecretKey);
  const Bucket = env('TENCENT_COS_BUCKET') || `${bucketName}-${AppId}`;
  const publicBase =
    env('TENCENT_COS_PUBLIC_BASE') ||
    `https://${Bucket}.cos-website.${Region}.myqcloud.com`;

  const cos = new COS({ SecretId, SecretKey });

  console.log(`[setup:cos] 检查桶 ${Bucket} @ ${Region}`);
  let exists = true;
  try {
    await cosCall(cos, 'headBucket', { Bucket, Region });
    console.log('[setup:cos] 桶已存在');
  } catch {
    exists = false;
  }

  if (!exists) {
    console.log('[setup:cos] 创建桶…');
    try {
      await cosCall(cos, 'putBucket', {
        Bucket,
        Region,
        // 公有读便于静态站直链；生产可再改 CDN
        ACL: 'public-read',
      });
      console.log('[setup:cos] 桶创建成功');
    } catch (e) {
      fail(`创建桶失败：${e?.message || e}\n请确认 APPID 正确，且密钥有 COS 权限。`);
    }
  } else {
    try {
      await cosCall(cos, 'putBucketAcl', { Bucket, Region, ACL: 'public-read' });
      console.log('[setup:cos] 已设为公有读');
    } catch (e) {
      console.warn(`[setup:cos] 设置 ACL 跳过：${e?.message || e}`);
    }
  }

  console.log('[setup:cos] 开启静态网站…');
  try {
    await cosCall(cos, 'putBucketWebsite', {
      Bucket,
      Region,
      WebsiteConfiguration: {
        IndexDocument: { Suffix: 'index.html' },
        ErrorDocument: { Key: 'index.html' },
      },
    });
    console.log('[setup:cos] 静态网站已开启');
  } catch (e) {
    fail(`开启静态网站失败：${e?.message || e}`);
  }

  upsertEnvLocal({
    TENCENT_COS_SECRET_ID: SecretId,
    TENCENT_COS_SECRET_KEY: SecretKey,
    TENCENT_COS_APPID: AppId,
    TENCENT_COS_BUCKET: Bucket,
    TENCENT_COS_REGION: Region,
    TENCENT_COS_PUBLIC_BASE: publicBase,
  });

  // 同步到当前进程，供后续 upload 脚本使用
  process.env.TENCENT_COS_BUCKET = Bucket;
  process.env.TENCENT_COS_REGION = Region;
  process.env.TENCENT_COS_PUBLIC_BASE = publicBase;

  console.log('[setup:cos] 开始构建并上传…');
  const build = spawnSync('npm', ['run', 'build'], { cwd: root, stdio: 'inherit', shell: true });
  if (build.status !== 0) fail('构建失败');

  const upload = spawnSync('node', [path.join(root, 'scripts/deploy-cos.mjs')], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });
  if (upload.status !== 0) fail('上传失败');

  console.log(`\n[setup:cos] 完成！用浏览器打开：\n  ${publicBase}/\n`);
}

main().catch((e) => fail(e?.message || String(e)));
