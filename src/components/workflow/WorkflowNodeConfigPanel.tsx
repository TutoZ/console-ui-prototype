import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronDown,
  Database,
  Lightbulb,
  Minus,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Settings,
  X,
} from '@/lib/icons';
import { cn } from '@/lib/utils';
import {
  createDefaultBranchConfig,
  createDefaultEndConfig,
  createDefaultKbConfig,
  createKbInput,
  getDefaultDesc,
  getKbItemSettings,
  isEndMessageEmpty,
  mapPlatformKnowledgeBases,
  normalizeEndConfig,
  normalizeKbConfig,
} from './workflowConstants';
import type { CanvasNode, WorkflowEndConfig, WorkflowKbConfig } from './workflowTypes';
import { WorkflowBranchConfigForm } from './WorkflowBranchConfigForm';
import {
  triggerEndMessageSlash,
  WorkflowEndMessageComposer,
} from './WorkflowEndMessageComposer';
import { WorkflowVarPicker } from './WorkflowVarPicker';
import { InfoTooltip, WorkflowNodeIcon } from './workflowUi';
import { useApp } from '@/src/context/AppContext';

type WorkflowNodeConfigPanelProps = {
  node: CanvasNode;
  onClose: () => void;
  onUpdateNode: (id: string, data: Partial<CanvasNode>) => void;
  onCopy: (e: React.MouseEvent, node: CanvasNode) => void;
  onDelete: (e: React.MouseEvent, nodeId: string) => void;
};

