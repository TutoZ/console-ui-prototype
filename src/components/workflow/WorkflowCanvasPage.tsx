import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Clock, Pencil, Play, UploadCloud } from '@/lib/icons';
import { AGENT_AVATAR_PRESETS, isAvatarImageUrl } from '@/lib/agentAvatarDisplay';
import { BTN_INK, BTN_OUTLINE, BTN_SOFT } from '@/lib/ui';
import { cn } from '@/lib/utils';
import { WorkflowCanvasArea } from './WorkflowCanvasArea';
import { WorkflowNodeConfigPanel } from './WorkflowNodeConfigPanel';
import {
  ChecklistPanel,
  WorkflowArchiveDrawer,
  WorkflowEditAgentModal,
} from './WorkflowSidePanels';
import { WorkflowTestPanel } from './WorkflowTestPanel';
import type {
  AddNodeMenuState,
  AddableNodeType,
  ArchiveItem,
  CanvasEdge,
  CanvasHistory,
  CanvasNode,
  CanvasNote,
  ChatMessage,
  DrawingLine,
  ExecutionLog,
  WorkflowCanvasPageProps,
} from './workflowTypes';
import {
  computeValidationErrors,
  createDefaultArchives,
  createDefaultNodes,
  getEdgeSourcePoint,
  getFormattedTime,
  getLayoutBounds,
  optimizeNodeLayout,
  snapshotOf,
  upsertCanvasEdge,
} from './workflowUtils';
import { createDefaultBranchConfig, createDefaultKbConfig, getDefaultDesc, normalizeKbConfig } from './workflowConstants';
import { showAppToast } from '@/lib/appToast';

