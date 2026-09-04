/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 专家模式：Figma 24200:25135 — 文件树 + 代码/预览编辑器
 */

import React, { useMemo, useState } from 'react';
import {
  ChevronRight,
  Download,
  Eye,
  FileText,
  Folder,
  Pencil,
  X,
} from '@/lib/icons';
import { cn } from '@/lib/utils';

export type ManusExpertFile = {
  id: 'skill.md' | 'schema.json' | 'handler.ts' | 'metadata.yaml';
  name: string;
  path: string;
  content: string;
  original?: string;
  editable?: boolean;
};

export type ManusExpertFrameProps = {
  packageName: string;
  files: ManusExpertFile[];
  onSkillMarkdownChange?: (content: string) => void;
  onToast?: (message: string) => void;
};

type EditorView = 'code' | 'preview';

const MONO =
  'ui-monospace, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

function MarkdownPreview({ content }: { content: string }) {
  const blocks = content.split('\n\n');
  return (
    <article className="max-w-none text-[#181D27]">
      {blocks.map((block, index) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={index} className="text-[15.5px] font-semibold leading-[21.7px] mb-2 mt-4 first:mt-0">
              {trimmed.slice(4)}
            </h3>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={index} className="text-[16.5px] font-semibold leading-[22.27px] tracking-[-0.01em] mb-2 mt-5 first:mt-0">
              {trimmed.slice(3)}
            </h2>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={index} className="text-[18px] font-semibold leading-[26px] tracking-[-0.018em] mb-3 pb-2.5 border-b border-[#E9EAEB]">
              {trimmed.slice(2)}
            </h1>
          );
        }

        if (trimmed.includes('\n|') || trimmed.startsWith('|')) {
          const rows = trimmed.split('\n').filter((line) => line.includes('|'));
          if (rows.length >= 2) {
            const cells = rows.map((row) =>
              row
                .split('|')
                .map((cell) => cell.trim())
                .filter(Boolean),
            );
            const header = cells[0];
            const body = cells.slice(2);
            return (
              <div
                key={index}
                className="my-4 overflow-hidden rounded-[14px] border border-[#E9EAEB]"
              >
                <table className="w-full text-left text-base">
                  <thead>
                    <tr className="bg-[#F6F6F6] border-b border-[#E9EAEB]">
                      {header.map((cell) => (
                        <th
                          key={cell}
                          className="px-4 py-3 text-[15.44px] font-semibold leading-[22.39px]"
                        >
                          {cell}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {body.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b border-[#E9EAEB] last:border-b-0">
                        {row.map((cell) => (
                          <td key={cell} className="px-4 py-3 text-base leading-6 align-top">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
        }

        if (trimmed.startsWith('- ')) {
          return (
            <ul key={index} className="my-2 space-y-1.5 pl-6 list-disc text-base leading-6">
              {trimmed.split('\n').map((line) => (
                <li key={line}>{line.replace(/^- /, '')}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={index} className="text-base leading-6 mb-2 last:mb-0">
            {trimmed}
          </p>
        );
      })}
    </article>
  );
}

export const ManusExpertFrame: React.FC<ManusExpertFrameProps> = ({
  packageName,
  files,
  onSkillMarkdownChange,
  onToast,
}) => {
  const fileMap = useMemo(() => {
    const map = {} as Record<ManusExpertFile['id'], ManusExpertFile>;
    files.forEach((f) => {
      map[f.id] = f;
    });
    return map;
  }, [files]);

  const [activeId, setActiveId] = useState<ManusExpertFile['id']>('skill.md');
  const [foldersOpen, setFoldersOpen] = useState({ scripts: true, references: true });
  const [editorView, setEditorView] = useState<EditorView>('code');

  const active = fileMap[activeId] ?? files[0];
  const canEdit = Boolean(active?.editable);
  const displayText = active?.content ?? '';
  const lineCount = Math.max(displayText.split('\n').length, 1);
  const isDirtyMd =
    Boolean(fileMap['skill.md']) &&
    fileMap['skill.md'].content !== (fileMap['skill.md'].original ?? fileMap['skill.md'].content);

  const showCode = editorView === 'code';
  const showPreview = editorView === 'preview';

  const treeFile = (id: ManusExpertFile['id']) => {
    const f = fileMap[id];
    if (!f) return null;
    const activeFile = activeId === id;
    return (
      <button
        key={id}
        type="button"
        onClick={() => {
          setActiveId(id);
          setEditorView('code');
        }}
        className={cn(
          'w-full flex items-center gap-1 h-8 pl-8 pr-2 rounded-md text-left cursor-pointer text-[13px] text-[#181D27]',
          activeFile ? 'bg-[#F6F6F6]' : 'hover:bg-[#F6F6F6]/70',
        )}
      >
        <FileText size={16} className="shrink-0 text-[#717680]" />
        <span className="truncate">{f.name}</span>
        {id === 'skill.md' && isDirtyMd ? (
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
        ) : null}
      </button>
    );
  };

  const folderRow = (key: 'scripts' | 'references', label: string) => (
    <button
      type="button"
      onClick={() => setFoldersOpen((v) => ({ ...v, [key]: !v[key] }))}
      className="w-full flex items-center gap-1 h-8 pl-5 pr-2 rounded-md text-[13px] text-[#181D27] hover:bg-[#F6F6F6]/70 cursor-pointer"
    >
      <ChevronRight
        size={14}
        className={cn(
          'text-[#717680] shrink-0 transition-transform',
          foldersOpen[key] && 'rotate-90',
        )}
      />
      <Folder size={16} className="text-[#717680] shrink-0" />
      <span>{label}</span>
    </button>
  );

  const handleDownloadZip = () => {
    const payload = files.map((f) => `=== ${f.path} ===\n${f.content}`).join('\n\n');
    const blob = new Blob([payload], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${packageName || 'skill'}-bundle.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    onToast?.('已导出技能包文件');
  };

  return (
    <div className="flex-1 min-h-0 flex overflow-hidden bg-white select-text">
      <aside className="w-[200px] shrink-0 border-r border-[#E9EAEB] overflow-y-auto px-1.5 py-2">
        <button
          type="button"
          onClick={() => {
            setActiveId('skill.md');
            setEditorView('code');
          }}
          className="w-full h-8 px-2 rounded-md text-left text-[13px] text-[#181D27] hover:bg-[#F6F6F6]/70 cursor-pointer truncate"
        >
          {packageName}
        </button>
        <div className="mt-0.5 space-y-0.5">
          {folderRow('references', 'references')}
          {foldersOpen.references ? treeFile('schema.json') : null}
          {folderRow('scripts', 'scripts')}
          {foldersOpen.scripts ? treeFile('handler.ts') : null}
          {treeFile('skill.md')}
          {treeFile('metadata.yaml')}
        </div>
      </aside>

      <section className="flex-1 min-w-0 flex flex-col bg-white">
        <div className="h-12 px-2 flex items-center justify-between gap-2 border-b border-[#E9EAEB] shrink-0">
          <div className="min-w-0 flex-1 flex items-center gap-2 overflow-hidden">
            <div className="h-8 max-w-full inline-flex items-center gap-1 px-2 rounded-md bg-[#F6F6F6] text-sm min-w-0">
              <span className="text-[#717680] truncate">{packageName}</span>
              <span className="text-[#717680] shrink-0">/</span>
              <span className="text-[#181D27] truncate">{active?.name ?? 'SKILL.md'}</span>
              <button
                type="button"
                onClick={() => onToast?.('已关闭标签页')}
                className="w-5 h-5 ml-0.5 rounded-md inline-flex items-center justify-center text-[#717680] hover:text-[#181D27] hover:bg-white cursor-pointer shrink-0"
                title="关闭"
                aria-label="关闭"
              >
                <X size={14} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {activeId === 'skill.md' ? (
              <>
                {showPreview && canEdit ? (
                  <button
                    type="button"
                    onClick={() => setEditorView('code')}
                    className="h-8 px-3 rounded-lg border border-[#BEDBFF] bg-[#DBEAFE] text-[#1447E6] text-sm inline-flex items-center gap-1.5 cursor-pointer hover:bg-[#DBEAFE]/80 transition"
                  >
                    <Pencil size={14} />
                    编辑
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditorView('preview')}
                    className="h-8 px-2 rounded-lg border border-[#E9EAEB] bg-white text-[#181D27] text-sm inline-flex items-center gap-1.5 cursor-pointer hover:bg-neutral-50 transition"
                  >
                    <Eye size={14} />
                    预览
                  </button>
                )}
              </>
            ) : null}
            <button
              type="button"
              onClick={handleDownloadZip}
              className="h-8 px-2 rounded-lg border border-[#E9EAEB] bg-white text-[#181D27] text-sm font-medium inline-flex items-center gap-1.5 cursor-pointer hover:bg-neutral-50 transition"
            >
              <Download size={14} />
              下载zip
            </button>
          </div>
        </div>

        {showCode ? (
          <div className="flex-1 min-h-0 overflow-auto bg-[#FFFFFE] relative">
            <div className="sticky top-0 h-1.5 pointer-events-none bg-gradient-to-b from-[#DDDDDD]/35 to-transparent z-10" />
            <div className="flex min-h-full">
              <div
                aria-hidden
                className="w-7 shrink-0 border-r border-[#E9EAEB] bg-[#FFFFFE] text-right pr-1 py-3 text-[10px] leading-[20px] text-[#237893] select-none tabular-nums"
                style={{ fontFamily: MONO }}
              >
                {Array.from({ length: lineCount }, (_, idx) => (
                  <div key={idx}>{idx + 1}</div>
                ))}
              </div>
              <textarea
                value={displayText}
                readOnly={!canEdit}
                onChange={
                  canEdit
                    ? (e) => {
                        onSkillMarkdownChange?.(e.target.value);
                      }
                    : undefined
                }
                spellCheck={false}
                className={cn(
                  'w-full min-w-0 flex-1 py-3 pl-3 pr-5 bg-[#FFFFFE] outline-none resize-none overflow-hidden whitespace-pre text-[#181D27] selection:bg-[rgba(21,101,191,0.12)]',
                  !canEdit && 'cursor-default text-[#717680]',
                )}
                style={{
                  height: `${Math.max(lineCount, 28) * 20}px`,
                  fontFamily: MONO,
                  fontSize: 13,
                  lineHeight: '20px',
                }}
              />
            </div>
          </div>
        ) : null}

        {showPreview ? (
          <div className="flex-1 min-h-0 overflow-auto bg-white p-6">
            <MarkdownPreview content={displayText} />
          </div>
        ) : null}
      </section>
    </div>
  );
};
