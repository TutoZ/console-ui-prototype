/**
 * 把自定义域名绑到 COS 静态网站（无需服务器）。
 *
 * 用法：
 *   TENCENT_COS_CUSTOM_DOMAIN=demo.example.com npm run bind:cos-domain
 *
 * 然后在域名 DNS 添加 CNAME（脚本结束会打印）。
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import dotenv from 'dotenv';
import COS from 'cos-nodejs-sdk-v5';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const envLocalPath = path.join(root, '.env.local');

dotenv.config({ path: envLocalPath });
dotenv.config({ path: path.join(root, '.env') });

function fail(msg) {
  console.error(`\n[bind:cos-domain] ${msg}\n`);
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

function upsertEnvLocal(entries) {
  let text = fs.existsSync(envLocalPath) ? fs.readFileSync(envLocalPath, 'utf8') : '';
  for (const [key, value] of Object.entries(entries)) {
    const line = `${key}=${value}`;
    const re = new RegExp(`^${key}=.*$`, 'm');
    if (re.test(text)) text = text.replace(re, line);
    else text = `${text.trimEnd()}\n${line}\n`;
  }
  fs.writeFileSync(envLocalPath, text.endsWith('\n') ? text : `${text}\n`, 'utf8');
}

async function main() {
  const SecretId = env('TENCENT_COS_SECRET_ID');
  const SecretKey = env('TENCENT_COS_SECRET_KEY');
  const Bucket = env('TENCENT_COS_BUCKET');
  const Region = env('TENCENT_COS_REGION', 'ap-guangzhou');
  const domain = env('TENCENT_COS_CUSTOM_DOMAIN').replace(/^https?:\/\//, '').replace(/\/+$/, '');

  if (!SecretId || !SecretKey || !Bucket) {
    fail('缺少 TENCENT_COS_SECRET_ID / SECRET_KEY / BUCKET，请先 npm run setup:cos');
  }
  if (!domain) {
    fail('请设置域名，例如：\n  TENCENT_COS_CUSTOM_DOMAIN=demo.example.com npm run bind:cos-domain');
  }

  const cos = new COS({ SecretId, SecretKey });
  const cnameTarget = `${Bucket}.cos-website.${Region}.myqcloud.com`;

  console.log(`[bind:cos-domain] 绑定 ${domain} → ${Bucket}（静态网站源站）`);

  let existing = [];
  try {
    const data = await cosCall(cos, 'getBucketDomain', { Bucket, Region });
    existing = data?.DomainRule || [];
    if (!Array.isArray(existing)) existing = existing ? [existing] : [];
  } catch {
    existing = [];
  }

  const already = existing.some((d) => (d.Name || d.Domain) === domain);
  if (!already) {
    const DomainRule = [
      ...existing.map((d) => ({
        Status: d.Status || 'ENABLED',
        Type: d.Type || 'WEBSITE',
        Name: d.Name || d.Domain,
        ForcedReplacement: d.ForcedReplacement || 'CNAME',
      })),
      {
        Status: 'ENABLED',
        // WEBSITE = 静态网站源站，浏览器可预览，不再强制下载
        Type: 'WEBSITE',
        Name: domain,
        ForcedReplacement: 'CNAME',
      },
    ];

    try {
      await cosCall(cos, 'putBucketDomain', { Bucket, Region, DomainRule });
      console.log('[bind:cos-domain] 控制台侧域名已添加');
    } catch (e) {
      const msg = String(e?.message || e);
      if (msg.includes('DNSRecordVerifyFailed') || msg.includes('CNAME')) {
        fail(
          [
            '腾讯云要求：先加好 DNS，再完成绑定。',
            '',
            '请到域名 DNS（注册商/Cloudflare 等）添加：',
            `  主机记录：  www`,
            `  记录类型：  CNAME`,
            `  记录值：    ${cnameTarget}`,
            '',
            '保存后等 1～10 分钟，回复「DNS好了」，我再帮你点绑定。',
            `（也可手动：COS 控制台 → ${Bucket} → 域名与传输管理 → 自定义源站域名）`,
          ].join('\n'),
        );
      }
      fail(`绑定失败：${msg}`);
    }
  } else {
    console.log('[bind:cos-domain] 域名已在桶上，跳过添加');
  }

  const publicBase = `https://${domain}`;
  upsertEnvLocal({
    TENCENT_COS_CUSTOM_DOMAIN: domain,
    TENCENT_COS_PUBLIC_BASE: publicBase,
  });

  console.log(
    [
      '',
      '接下来只需在你的域名 DNS 加一条记录（无服务器）：',
      '',
      `  主机记录：  ${domain.split('.').length > 2 ? domain.split('.')[0] : '@ 或 www（按你的域名商界面）'}`,
      '  记录类型：  CNAME',
      `  记录值：    ${cnameTarget}`,
      '',
      `完整：${domain}  →  CNAME  →  ${cnameTarget}`,
      '',
      '生效后用浏览器打开：',
      `  ${publicBase}/`,
      '',
      '若要 HTTPS：COS/CDN 控制台给该域名申请免费证书并开启 HTTPS。',
      '国内域名若需公网备案，按域名注册商/腾讯云指引完成备案即可（静态站仍不需要服务器）。',
      '',
    ].join('\n'),
  );
}

main().catch((e) => fail(e?.message || String(e)));