function WorkflowHeaderAvatar({
  avatar,
  onChange,
}: {
  avatar: string;
  onChange: (avatar: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const src = isAvatarImageUrl(avatar) ? avatar : AGENT_AVATAR_PRESETS[0];

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange(reader.result);
        setOpen(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group relative h-8 w-8 rounded-[7px] overflow-hidden bg-neutral-100 cursor-pointer"
        title="更换头像"
      >
        <img src={src} alt="" className="h-full w-full object-cover" draggable={false} />
        <span className="absolute inset-0 bg-ink/0 group-hover:bg-ink/5 transition" />
      </button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="关闭头像选择"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full mt-2 z-50 w-[260px] bg-white border border-neutral-200 rounded-[13px] shadow-[0_12px_40px_rgba(0,0,0,0.08)] p-3 animate-in fade-in zoom-in-95 duration-150">
            <p className="text-xs font-semibold text-neutral-500 mb-2">形象头像</p>
            <div className="grid grid-cols-6 gap-1.5 mb-2 max-h-[168px] overflow-y-auto custom-scrollbar-thin pr-0.5">
              {AGENT_AVATAR_PRESETS.map((preset) => {
                const selected = src === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    title="选择形象头像"
                    onClick={() => {
                      onChange(preset);
                      setOpen(false);
                    }}
                    className={cn(
                      'h-9 w-9 rounded-lg overflow-hidden transition cursor-pointer hover:opacity-90',
                      selected ? 'ring-1 ring-neutral-900/20' : '',
                    )}
                  >
                    <img src={preset} alt="" className="h-full w-full object-cover" />
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center justify-center gap-1.5 h-8 rounded-[7px] border border-dashed border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
            >
              <UploadCloud size={14} className="text-neutral-500" />
              上传自定义图片
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={pickFile}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}

export function WorkflowCanvasPage({
  agentName,
  agentId,
  agentAvatar,
  onBack,
}: WorkflowCanvasPageProps) {
  const [agentInfo, setAgentInfo] = useState({ name: agentName, description: '' });
  const [avatar, setAvatar] = useState(
    () => (agentAvatar && isAvatarImageUrl(agentAvatar) ? agentAvatar : AGENT_AVATAR_PRESETS[0]),
  );
  const [nodes, setNodes] = useState<CanvasNode[]>(() => createDefaultNodes());
  const [edges, setEdges] = useState<CanvasEdge[]>([]);
  const [notes, setNotes] = useState<CanvasNote[]>([]);
  const [history, setHistory] = useState<CanvasHistory>({ past: [], future: [] });

  const [archives, setArchives] = useState<ArchiveItem[]>(() => createDefaultArchives());
  const [draftTime, setDraftTime] = useState('2026-08-12 11:59:25');

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  /** 与选中分离：只有明确打开配置时才出侧栏，避免一点就开 */
  const [configNodeId, setConfigNodeId] = useState<string | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const [menuState, setMenuState] = useState<AddNodeMenuState>({
    visible: false,
    x: 0,
    y: 0,
    sourceNodeId: null,
    isToolbar: false,
  });
  const [activeNodeMenuId, setActiveNodeMenuId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [drawingLine, setDrawingLine] = useState<DrawingLine | null>(null);

  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isChecklistOpen, setChecklistOpen] = useState(false);
  const [isArchiveOpen, setArchiveOpen] = useState(false);
  const [isLocateOpen, setLocateOpen] = useState(false);
  const [isTestPanelOpen, setTestPanelOpen] = useState(false);
  const [isMinimapVisible, setMinimapVisible] = useState(false);

  const [testPhase, setTestPhase] = useState<'config' | 'testing'>('config');
  const [testConfigInput, setTestConfigInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [executionLog, setExecutionLog] = useState<ExecutionLog | null>(null);
  const [activeLogStepId, setActiveLogStepId] = useState('start');

  const [searchNodeText, setSearchNodeText] = useState('');
  const [isPanning, setIsPanning] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const panningStateRef = useRef(false);
  const lastPanMouse = useRef({ x: 0, y: 0 });
  const draggingItemRef = useRef<{
    id: string;
    type: 'node' | 'note';
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  } | null>(null);
  /** 按下待决：未超过位移阈值松开=单击唤起；移动超过阈值=立刻拖拽 */
  const pendingPressRef = useRef<{
    id: string;
    type: 'node' | 'note';
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  } | null>(null);
  const [isDraggingItem, setIsDraggingItem] = useState(false);

  /** 约 4px 就进入拖拽，既跟手又不会和单击抢 */
  const NODE_DRAG_THRESHOLD_PX = 4;

  const clearPendingPress = useCallback(() => {
    pendingPressRef.current = null;
  }, []);

  const beginItemDrag = useCallback(
    (payload: {
      id: string;
      type: 'node' | 'note';
      startX: number;
      startY: number;
      initialX: number;
      initialY: number;
    }) => {
      pendingPressRef.current = null;
      draggingItemRef.current = payload;
      setIsDraggingItem(true);
      setSelectedNodeId(payload.id);
      setMenuState((m) => ({ ...m, visible: false }));
      setActiveNodeMenuId(null);
      setChecklistOpen(false);
      setLocateOpen(false);
    },
    [],
  );

  const openNodeConfig = useCallback((nodeId: string) => {
    if (!nodeId.startsWith('node_')) return;
    setSelectedNodeId(nodeId);
    setConfigNodeId(nodeId);
    setMenuState((m) => ({ ...m, visible: false }));
    setActiveNodeMenuId(null);
    setChecklistOpen(false);
    setLocateOpen(false);
    setTestPanelOpen(false);
  }, []);

  useEffect(() => {
    setAgentInfo((prev) => ({ ...prev, name: agentName }));
  }, [agentName]);

  useEffect(() => {
    if (agentAvatar && isAvatarImageUrl(agentAvatar)) {
      setAvatar(agentAvatar);
    }
  }, [agentAvatar]);

  const showToast = useCallback((msg: string, type: 'info' | 'success' | 'error' | 'warning' = 'success') => {
    showAppToast(msg, type);
  }, []);

  const updateCanvasState = useCallback(
    (newNodes: CanvasNode[], newEdges: CanvasEdge[], newNotes: CanvasNote[] = notes) => {
      setHistory((h) => ({
        past: [...h.past, snapshotOf(nodes, edges, notes)],
        future: [],
      }));
      setNodes(newNodes);
      setEdges(newEdges);
      setNotes(newNotes);
    },
    [nodes, edges, notes],
  );

  const validationErrors = useMemo(() => computeValidationErrors(nodes, edges), [nodes, edges]);

  const handleUndo = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (history.past.length === 0) return;
    const previous = history.past[history.past.length - 1];
    setHistory({
      past: history.past.slice(0, -1),
      future: [snapshotOf(nodes, edges, notes), ...history.future],
    });
    setNodes(previous.nodes);
    setEdges(previous.edges);
    setNotes(previous.notes);
  };

  const handleRedo = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (history.future.length === 0) return;
    const next = history.future[0];
    setHistory({
      past: [...history.past, snapshotOf(nodes, edges, notes)],
      future: history.future.slice(1),
    });
    setNodes(next.nodes);
    setEdges(next.edges);
    setNotes(next.notes);
  };

  const centerOnNode = (nodeId: string) => {
    const targetNode = nodes.find((n) => n.id === nodeId);
    if (!targetNode || !canvasRef.current) return;
    openNodeConfig(nodeId);
    setChecklistOpen(false);
    setLocateOpen(false);
    const canvasW = canvasRef.current.offsetWidth;
    const canvasH = canvasRef.current.offsetHeight;
    const targetZoom = 1.2;
    setZoom(targetZoom);
    setPan({
      x: canvasW / 2 - (targetNode.x + 120) * targetZoom,
      y: canvasH / 2 - (targetNode.y + 50) * targetZoom,
    });
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.id === 'canvas-bg' || target.id === 'canvas-svg') {
      clearPendingPress();
      draggingItemRef.current = null;
      setIsDraggingItem(false);
      setSelectedNodeId(null);
      setConfigNodeId(null);
      setMenuState({ visible: false, x: 0, y: 0, sourceNodeId: null, sourceHandle: null, isToolbar: false });
      setActiveNodeMenuId(null);
      setChecklistOpen(false);
      setLocateOpen(false);
      setArchiveOpen(false);
      panningStateRef.current = true;
      setIsPanning(true);
      lastPanMouse.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleItemMouseDown = (e: React.MouseEvent, id: string, type: 'node' | 'note' = 'node') => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    clearPendingPress();
    draggingItemRef.current = null;
    setIsDraggingItem(false);
    setMenuState((m) => ({ ...m, visible: false }));
    setActiveNodeMenuId(null);
    setChecklistOpen(false);
    setLocateOpen(false);
    // 按下即高亮，侧栏等松开且未拖拽时再开，保证单击够快
    setSelectedNodeId(id);
    const item =
      type === 'node' ? nodes.find((n) => n.id === id) : notes.find((n) => n.id === id);
    if (!item) return;
    pendingPressRef.current = {
      id,
      type,
      startX: e.clientX,
      startY: e.clientY,
      initialX: item.x,
      initialY: item.y,
    };
  };

  const handleDotMouseDown = (
    e: React.MouseEvent,
    nodeId: string,
    isSource: boolean,
    sourceHandle?: string | null,
  ) => {
    e.stopPropagation();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node || !canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const portEl = e.currentTarget as HTMLElement;
    const pr = portEl.getBoundingClientRect();
    const startX = (pr.left + pr.width / 2 - canvasRect.left - pan.x) / zoom;
    const startY = (pr.top + pr.height / 2 - canvasRect.top - pan.y) / zoom;
    const currentX = (e.clientX - canvasRect.left - pan.x) / zoom;
    const currentY = (e.clientY - canvasRect.top - pan.y) / zoom;
    setDrawingLine({
      sourceNodeId: isSource ? nodeId : null,
      targetNodeId: !isSource ? nodeId : null,
      sourceHandle: isSource ? sourceHandle ?? null : null,
      startX,
      startY,
      currentX,
      currentY,
    });
  };

  const handleDotMouseUp = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (drawingLine) {
      if (drawingLine.sourceNodeId && drawingLine.sourceNodeId !== nodeId) {
        const newEdge: CanvasEdge = {
          id: `edge_${Date.now()}`,
          source: drawingLine.sourceNodeId,
          target: nodeId,
          ...(drawingLine.sourceHandle
            ? { sourceHandle: drawingLine.sourceHandle }
            : {}),
        };
        updateCanvasState(nodes, upsertCanvasEdge(edges, newEdge), notes);
      } else if (drawingLine.targetNodeId && drawingLine.targetNodeId !== nodeId) {
        const newEdge: CanvasEdge = {
          id: `edge_${Date.now()}`,
          source: nodeId,
          target: drawingLine.targetNodeId,
          ...(drawingLine.sourceHandle
            ? { sourceHandle: drawingLine.sourceHandle }
            : {}),
        };
        updateCanvasState(nodes, upsertCanvasEdge(edges, newEdge), notes);
      }
    }
    setDrawingLine(null);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (panningStateRef.current) {
        const dx = e.clientX - lastPanMouse.current.x;
        const dy = e.clientY - lastPanMouse.current.y;
        setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
        lastPanMouse.current = { x: e.clientX, y: e.clientY };
        return;
      }

      if (pendingPressRef.current && !draggingItemRef.current) {
        const pending = pendingPressRef.current;
        const dist = Math.hypot(e.clientX - pending.startX, e.clientY - pending.startY);
        if (dist >= NODE_DRAG_THRESHOLD_PX) {
          beginItemDrag({
            id: pending.id,
            type: pending.type,
            // 以按下点为锚，避免刚过阈值时节点跳一下
            startX: pending.startX,
            startY: pending.startY,
            initialX: pending.initialX,
            initialY: pending.initialY,
          });
        }
      }

      if (draggingItemRef.current) {
        const { id, type, startX, startY, initialX, initialY } = draggingItemRef.current;
        const dx = (e.clientX - startX) / zoom;
        const dy = (e.clientY - startY) / zoom;
        if (type === 'node') {
          setNodes((prev) =>
            prev.map((n) => (n.id === id ? { ...n, x: initialX + dx, y: initialY + dy } : n)),
          );
        } else {
          setNotes((prev) =>
            prev.map((n) => (n.id === id ? { ...n, x: initialX + dx, y: initialY + dy } : n)),
          );
        }
        return;
      }

      if (drawingLine && canvasRef.current) {
        const canvasRect = canvasRef.current.getBoundingClientRect();
        const currentX = (e.clientX - canvasRect.left - pan.x) / zoom;
        const currentY = (e.clientY - canvasRect.top - pan.y) / zoom;
        setDrawingLine((prev) => (prev ? { ...prev, currentX, currentY } : null));
      }
    };

    const handleMouseUp = () => {
      panningStateRef.current = false;
      setIsPanning(false);
      const wasDragging = Boolean(draggingItemRef.current);
      if (pendingPressRef.current && !wasDragging) {
        const { id, type } = pendingPressRef.current;
        clearPendingPress();
        // 单击：节点打开配置侧栏；注释仅选中
        if (type === 'node') {
          openNodeConfig(id);
        } else {
          setSelectedNodeId(id);
        }
      } else {
        clearPendingPress();
      }
      draggingItemRef.current = null;
      setIsDraggingItem(false);
      if (drawingLine) setDrawingLine(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      clearPendingPress();
    };
  }, [zoom, pan, drawingLine, clearPendingPress, beginItemDrag, openNodeConfig]);

  const handleDeleteNode = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const newNodes = nodes.filter((n) => n.id !== nodeId);
    const newEdges = edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId);
    updateCanvasState(newNodes, newEdges, notes);
    setActiveNodeMenuId(null);
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
    if (configNodeId === nodeId) setConfigNodeId(null);
  };

  const handleCopyNode = (e: React.MouseEvent, node: CanvasNode) => {
    e.stopPropagation();
    const newNodeId = `node_${Date.now()}`;
    const kb = node.type === '知识检索' ? normalizeKbConfig(node.kbConfig) : null;
    const cloned: CanvasNode = {
      ...node,
      id: newNodeId,
      x: node.x + 40,
      y: node.y + 40,
      kbConfig: kb ? { ...kb } : undefined,
      branchConfig: node.branchConfig
        ? {
            groups: node.branchConfig.groups.map((g) => ({
              ...g,
              id: `${g.id}_copy_${Date.now()}`,
              conditions: g.conditions.map((c) => ({ ...c, id: `${c.id}_copy_${Date.now()}` })),
            })),
          }
        : undefined,
    };
    const newNodes = [...nodes, cloned];
    updateCanvasState(newNodes, edges, notes);
    setActiveNodeMenuId(null);
    openNodeConfig(newNodeId);
  };

  const openNodeMenu = (e: React.MouseEvent, sourceNodeId: string | null = null, isToolbar = false) => {
    e.stopPropagation();
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setMenuState({
      visible: true,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      sourceNodeId,
      sourceHandle: null,
      isToolbar,
    });
  };

  const addNode = (type: string) => {
    if (!canvasRef.current) return;
    let newNodeX: number;
    let newNodeY: number;
    if (menuState.isToolbar) {
      const canvasW = canvasRef.current.offsetWidth;
      const canvasH = canvasRef.current.offsetHeight;
      newNodeX = (canvasW / 2 - pan.x) / zoom - 120;
      newNodeY = (canvasH / 2 - pan.y) / zoom - 50;
    } else if (menuState.sourceNodeId) {
      newNodeX = menuState.x + 100;
      newNodeY = menuState.y - 50;
    } else {
      newNodeX = menuState.x;
      newNodeY = menuState.y;
    }
    const newNodeId = `node_${Date.now()}`;
    const nodeType = type as AddableNodeType;
    const newNodes: CanvasNode[] = [
      ...nodes,
      {
        id: newNodeId,
        type: nodeType,
        x: newNodeX,
        y: newNodeY,
        name: nodeType,
        desc: getDefaultDesc(nodeType),
        ...(nodeType === '知识检索' ? { kbConfig: createDefaultKbConfig() } : {}),
        ...(nodeType === '条件分支' ? { branchConfig: createDefaultBranchConfig() } : {}),
      },
    ];
    let newEdges = edges;
    if (menuState.sourceNodeId) {
      const newEdge: CanvasEdge = {
        id: `edge_${Date.now()}`,
        source: menuState.sourceNodeId,
        target: newNodeId,
        ...(menuState.sourceHandle ? { sourceHandle: menuState.sourceHandle } : {}),
      };
      newEdges = upsertCanvasEdge(edges, newEdge);
    }
    updateCanvasState(newNodes, newEdges, notes);
    openNodeConfig(newNodeId);
    setMenuState({ visible: false, x: 0, y: 0, sourceNodeId: null, sourceHandle: null, isToolbar: false });
  };

  const handleAddNote = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!canvasRef.current) return;
    const canvasW = canvasRef.current.offsetWidth;
    const canvasH = canvasRef.current.offsetHeight;
    const noteX = (canvasW / 2 - pan.x) / zoom - 100;
    const noteY = (canvasH / 2 - pan.y) / zoom - 100;
    const newNotes = [...notes, { id: `note_${Date.now()}`, text: '', x: noteX, y: noteY }];
    updateCanvasState(nodes, edges, newNotes);
  };

  const handleOptimizeLayout = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const newNodes = optimizeNodeLayout(nodes, edges);
    updateCanvasState(newNodes, edges, notes);
    const bounds = getLayoutBounds(newNodes);
    if (bounds && canvasRef.current) {
      const canvasW = canvasRef.current.offsetWidth;
      const canvasH = canvasRef.current.offsetHeight;
      setZoom(1);
      setPan({
        x: canvasW / 2 - bounds.centerX,
        y: canvasH / 2 - bounds.centerY,
      });
    }
  };

  const handleOpenTest = () => {
    if (validationErrors.length > 0) {
      setChecklistOpen(true);
      setArchiveOpen(false);
      setTestPanelOpen(false);
      return;
    }
    setTestPanelOpen(true);
    setTestPhase('config');
    setChecklistOpen(false);
    setArchiveOpen(false);
  };

  const handleStartTesting = () => {
    if (!testConfigInput.trim()) return;
    setTestPhase('testing');
    setChatMessages([]);
    setExecutionLog(null);
    setChatInput(testConfigInput);
  };

  const handleSendTestMessage = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setExecutionLog(null);

    window.setTimeout(() => {
      const replyMsg = '已收到您的输入信息。这是能力测试环境的沙盒返回结果，不影响线上正式业务。';
      setChatMessages((prev) => [...prev, { role: 'bot', text: replyMsg }]);
      setExecutionLog({
        id: '44446416-f4d3-4581-ab22-a08921cee859',
        time: getFormattedTime().slice(11, 16),
        steps: [
          {
            id: 'start',
            name: '开始节点',
            time: '14ms',
            status: '运行成功',
            details: {
              input: [
                { key: 'user_input', value: userMsg },
                { key: 'session_id', value: '10b58541-232e-4de0-974b-f2ee09112958' },
                { key: 'user_pin', value: 'cdliujun1@jd.com' },
                { key: 'bot_id', value: 1 },
              ],
              output: [
                { key: 'user_input', value: userMsg },
                { key: 'meta_source', value: 'sandbox_env' },
              ],
            },
          },
          {
            id: 'llm',
            name: 'LLM (大模型)',
            time: '7765ms',
            status: '运行成功',
            subInfo: 'DeepSeek-V4-Flash (7569ms)',
            details: {
              input: [
                { key: 'system_prompt', value: '你是一个严谨的数字员工，当前处于能力测试环节。' },
                { key: 'user_query', value: userMsg },
                { key: 'temperature', value: 0.7 },
              ],
              output: [
                { key: 'generated_text', value: replyMsg },
                { key: 'finish_reason', value: 'stop' },
              ],
            },
          },
          {
            id: 'end',
            name: '结束节点',
            time: '72ms',
            status: '运行成功',
            details: {
              input: [{ key: 'output_text', value: replyMsg }],
              output: [
                { key: 'final_result', value: replyMsg },
                { key: 'delivery_channel', value: 'sandbox_chat' },
              ],
            },
          },
        ],
      });
      setActiveLogStepId('llm');
    }, 1500);
  };

  const handleSaveConfig = () => {
    const now = Date.now().toString();
    const timeStr = getFormattedTime();
    setArchives((prev) => [
      { id: now, status: 'HISTORY', time: timeStr, nodes, edges, notes },
      ...prev,
    ]);
    setDraftTime(timeStr);
    showToast('已保存，员工已进入试岗阶段');
  };

  const handleCompleteConfig = () => {
    if (validationErrors.length > 0) {
      setChecklistOpen(true);
      setArchiveOpen(false);
      return;
    }
    const now = Date.now().toString();
    const timeStr = getFormattedTime();
    setArchives((prev) => {
      const newArchives = prev.map((a) =>
        a.status === 'ACTIVE' ? { ...a, status: 'HISTORY' as const } : a,
      );
      return [{ id: now, status: 'ACTIVE', time: timeStr, nodes, edges, notes }, ...newArchives];
    });
    setDraftTime(timeStr);
    setChecklistOpen(false);
    setArchiveOpen(false);
    showToast('培训完成，员工已上岗');
  };

  const handleApplyArchive = (archive: ArchiveItem) => {
    updateCanvasState(archive.nodes, archive.edges, archive.notes);
    setArchiveOpen(false);
    showToast(`已成功恢复至历史版本 V_${archive.id}`);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if ((e.key === 'Enter' || e.key === 'Backspace' || e.key === 'Delete') && selectedNodeId) {
        if (selectedNodeId.startsWith('node_')) {
          const nodeToDelete = nodes.find((n) => n.id === selectedNodeId);
          if (nodeToDelete && nodeToDelete.type !== '开始' && nodeToDelete.type !== '结束') {
            const newNodes = nodes.filter((n) => n.id !== selectedNodeId);
            const newEdges = edges.filter(
              (edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId,
            );
            updateCanvasState(newNodes, newEdges, notes);
            setSelectedNodeId(null);
            setConfigNodeId(null);
          }
        } else if (selectedNodeId.startsWith('note_')) {
          const newNotes = notes.filter((n) => n.id !== selectedNodeId);
          updateCanvasState(nodes, edges, newNotes);
          setSelectedNodeId(null);
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, nodes, edges, notes, updateCanvasState]);

  const configNode = configNodeId ? nodes.find((n) => n.id === configNodeId) : null;
  const showConfigPanel =
    Boolean(configNodeId?.startsWith('node_') && configNode && !isTestPanelOpen);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden select-none relative bg-white">
      <header className="bg-white border-b border-neutral-200 shrink-0 z-40 relative">
        <div className="px-4 md:px-6 py-2.5 flex items-center justify-between gap-3 min-h-[56px]">
          <div className="flex items-center gap-3 shrink-0 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className={cn(BTN_SOFT, 'shrink-0 -ml-1 gap-1.5 text-neutral-500 hover:text-neutral-800')}
            >
              <ArrowLeft size={14} />
              返回
            </button>
            <div className="hidden sm:flex items-center gap-2.5 min-w-0">
              <WorkflowHeaderAvatar avatar={avatar} onChange={setAvatar} />
              <div className="min-w-0 text-left">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm font-extrabold text-neutral-900 tracking-tight truncate max-w-[160px]">
                    {agentInfo.name}
                  </span>
                  <button
                    type="button"
                    className="text-neutral-400 hover:text-neutral-700 p-0.5 cursor-pointer shrink-0 rounded-[7px]"
                    title="编辑员工信息"
                    onClick={() => setEditModalOpen(true)}
                  >
                    <Pencil size={13} />
                  </button>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5 truncate">{agentId}</p>
              </div>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-1.5">
            <ChecklistPanel
              open={isChecklistOpen}
              errors={validationErrors}
              onToggle={() => {
                setChecklistOpen(!isChecklistOpen);
                setArchiveOpen(false);
                setTestPanelOpen(false);
              }}
              onLocate={centerOnNode}
            />
            <button type="button" onClick={handleSaveConfig} className={BTN_OUTLINE}>
              保存
            </button>
            <button
              type="button"
              onClick={handleOpenTest}
              className={cn(isTestPanelOpen ? BTN_SOFT : BTN_OUTLINE)}
            >
              <Play size={14} className="shrink-0" />
              试运行
            </button>
            <button type="button" onClick={handleCompleteConfig} className={BTN_INK}>
              完成配置
            </button>
            <div className="relative">
              <button
                type="button"
                title="历史版本"
                onClick={() => {
                  setArchiveOpen(!isArchiveOpen);
                  setChecklistOpen(false);
                  setTestPanelOpen(false);
                }}
                className={cn(BTN_SOFT, 'h-8 w-8 px-0', isArchiveOpen && 'bg-neutral-200')}
              >
                <Clock size={16} className="text-neutral-600" />
              </button>
              <WorkflowArchiveDrawer
                open={isArchiveOpen}
                draftTime={draftTime}
                archives={archives}
                onClose={() => setArchiveOpen(false)}
                onApply={handleApplyArchive}
                onDelete={(id) => setArchives((prev) => prev.filter((a) => a.id !== id))}
              />
            </div>
          </div>
        </div>
      </header>

      <WorkflowCanvasArea
          canvasRef={canvasRef}
          nodes={nodes}
          edges={edges}
          notes={notes}
          pan={pan}
          zoom={zoom}
          selectedNodeId={selectedNodeId}
          menuState={menuState}
          activeNodeMenuId={activeNodeMenuId}
          hoveredEdgeId={hoveredEdgeId}
          drawingLine={drawingLine}
          isPanning={isPanning}
          isDraggingItem={isDraggingItem}
          canUndo={history.past.length > 0}
          canRedo={history.future.length > 0}
          isLocateOpen={isLocateOpen}
          isMinimapVisible={isMinimapVisible}
          searchNodeText={searchNodeText}
          onCanvasMouseDown={handleCanvasMouseDown}
          onItemMouseDown={handleItemMouseDown}
          onItemDoubleClick={(id) => openNodeConfig(id)}
          onDotMouseDown={handleDotMouseDown}
          onDotMouseUp={handleDotMouseUp}
          onEdgeHover={setHoveredEdgeId}
          onDeleteEdge={(edgeId) => {
            updateCanvasState(
              nodes,
              edges.filter((e) => e.id !== edgeId),
              notes,
            );
            setHoveredEdgeId(null);
          }}
          onNoteTextChange={(id, text) =>
            setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, text } : n)))
          }
          onActiveNodeMenuToggle={setActiveNodeMenuId}
          onCopyNode={handleCopyNode}
          onDeleteNode={handleDeleteNode}
          onOpenOutputMenu={(e, node, sourceHandle) => {
            e.stopPropagation();
            const sp = getEdgeSourcePoint(node, sourceHandle ?? undefined);
            setMenuState({
              visible: true,
              x: sp.x * zoom + pan.x,
              y: sp.y * zoom + pan.y,
              sourceNodeId: node.id,
              sourceHandle: sourceHandle ?? null,
              isToolbar: false,
            });
          }}
          onAddNode={addNode}
          onAddNote={handleAddNote}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onZoomChange={(delta) => setZoom((z) => Math.min(2, Math.max(0.2, z + delta)))}
          onOptimizeLayout={handleOptimizeLayout}
          onLocateToggle={(e) => {
            e.stopPropagation();
            setLocateOpen(!isLocateOpen);
          }}
          onMinimapToggle={(e) => {
            e.stopPropagation();
            setMinimapVisible(!isMinimapVisible);
          }}
          onSearchChange={setSearchNodeText}
          onCenterNode={centerOnNode}
          onOpenToolbarMenu={(e) => openNodeMenu(e, null, true)}
        />

      <WorkflowTestPanel
        open={isTestPanelOpen}
        phase={testPhase}
        configInput={testConfigInput}
        chatMessages={chatMessages}
        chatInput={chatInput}
        executionLog={executionLog}
        activeLogStepId={activeLogStepId}
        onClose={() => setTestPanelOpen(false)}
        onConfigInputChange={setTestConfigInput}
        onStartTesting={handleStartTesting}
        onChatInputChange={setChatInput}
        onSendMessage={handleSendTestMessage}
        onResetConfig={() => {
          setChatMessages([]);
          setExecutionLog(null);
          setTestPhase('config');
        }}
        onActiveLogStepChange={setActiveLogStepId}
      />

      {showConfigPanel && configNode && (
        <WorkflowNodeConfigPanel
          node={configNode}
          onClose={() => setConfigNodeId(null)}
          onUpdateNode={(id, data) => {
            const newNodes = nodes.map((n) => (n.id === id ? { ...n, ...data } : n));
            let newEdges = edges;
            if (data.branchConfig) {
              const valid = new Set(data.branchConfig.groups.map((g) => g.id));
              newEdges = edges.filter(
                (e) => e.source !== id || !e.sourceHandle || valid.has(e.sourceHandle),
              );
            }
            updateCanvasState(newNodes, newEdges, notes);
          }}
          onCopy={handleCopyNode}
          onDelete={handleDeleteNode}
        />
      )}

      <WorkflowEditAgentModal
        open={isEditModalOpen}
        name={agentInfo.name}
        description={agentInfo.description}
        onClose={() => setEditModalOpen(false)}
        onSave={(name, description) => setAgentInfo({ name, description })}
      />
    </div>
  );
}