export function WorkflowNodeConfigPanel({
  node,
  onClose,
  onUpdateNode,
  onCopy,
  onDelete,
}: WorkflowNodeConfigPanelProps) {
  const { knowledgeBases } = useApp();
  const kbOptions = mapPlatformKnowledgeBases(knowledgeBases);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descText, setDescText] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameText, setNameText] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [kbPickerOpen, setKbPickerOpen] = useState(false);
  const [kbSettingsOpen, setKbSettingsOpen] = useState(false);
  const [kbSearch, setKbSearch] = useState('');
  const [inputVarOpenId, setInputVarOpenId] = useState<string | null>(null);
  const [inputVarAnchor, setInputVarAnchor] = useState<DOMRect | null>(null);
  const [kbItemSettingsId, setKbItemSettingsId] = useState<string | null>(null);
  const endComposerWrapRef = useRef<HTMLDivElement | null>(null);
  const [streamTipRect, setStreamTipRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const legacyKbDesc = '单节点对接知识库，按 Query 召回最匹配片段';
    const legacyEndDesc = '该组件用来返回工作流最后产生的数据内容和原先设置的文本内容。';
    let nextDesc =
      node.type === '知识检索' && (!node.desc || node.desc === legacyKbDesc)
        ? getDefaultDesc(node.type)
        : node.desc || getDefaultDesc(node.type);
    if (node.type === '结束' && (!node.desc || node.desc === legacyEndDesc)) {
      nextDesc = getDefaultDesc('结束');
    }
    setDescText(nextDesc);
    setIsEditingDesc(false);
    setNameText(node.name || node.type);
    setIsEditingName(false);
    setIsMenuOpen(false);
    setKbPickerOpen(false);
    setKbSettingsOpen(false);
    setKbSearch('');
    setInputVarOpenId(null);
    setInputVarAnchor(null);
    setKbItemSettingsId(null);
    setStreamTipRect(null);
    if (node.type === '知识检索' && node.desc === legacyKbDesc) {
      onUpdateNode(node.id, { desc: getDefaultDesc('知识检索') });
    }
    if (node.type === '结束' && node.desc === legacyEndDesc) {
      onUpdateNode(node.id, { desc: getDefaultDesc('结束') });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.id, node.type, node.desc, node.name]);

  useEffect(() => {
    if (node.type === '条件分支' && !node.branchConfig) {
      onUpdateNode(node.id, { branchConfig: createDefaultBranchConfig() });
    }
    if (node.type === '知识检索' && !node.kbConfig) {
      onUpdateNode(node.id, { kbConfig: createDefaultKbConfig() });
    }
    if (node.type === '结束' && !node.endConfig) {
      onUpdateNode(node.id, { endConfig: createDefaultEndConfig() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.id, node.type, node.branchConfig, node.kbConfig, node.endConfig]);

  useEffect(() => {
    if (!(inputVarOpenId || kbPickerOpen || kbSettingsOpen || kbItemSettingsId)) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!(t instanceof Element)) return;
      if (t.closest('[data-kb-popover]') || t.closest('[data-kb-trigger]')) return;
      setInputVarOpenId(null);
      setInputVarAnchor(null);
      setKbPickerOpen(false);
      setKbSettingsOpen(false);
      setKbItemSettingsId(null);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [inputVarOpenId, kbPickerOpen, kbSettingsOpen, kbItemSettingsId]);

  const kbConfig: WorkflowKbConfig = normalizeKbConfig(node.kbConfig);
  const endConfig: WorkflowEndConfig = normalizeEndConfig(node.endConfig);

  const patchKbConfig = (patch: Partial<WorkflowKbConfig>) => {
    onUpdateNode(node.id, { kbConfig: { ...kbConfig, ...patch } });
  };

  const patchEndConfig = (patch: Partial<WorkflowEndConfig>) => {
    onUpdateNode(node.id, { endConfig: { ...endConfig, ...patch } });
  };

  const handleDescBlur = () => {
    setIsEditingDesc(false);
    if (descText !== node.desc) {
      onUpdateNode(node.id, { desc: descText });
    }
  };

  const handleDescKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleDescBlur();
    }
  };

  const handleNameBlur = () => {
    setIsEditingName(false);
    if (nameText !== (node.name || node.type)) {
      onUpdateNode(node.id, { name: nameText });
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNameBlur();
    }
  };

  const isSpecialNode = node.type === '开始' || node.type === '结束';

  const renderContent = () => {
    if (node.type === '开始') {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <span className="font-bold text-gray-800 text-sm flex items-center">
              输入 <InfoTooltip text="定义工作流的全局输入变量" />
            </span>
            <button type="button" className="text-blue-500 hover:bg-blue-50 p-1 rounded">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-[3fr_3fr_1.5fr] gap-2 text-[13px] text-gray-500 mb-2 px-2">
            <div>变量名</div>
            <div>变量类型</div>
            <div>必填</div>
          </div>

          <div className="border border-gray-200 rounded-lg p-3 mb-2 shadow-sm bg-white">
            <div className="grid grid-cols-[3fr_3fr_1.5fr] gap-2 items-center mb-4">
              <div className="text-sm text-gray-800 font-medium">user_input</div>
              <div>
                <select className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1 text-[13px] outline-none text-gray-600">
                  <option>str.String</option>
                </select>
              </div>
              <div className="flex items-center gap-1.5 pl-1">
                <input type="checkbox" className="rounded text-blue-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer" />
              </div>
            </div>
            <div className="mb-3 flex flex-col gap-1">
              <div className="text-[13px] text-gray-500">默认值</div>
              <input
                type="text"
                placeholder="参数默认值，在没有传入该参数时，将使用默认值"
                className="w-full border border-gray-200 rounded p-1.5 text-[13px] outline-none focus:border-blue-400 text-gray-700"
              />
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-[13px] text-gray-500">描述</div>
              <input
                type="text"
                defaultValue="用户输入"
                className="w-full border border-gray-200 rounded p-1.5 text-[13px] outline-none focus:border-blue-400 text-gray-700 font-mono"
              />
            </div>
          </div>

          {['session_id', 'user_pin', 'bot_id'].map((item) => (
            <div
              key={item}
              className="grid grid-cols-[3fr_3fr_1.5fr] gap-2 items-center px-3 py-2 border-b border-gray-50 hover:bg-gray-50 transition-colors"
            >
              <div className="text-sm text-gray-800">{item}</div>
              <div>
                <select className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1 text-[13px] outline-none text-gray-600">
                  <option>{item === 'bot_id' ? 'Long' : 'str.String'}</option>
                </select>
              </div>
              <div className="flex items-center gap-1.5 pl-1">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded text-blue-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (node.type === 'LLM') {
      return (
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-1 mb-2 font-semibold text-[13px] text-gray-800">
              <ChevronDown className="w-4 h-4" /> 模型
            </div>
            <div className="flex items-center gap-2 pl-5">
              <select className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-[13px] text-gray-700 bg-white outline-none focus:border-blue-500">
                <option>JoyAl-1.3T(JoyAl)</option>
              </select>
              <button type="button" className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1 font-semibold text-[13px] text-gray-800 cursor-pointer hover:text-blue-600">
              <ChevronDown className="w-4 h-4 transform -rotate-90" /> 模型参数{' '}
              <InfoTooltip text="调节生成文本的随机性、长度等超参数" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1 font-semibold text-[13px] text-gray-800">
                <ChevronDown className="w-4 h-4" /> 输入{' '}
                <InfoTooltip text="传递给大模型的变量参数" />
              </div>
              <button type="button" className="text-gray-400 hover:text-blue-500">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="pl-5 flex gap-2 items-start">
              <div className="w-[35%]">
                <div className="text-[13px] text-gray-500 mb-1">参数名</div>
                <input
                  type="text"
                  value="input"
                  readOnly
                  className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-[13px] bg-gray-50 text-gray-600 outline-none"
                />
              </div>
              <div className="flex-1">
                <div className="text-[13px] text-gray-500 mb-1">参数值</div>
                <div className="flex items-center border border-red-300 rounded-md bg-white overflow-hidden focus-within:border-red-500 transition-colors">
                  <input
                    type="text"
                    placeholder="输入或引用参数值"
                    className="w-full px-2 py-1.5 text-[13px] outline-none bg-transparent"
                  />
                  <div className="px-2 text-gray-400 border-l border-gray-100 cursor-pointer hover:bg-gray-50">
                    <Settings className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-rose-500 text-[12px] mt-1">参数值不可为空</div>
              </div>
              <div className="pt-6 text-gray-400 hover:text-red-500 cursor-pointer">
                <Minus className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1 font-semibold text-[13px] text-gray-800">
                <ChevronDown className="w-4 h-4" /> 提示词{' '}
                <InfoTooltip text="引导模型生成方向的系统指令" />
              </div>
              <button type="button" className="text-yellow-500 hover:text-yellow-600">
                <Lightbulb className="w-4 h-4" />
              </button>
            </div>
            <div className="pl-5">
              <textarea
                rows={3}
                className="w-full border border-red-300 rounded-lg p-3 text-[13px] outline-none resize-none focus:border-red-500 transition-colors"
                placeholder="可以使用{{变量名}}的方式引入输入参数中的变量"
              />
              <div className="text-rose-500 text-[12px] mt-1">提示词不可为空</div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1 mb-2 font-semibold text-[13px] text-gray-800">
              <ChevronDown className="w-4 h-4" /> 用户输入{' '}
              <InfoTooltip text="当前轮次的会话消息" />
            </div>
            <div className="pl-5">
              <textarea
                rows={2}
                className="w-full border border-gray-200 bg-gray-50/50 rounded-lg p-3 text-[13px] outline-none resize-none focus:border-blue-400 transition-colors"
                placeholder="请输入用户消息内容 (可选)"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1 font-semibold text-[13px] text-gray-800 cursor-pointer hover:text-blue-600">
                <ChevronDown className="w-4 h-4 transform -rotate-90" /> 输出{' '}
                <InfoTooltip text="模型处理后的返回结果" />
              </div>
              <div className="flex items-center gap-2 text-[13px]">
                <span className="text-gray-500">输出格式</span>
                <select className="border border-gray-200 rounded px-1.5 py-0.5 outline-none text-gray-700 bg-white hover:border-blue-400 cursor-pointer">
                  <option>文本</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1 mb-2 font-semibold text-[13px] text-gray-800">
              <ChevronDown className="w-4 h-4" /> 异常处理{' '}
              <InfoTooltip text="定义请求超时或失败时的动作" />
            </div>
            <div className="pl-5 grid grid-cols-3 gap-2">
              <div>
                <div className="text-[12px] text-neutral-500 mb-1 whitespace-nowrap">超时时间(s)</div>
                <input
                  type="text"
                  value="300"
                  readOnly
                  className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-[13px] outline-none bg-white"
                />
              </div>
              <div>
                <div className="text-[12px] text-neutral-500 mb-1">重试次数</div>
                <select className="w-full border border-gray-200 rounded-md px-1.5 py-1.5 text-[13px] outline-none bg-white hover:border-blue-400 cursor-pointer">
                  <option>不重试</option>
                </select>
              </div>
              <div>
                <div className="text-[12px] text-neutral-500 mb-1">异常处理方式</div>
                <select className="w-full border border-gray-200 rounded-md px-1.5 py-1.5 text-[13px] outline-none bg-white hover:border-blue-400 cursor-pointer">
                  <option>中断流程</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (node.type === '结束') {
      const empty = isEndMessageEmpty(endConfig.parts);
      return (
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1 font-semibold text-[13px] text-neutral-800">
                消息{' '}
                <InfoTooltip text="文本与变量同一框混排；可拖到任意文字中间，或在光标处输入 / 插入" />
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  data-kb-trigger
                  title="插入变量（也可输入 /）"
                  onClick={() => triggerEndMessageSlash(endComposerWrapRef.current)}
                  className="h-6 w-6 inline-flex items-center justify-center rounded-md text-[11px] font-semibold cursor-pointer transition-colors text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700"
                >
                  {'{x}'}
                </button>
                <button
                  type="button"
                  aria-label="流式输出"
                  onMouseEnter={(e) =>
                    setStreamTipRect((e.currentTarget as HTMLElement).getBoundingClientRect())
                  }
                  onMouseLeave={() => setStreamTipRect(null)}
                  onFocus={(e) =>
                    setStreamTipRect((e.currentTarget as HTMLElement).getBoundingClientRect())
                  }
                  onBlur={() => setStreamTipRect(null)}
                  onClick={() => patchEndConfig({ streaming: !endConfig.streaming })}
                  className={cn(
                    'relative w-8 h-[18px] rounded-full transition-colors cursor-pointer shrink-0',
                    endConfig.streaming ? 'bg-teal-500' : 'bg-neutral-200 hover:bg-neutral-300',
                  )}
                  aria-pressed={endConfig.streaming}
                >
                  <span
                    className={cn(
                      'absolute top-[2px] left-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform',
                      endConfig.streaming && 'translate-x-[14px]',
                    )}
                  />
                </button>
                {streamTipRect
                  ? createPortal(
                      <div
                        role="tooltip"
                        className="pointer-events-none fixed z-[300] w-max max-w-[200px] rounded-md bg-neutral-800 px-2 py-1.5 text-[11px] leading-4 text-white shadow-lg"
                        style={{
                          top: streamTipRect.bottom + 6,
                          right: Math.max(8, window.innerWidth - streamTipRect.right),
                        }}
                      >
                        <span className="font-medium">流式输出</span>
                        <span className="block text-white/80 mt-0.5">
                          {endConfig.streaming
                            ? '已开启：以打字机效果逐步输出内容'
                            : '已关闭：结果生成后一次性返回'}
                        </span>
                      </div>,
                      document.body,
                    )
                  : null}
              </div>
            </div>
            <div
              ref={endComposerWrapRef}
              className={cn(
                'relative rounded-lg border bg-white min-h-[128px] transition-colors',
                empty ? 'border-rose-300' : 'border-neutral-200 focus-within:border-neutral-400',
              )}
            >
              <div className="px-2.5 py-2.5">
                <WorkflowEndMessageComposer
                  parts={endConfig.parts}
                  onChange={(parts) => patchEndConfig({ parts })}
                />
              </div>
            </div>
            {empty ? (
              <div className="text-rose-500 text-[12px] mt-1">消息不可为空</div>
            ) : null}
          </div>
        </div>
      );
    }

    if (node.type === '知识检索') {
      const selectedIds = kbConfig.selectedKbIds;
      const kbEmpty = selectedIds.length === 0;
      const selectedOpts = selectedIds
        .map((id) => kbOptions.find((k) => k.id === id))
        .filter(Boolean) as typeof kbOptions;
      const filteredKb = kbOptions.filter(
        (k) =>
          !kbSearch.trim() ||
          k.name.toLowerCase().includes(kbSearch.trim().toLowerCase()) ||
          k.description.includes(kbSearch.trim()),
      );
      const inputs = kbConfig.inputs.length
        ? kbConfig.inputs
        : [createKbInput({ name: 'Query', mode: '引用', value: '' })];

      const patchInput = (id: string, patch: Partial<(typeof inputs)[0]>) => {
        patchKbConfig({
          inputs: inputs.map((row) => (row.id === id ? { ...row, ...patch } : row)),
        });
      };

      const addInput = () => {
        patchKbConfig({ inputs: [...inputs, createKbInput()] });
      };

      const removeInput = (id: string) => {
        if (inputs.length <= 1) return;
        patchKbConfig({ inputs: inputs.filter((r) => r.id !== id) });
        if (inputVarOpenId === id) {
          setInputVarOpenId(null);
          setInputVarAnchor(null);
        }
      };

      const toggleKb = (id: string) => {
        const next = selectedIds.includes(id)
          ? selectedIds.filter((x) => x !== id)
          : [...selectedIds, id];
        patchKbConfig({ selectedKbIds: next });
      };

      const removeKb = (id: string) => {
        const nextSettings = { ...kbConfig.kbItemSettings };
        delete nextSettings[id];
        patchKbConfig({
          selectedKbIds: selectedIds.filter((x) => x !== id),
          kbItemSettings: nextSettings,
        });
        if (kbItemSettingsId === id) setKbItemSettingsId(null);
      };

      const patchKbItemSettings = (
        id: string,
        patch: Partial<ReturnType<typeof getKbItemSettings>>,
      ) => {
        const current = getKbItemSettings(kbConfig, id);
        patchKbConfig({
          kbItemSettings: {
            ...kbConfig.kbItemSettings,
            [id]: { ...current, ...patch },
          },
        });
      };

      return (
        <div className="space-y-5">
          {/* 输入：变量名 + 变量类型（引用） */}
          <div>
            <div className="flex items-center gap-1 mb-2 font-semibold text-[13px] text-neutral-800">
              输入 <InfoTooltip text="配置检索所需输入变量；类型为「引用」时可选择上游 / 会话变量。" />
              <div className="flex-1" />
              <button
                type="button"
                title="添加输入"
                onClick={addInput}
                className="h-7 w-7 rounded-md flex items-center justify-center text-live hover:bg-sky-50 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2 text-[12px] text-neutral-400 mb-1.5 px-0.5">
              <span className="w-[72px] shrink-0">变量名</span>
              <span className="flex-1">变量类型</span>
            </div>
            <div className="space-y-2">
              {inputs.map((row) => {
                const valueEmpty = !row.value.trim();
                const pickerOpen = inputVarOpenId === row.id;
                return (
                  <div key={row.id} className="flex items-start gap-1.5">
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) => patchInput(row.id, { name: e.target.value })}
                      placeholder="变量名"
                      className="w-[72px] shrink-0 h-8 px-2 rounded-md border border-neutral-200 bg-white text-[12px] outline-none focus:border-live"
                    />
                    <div className="flex-1 min-w-0 relative flex gap-1">
                      <select
                        value={row.mode}
                        onChange={(e) =>
                          patchInput(row.id, {
                            mode: e.target.value as '引用' | '输入',
                            value: '',
                          })
                        }
                        className="w-[64px] shrink-0 h-8 rounded-md border border-neutral-200 bg-neutral-50 px-1 text-[12px] outline-none cursor-pointer"
                      >
                        <option value="引用">引用</option>
                        <option value="输入">输入</option>
                      </select>
                      <div className="flex-1 min-w-0 relative">
                        {row.mode === '输入' ? (
                          <input
                            type="text"
                            value={row.value}
                            onChange={(e) => patchInput(row.id, { value: e.target.value })}
                            placeholder="请输入"
                            className={cn(
                              'w-full h-8 px-2 rounded-md border bg-white text-[12px] outline-none',
                              valueEmpty
                                ? 'border-rose-300'
                                : 'border-neutral-200 focus:border-live',
                            )}
                          />
                        ) : (
                          <button
                            type="button"
                            data-kb-trigger
                            onClick={(e) => {
                              setKbPickerOpen(false);
                              setKbSettingsOpen(false);
                              if (pickerOpen) {
                                setInputVarOpenId(null);
                                setInputVarAnchor(null);
                              } else {
                                setInputVarOpenId(row.id);
                                setInputVarAnchor(e.currentTarget.getBoundingClientRect());
                              }
                            }}
                            className={cn(
                              'w-full h-8 px-2 rounded-md border bg-white text-left text-[12px] flex items-center justify-between gap-1 cursor-pointer',
                              pickerOpen
                                ? 'border-live ring-1 ring-sky-100'
                                : valueEmpty
                                  ? 'border-rose-300'
                                  : 'border-neutral-200 hover:border-neutral-300',
                            )}
                          >
                            <span
                              className={cn(
                                'truncate',
                                row.value ? 'text-neutral-800' : 'text-neutral-400',
                              )}
                            >
                              {row.value || '请选择变量'}
                            </span>
                            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          </button>
                        )}
                        {pickerOpen ? (
                          <WorkflowVarPicker
                            mode="variable"
                            anchorRect={inputVarAnchor}
                            onPick={(key) => {
                              patchInput(row.id, { value: key });
                              setInputVarOpenId(null);
                              setInputVarAnchor(null);
                            }}
                          />
                        ) : null}
                        {valueEmpty ? (
                          <div className="text-rose-500 text-[11px] mt-0.5">参数值不可为空</div>
                        ) : null}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={inputs.length <= 1}
                      title="删除"
                      onClick={() => removeInput(row.id)}
                      className={cn(
                        'h-8 w-8 shrink-0 rounded-md flex items-center justify-center',
                        inputs.length <= 1
                          ? 'text-neutral-200 cursor-not-allowed'
                          : 'text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50 cursor-pointer',
                      )}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 知识库列表 */}
          <div className="relative">
            <div className="flex items-center gap-1 mb-2 font-semibold text-[13px] text-neutral-800">
              知识库 <InfoTooltip text="选择一个或多个知识库参与召回。" />
              <div className="flex-1" />
              <button
                type="button"
                data-kb-trigger
                title="知识库设置"
                onClick={() => {
                  setKbSettingsOpen((v) => !v);
                  setKbPickerOpen(false);
                  setKbItemSettingsId(null);
                  setInputVarOpenId(null);
                  setInputVarAnchor(null);
                }}
                className={cn(
                  'h-7 w-7 rounded-md flex items-center justify-center cursor-pointer border',
                  kbSettingsOpen
                    ? 'text-live border-live bg-sky-50'
                    : 'text-neutral-400 border-transparent hover:text-neutral-700 hover:bg-neutral-50',
                )}
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                type="button"
                data-kb-trigger
                title="添加知识库"
                onClick={() => {
                  setKbPickerOpen((v) => !v);
                  setKbSettingsOpen(false);
                  setKbItemSettingsId(null);
                  setKbSearch('');
                  setInputVarOpenId(null);
                  setInputVarAnchor(null);
                }}
                className={cn(
                  'h-7 w-7 rounded-md flex items-center justify-center cursor-pointer',
                  kbPickerOpen
                    ? 'text-live bg-sky-50'
                    : 'text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50',
                )}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {kbSettingsOpen ? (
              <div
                data-kb-popover
                className="absolute right-0 top-8 z-50 w-[240px] rounded-[13px] border border-neutral-200 bg-white p-3 shadow-[0_12px_40px_rgba(0,0,0,0.12)]"
              >
                <div className="text-[13px] font-semibold text-neutral-800 mb-3">知识库设置</div>
                <div className="space-y-3.5">
                  <div>
                    <div className="flex items-center justify-between text-[12px] text-neutral-600 mb-1.5">
                      <span className="inline-flex items-center gap-1">
                        最大召回数量
                        <InfoTooltip text="从知识库返回的最大段落数。" />
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={kbConfig.maxRecall}
                        onChange={(e) => {
                          const n = Math.min(10, Math.max(1, Number(e.target.value) || 1));
                          patchKbConfig({ maxRecall: n });
                        }}
                        className="w-12 h-7 rounded-md border border-neutral-200 px-1.5 text-[12px] text-neutral-800 tabular-nums outline-none focus:border-live"
                      />
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      step={1}
                      value={kbConfig.maxRecall}
                      onChange={(e) => patchKbConfig({ maxRecall: Number(e.target.value) })}
                      className="w-full accent-neutral-700"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-[12px] text-neutral-600 mb-1.5">
                      <span className="inline-flex items-center gap-1">
                        最小匹配度
                        <InfoTooltip text="低于该匹配度的段落不会被召回。" />
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={1}
                        step={0.01}
                        value={kbConfig.minMatch}
                        onChange={(e) => {
                          const n = Math.min(1, Math.max(0, Number(e.target.value) || 0));
                          patchKbConfig({ minMatch: Number(n.toFixed(2)) });
                        }}
                        className="w-14 h-7 rounded-md border border-neutral-200 px-1.5 text-[12px] text-neutral-800 tabular-nums outline-none focus:border-live"
                      />
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={kbConfig.minMatch}
                      onChange={(e) => patchKbConfig({ minMatch: Number(e.target.value) })}
                      className="w-full accent-neutral-700"
                    />
                  </div>
                </div>
              </div>
            ) : null}

            <div className="relative space-y-1.5">
              {selectedOpts.map((opt) => {
                const itemOpen = kbItemSettingsId === opt.id;
                const itemSettings = getKbItemSettings(kbConfig, opt.id);
                return (
                  <div
                    key={opt.id}
                    className="relative flex items-center gap-1.5 min-h-[40px] px-2.5 py-2 rounded-lg bg-neutral-50 border border-neutral-100"
                  >
                    <div className="w-7 h-7 rounded-md bg-sky-50 text-live flex items-center justify-center shrink-0 font-bold text-[12px]">
                      Z
                    </div>
                    <span className="flex-1 min-w-0 truncate text-[13px] text-neutral-800 font-medium">
                      {opt.name}
                    </span>
                    <button
                      type="button"
                      data-kb-trigger
                      title="知识库设置"
                      onClick={() => {
                        setKbSettingsOpen(false);
                        setKbPickerOpen(false);
                        setInputVarOpenId(null);
                        setInputVarAnchor(null);
                        setKbItemSettingsId(itemOpen ? null : opt.id);
                      }}
                      className={cn(
                        'h-7 w-7 rounded-md flex items-center justify-center cursor-pointer shrink-0 border',
                        itemOpen
                          ? 'text-live border-live bg-sky-50'
                          : 'text-neutral-400 border-transparent hover:text-live hover:bg-sky-50',
                      )}
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title="移除"
                      onClick={() => removeKb(opt.id)}
                      className="h-7 w-7 rounded-md flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-white cursor-pointer shrink-0"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    {itemOpen ? (
                      <div
                        data-kb-popover
                        className="absolute right-0 top-full mt-1 z-50 w-[260px] rounded-[13px] border border-neutral-200 bg-white p-3 shadow-[0_12px_40px_rgba(0,0,0,0.12)]"
                      >
                        <div className="text-[13px] font-semibold text-neutral-800 mb-3">
                          知识库设置
                        </div>
                        <div className="space-y-3.5">
                          <div>
                            <div className="flex items-center justify-between text-[12px] text-neutral-600 mb-1.5">
                              <span className="inline-flex items-center gap-1">
                                最大召回数量
                                <InfoTooltip text="从该知识库返回的最大段落数，范围 1–20。" />
                              </span>
                              <input
                                type="number"
                                min={1}
                                max={20}
                                value={itemSettings.maxRecall}
                                onChange={(e) => {
                                  const n = Math.min(
                                    20,
                                    Math.max(1, Number(e.target.value) || 1),
                                  );
                                  patchKbItemSettings(opt.id, { maxRecall: n });
                                }}
                                className="w-12 h-7 rounded-md border border-neutral-200 px-1.5 text-[12px] text-neutral-800 tabular-nums outline-none focus:border-live"
                              />
                            </div>
                            <input
                              type="range"
                              min={1}
                              max={20}
                              step={1}
                              value={itemSettings.maxRecall}
                              onChange={(e) =>
                                patchKbItemSettings(opt.id, {
                                  maxRecall: Number(e.target.value),
                                })
                              }
                              className="w-full accent-live"
                            />
                            <div className="flex justify-between text-[10px] text-neutral-400 mt-0.5 tabular-nums">
                              <span>1</span>
                              <span>20</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1 text-[12px] text-neutral-700">
                              结果重排
                              <InfoTooltip text="开启后按相关性对召回结果二次排序。" />
                            </span>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={itemSettings.resultRerank}
                              onClick={() =>
                                patchKbItemSettings(opt.id, {
                                  resultRerank: !itemSettings.resultRerank,
                                })
                              }
                              className={cn(
                                'relative w-9 h-[18px] rounded-full transition cursor-pointer shrink-0',
                                itemSettings.resultRerank ? 'bg-live' : 'bg-neutral-200',
                              )}
                            >
                              <span
                                className={cn(
                                  'absolute top-0.5 left-0.5 h-3.5 w-3.5 rounded-full bg-white shadow transition',
                                  itemSettings.resultRerank && 'translate-x-4',
                                )}
                              />
                            </button>
                          </div>

                          <div>
                            <div className="flex items-center justify-between text-[12px] text-neutral-600 mb-1.5">
                              <span className="inline-flex items-center gap-1">
                                重排得分阈值
                                <InfoTooltip text="低于该阈值的重排结果将被过滤。" />
                              </span>
                              <input
                                type="number"
                                min={0}
                                max={1}
                                step={0.01}
                                value={itemSettings.rerankThreshold}
                                onChange={(e) => {
                                  const n = Math.min(
                                    1,
                                    Math.max(0, Number(e.target.value) || 0),
                                  );
                                  patchKbItemSettings(opt.id, {
                                    rerankThreshold: Number(n.toFixed(2)),
                                  });
                                }}
                                className="w-14 h-7 rounded-md border border-neutral-200 px-1.5 text-[12px] text-neutral-800 tabular-nums outline-none focus:border-live"
                              />
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={1}
                              step={0.01}
                              value={itemSettings.rerankThreshold}
                              onChange={(e) =>
                                patchKbItemSettings(opt.id, {
                                  rerankThreshold: Number(e.target.value),
                                })
                              }
                              className="w-full accent-live"
                            />
                            <div className="flex justify-between text-[10px] text-neutral-400 mt-0.5 tabular-nums">
                              <span>0</span>
                              <span>1</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1 text-[12px] text-neutral-700">
                              兜底召回
                              <InfoTooltip text="主召回不足时启用兜底策略补充结果。" />
                            </span>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={itemSettings.fallbackRecall}
                              onClick={() =>
                                patchKbItemSettings(opt.id, {
                                  fallbackRecall: !itemSettings.fallbackRecall,
                                })
                              }
                              className={cn(
                                'relative w-9 h-[18px] rounded-full transition cursor-pointer shrink-0',
                                itemSettings.fallbackRecall ? 'bg-live' : 'bg-neutral-200',
                              )}
                            >
                              <span
                                className={cn(
                                  'absolute top-0.5 left-0.5 h-3.5 w-3.5 rounded-full bg-white shadow transition',
                                  itemSettings.fallbackRecall && 'translate-x-4',
                                )}
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}

              <button
                type="button"
                data-kb-trigger
                onClick={() => {
                  setKbPickerOpen(true);
                  setKbSettingsOpen(false);
                  setKbItemSettingsId(null);
                  setKbSearch('');
                  setInputVarOpenId(null);
                  setInputVarAnchor(null);
                }}
                className="w-full h-9 rounded-lg text-[13px] font-medium text-live hover:bg-sky-50 cursor-pointer flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> 添加
              </button>

              {kbEmpty ? (
                <div className="text-rose-500 text-[12px]">知识库不可为空</div>
              ) : null}

              {kbPickerOpen ? (
                <div
                  data-kb-popover
                  className="absolute left-0 right-0 top-full mt-1 bg-white border border-neutral-200 rounded-[13px] shadow-[0_12px_40px_rgba(0,0,0,0.12)] z-50 overflow-hidden"
                >
                  <div className="p-2 border-b border-neutral-100">
                    <div className="relative">
                      <Search
                        size={14}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400"
                      />
                      <input
                        autoFocus
                        value={kbSearch}
                        onChange={(e) => setKbSearch(e.target.value)}
                        placeholder="搜索知识库..."
                        className="w-full h-8 pl-8 pr-2.5 rounded-[7px] border border-neutral-200 text-[13px] outline-none focus:border-neutral-400"
                      />
                    </div>
                  </div>
                  <div className="max-h-72 overflow-y-auto custom-scrollbar-thin py-1">
                    {filteredKb.map((item) => {
                      const checked = selectedIds.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            toggleKb(item.id);
                            setKbPickerOpen(false);
                          }}
                          className={cn(
                            'w-full px-3 py-2.5 flex items-start gap-2.5 text-left cursor-pointer',
                            checked ? 'bg-sky-50' : 'hover:bg-neutral-50',
                          )}
                        >
                          <Database
                            size={16}
                            className={cn(
                              'mt-0.5 shrink-0',
                              checked ? 'text-live' : 'text-neutral-700',
                            )}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-[13px] font-semibold text-neutral-800 truncate">
                              {item.name}
                            </div>
                            <div className="text-[12px] text-neutral-400 mt-0.5 line-clamp-2">
                              {item.description}
                            </div>
                          </div>
                          {checked ? (
                            <span className="text-live text-sm font-bold shrink-0">✓</span>
                          ) : null}
                        </button>
                      );
                    })}
                    {filteredKb.length === 0 ? (
                      <div className="py-6 text-center text-[13px] text-neutral-400 px-3">
                        {kbOptions.length === 0
                          ? '暂无知识库，请先在「员工知识」中创建'
                          : '无匹配知识库'}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* 输出 docRecallList */}
          <div>
            <div className="flex items-center gap-1 mb-2 font-semibold text-[13px] text-neutral-800">
              输出 <InfoTooltip text="固定输出 docRecallList：文档 ID、文档名与召回文本。" />
            </div>
            <div className="flex gap-3 text-[12px] text-neutral-400 mb-1.5 px-0.5">
              <span className="w-[110px] shrink-0">变量名</span>
              <span className="flex-1">变量类型</span>
            </div>
            <div className="flex gap-3 items-start">
              <div className="w-[110px] shrink-0 pt-1.5 text-[13px] font-medium text-neutral-800 font-mono">
                docRecallList
              </div>
              <pre className="flex-1 min-w-0 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-2 text-[11px] leading-5 text-neutral-600 font-mono overflow-x-auto">
{`[
  {
    "field": "docId",
    "type": "Long"
  },
  {
    "field": "docName",
    "type": "String"
  },
  {
    "field": "content",
    "type": "String"
  }
]`}
              </pre>
            </div>
          </div>
        </div>
      );
    }

    if (node.type === '条件分支') {
      if (!node.branchConfig) {
        return (
          <div className="flex h-full items-center justify-center text-neutral-400 text-sm">
            初始化规则…
          </div>
        );
      }
      return (
        <WorkflowBranchConfigForm
          config={node.branchConfig}
          onChange={(next) => onUpdateNode(node.id, { branchConfig: next })}
        />
      );
    }

    return (
      <div className="flex h-full items-center justify-center text-gray-400 text-sm">配置信息页</div>
    );
  };

  return (
    <div
      className="absolute right-0 top-14 bottom-0 w-[320px] bg-white shadow-2xl border-l border-neutral-200 z-[70] flex flex-col pointer-events-auto animate-in slide-in-from-right duration-200"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="px-3 pt-3 pb-2.5 border-b border-neutral-100 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div
              className="w-8 h-8 shrink-0 flex items-center justify-center"
            >
              <WorkflowNodeIcon type={node.type} className="w-8 h-8" />
            </div>
            {!isSpecialNode ? (
              isEditingName ? (
                <input
                  autoFocus
                  className="border border-neutral-300 rounded w-full outline-none text-neutral-800 px-1.5 py-0.5 bg-neutral-50 text-[13px] font-semibold"
                  value={nameText}
                  onChange={(e) => setNameText(e.target.value)}
                  onBlur={handleNameBlur}
                  onKeyDown={handleNameKeyDown}
                />
              ) : (
                <div
                  className="flex items-center gap-1 cursor-pointer hover:text-neutral-950 group transition-colors flex-1 min-w-0"
                  onClick={() => setIsEditingName(true)}
                >
                  <span className="font-semibold text-neutral-800 text-[13px] truncate group-hover:underline decoration-neutral-300 underline-offset-2">
                    {node.name || node.type}
                  </span>
                  <Pencil className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
              )
            ) : (
              <span className="font-semibold text-neutral-800 text-[13px] truncate">{node.name || node.type}</span>
            )}
          </div>

          <div className="flex items-center gap-0.5 shrink-0 ml-1">
            {!isSpecialNode && (
              <div className="relative" onMouseLeave={() => setIsMenuOpen(false)}>
                <button
                  type="button"
                  className="p-1 hover:bg-neutral-100 rounded-md text-neutral-500 transition-colors"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {isMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-neutral-100 shadow-lg rounded-md py-1 w-24 z-50">
                    <button
                      type="button"
                      className="w-full text-left px-3 py-1.5 text-[12px] text-neutral-700 hover:bg-neutral-50"
                      onClick={(e) => {
                        setIsMenuOpen(false);
                        onCopy(e, node);
                      }}
                    >
                      复制
                    </button>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-1.5 text-[12px] text-rose-600 hover:bg-rose-50"
                      onClick={(e) => {
                        setIsMenuOpen(false);
                        onDelete(e, node.id);
                      }}
                    >
                      删除
                    </button>
                  </div>
                )}
              </div>
            )}
            <button
              type="button"
              className="p-1 hover:bg-neutral-100 rounded-md text-neutral-500 transition-colors"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-start gap-1.5 text-[12px] text-neutral-500 leading-4 pl-8">
          {isEditingDesc ? (
            <textarea
              autoFocus
              className="border border-neutral-300 rounded w-full outline-none text-neutral-700 px-2 py-1 bg-neutral-50 resize-none text-[12px]"
              rows={2}
              value={descText}
              onChange={(e) => setDescText(e.target.value)}
              onBlur={handleDescBlur}
              onKeyDown={handleDescKeyDown}
            />
          ) : (
            <div
              className="flex items-start gap-1 cursor-pointer hover:text-neutral-800 group transition-colors w-full"
              onClick={() => setIsEditingDesc(true)}
            >
              <span className="group-hover:underline decoration-neutral-300 underline-offset-2 flex-1 line-clamp-2">
                {descText}
              </span>
              <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 shrink-0" />
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 bg-white [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {renderContent()}
      </div>
    </div>
  );
}
