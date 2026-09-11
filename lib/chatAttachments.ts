/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 对话附件块解析 — 将「【已上传附件】」从正文拆出，供气泡内 FileCard 展示。
 */

export type ChatAttachmentRef = {
  name: string;
  sizeLabel?: string;
};

export const CHAT_ATTACHMENT_MARKER = '【已上传附件】';

/** 从消息正文拆出附件列表；正文侧不再残留附件纯文本 */
export function splitChatContentWithAttachments(raw: string): {
  text: string;
  attachments: ChatAttachmentRef[];
} {
  const source = (raw || '').replace(/\r\n/g, '\n');
  const idx = source.indexOf(CHAT_ATTACHMENT_MARKER);
  if (idx < 0) {
    return { text: source.trim(), attachments: [] };
  }

  const text = source.slice(0, idx).trim();
  const rest = source.slice(idx + CHAT_ATTACHMENT_MARKER.length).trim();
  // 忽略文本摘录代码块，只取文件行
  const withoutFences = rest.replace(/```[\s\S]*?```/g, '');
  const attachments: ChatAttachmentRef[] = [];

  for (const line of withoutFences.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === CHAT_ATTACHMENT_MARKER) continue;
    const withSize = trimmed.match(/^[-•]\s*(.+?)（([^）]+)）\s*$/);
    if (withSize) {
      attachments.push({
        name: withSize[1].trim(),
        sizeLabel: withSize[2].trim(),
      });
      continue;
    }
    const nameOnly = trimmed.match(/^[-•]\s*(.+?)\s*$/);
    if (nameOnly?.[1]) {
      attachments.push({ name: nameOnly[1].trim() });
    }
  }

  return { text, attachments };
}

export function fileExtLabel(name: string): string {
  const ext = name.split('.').pop()?.trim().toUpperCase();
  if (!ext || ext === name.toUpperCase()) return 'FILE';
  return ext.slice(0, 5);
}
