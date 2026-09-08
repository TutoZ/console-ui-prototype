import React, { useLayoutEffect, useState } from 'react';
import {
  Layout,
  MoreHorizontal,
  Plus,
  PlusCircle,
  Redo2,
  Search,
  Undo2,
} from '@/lib/icons';
import { cn } from '@/lib/utils';
import {
  CANVAS_BG,
  CANVAS_DOT,
  createDefaultBranchConfig,
  getOrderedBranchGroups,
  mapPlatformKnowledgeBases,
  NODE_DESCRIPTIONS,
  NODE_TYPES,
  normalizeKbConfig,
  getKbQueryValue,
} from './workflowConstants';
import { resolveEdgePoints } from './workflowUtils';
import type { PortOffset } from './workflowUtils';
import type {
  AddNodeMenuState,
  CanvasEdge,
  CanvasNode,
  CanvasNote,
  DrawingLine,
  PanState,
  WorkflowBranchCondition,
} from './workflowTypes';
import { TooltipButton, WorkflowNodeIcon } from './workflowUi';
import { useApp } from '@/src/context/AppContext';

function shortVar(v: string): string {
  if (!v.trim()) return '';
  const cleaned = v.replace(/^\{\{|\}\}$/g, '');
  if (cleaned.length <= 10) return cleaned;
  return `${cleaned.slice(0, 9)}…`;
}

/** 默认灰点；卡片悬停后变蓝 + 加号 */
function NodePortDot() {
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center transition-all duration-150',
        'w-2.5 h-2.5 bg-neutral-400 ring-2 ring-white shadow-sm',
        'group-hover/node:w-3.5 group-hover/node:h-3.5 group-hover/node:bg-blue-500 group-hover/node:ring-blue-100',
      )}
    >
      <Plus className="w-2.5 h-2.5 text-white opacity-0 group-hover/node:opacity-100 transition-opacity duration-150" />
    </div>
  );
}

/** 画布条件格：空态显示灰底框，对齐线上卡片 */
function BranchFieldChip({ value, className }: { value: string; className?: string }) {
  return (
    <span
      className={cn(
        'min-w-0 h-6 px-1.5 rounded border border-neutral-200 bg-neutral-100/80 text-[10px] leading-none flex items-center truncate',
        value ? 'text-neutral-700 font-medium' : 'text-transparent',
        className,
      )}
    >
      {value || '\u00a0'}
    </span>
  );
}

/** 条件行：左值 | 运算符 | 右值；组内用蓝色“且/或”连接 */
function BranchCardConditionRow({
  condition,
  showJoin,
}: {
  condition: WorkflowBranchCondition;
  showJoin: boolean;
}) {
  const hideRight = condition.operator === '为空' || condition.operator === '不为空';
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1 min-w-0">
        <BranchFieldChip value={shortVar(condition.left)} className="flex-1" />
        <BranchFieldChip
          value={condition.operator}
          className="w-[44px] shrink-0 justify-center text-neutral-600"
        />
        {!hideRight ? (
          <BranchFieldChip value={shortVar(condition.right)} className="flex-1" />
        ) : (
          <span className="flex-1" />
        )}
      </div>
      {showJoin ? (
        <div className="flex justify-center py-0.5">
          <span className="text-[11px] font-medium text-live leading-none">
            {condition.joinNext}
          </span>
        </div>
      ) : null}
    </div>
  );
}

type WorkflowCanvasAreaProps = {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  notes: CanvasNote[];
  pan: PanState;
  zoom: number;
  selectedNodeId: string | null;
  menuState: AddNodeMenuState;
  activeNodeMenuId: string | null;
  hoveredEdgeId: string | null;
  drawingLine: DrawingLine | null;
  isPanning: boolean;
  canUndo: boolean;
  canRedo: boolean;
  isLocateOpen: boolean;
  isMinimapVisible: boolean;
  searchNodeText: string;
  onCanvasMouseDown: (e: React.MouseEvent) => void;
  onItemMouseDown: (e: React.MouseEvent, id: string, type?: 'node' | 'note') => void;
  onDotMouseDown: (
    e: React.MouseEvent,
    nodeId: string,
    isSource: boolean,
    sourceHandle?: string | null,
    handleY?: number,
  ) => void;
  onDotMouseUp: (e: React.MouseEvent, nodeId: string) => void;
  onEdgeHover: (id: string | null) => void;
  onDeleteEdge: (edgeId: string) => void;
  onNoteTextChange: (id: string, text: string) => void;
  onActiveNodeMenuToggle: (nodeId: string | null) => void;
  onCopyNode: (e: React.MouseEvent, node: CanvasNode) => void;
  onDeleteNode: (e: React.MouseEvent, nodeId: string) => void;
  onOpenOutputMenu: (
    e: React.MouseEvent,
    node: CanvasNode,
    sourceHandle?: string | null,
    handleY?: number,
  ) => void;
  onAddNode: (type: string) => void;
  onAddNote: (e: React.MouseEvent) => void;
  onUndo: (e: React.MouseEvent) => void;
  onRedo: (e: React.MouseEvent) => void;
  onZoomChange: (delta: number) => void;
  onOptimizeLayout: (e: React.MouseEvent) => void;
  onLocateToggle: (e: React.MouseEvent) => void;
  onMinimapToggle: (e: React.MouseEvent) => void;
  onSearchChange: (text: string) => void;
  onCenterNode: (nodeId: string) => void;
  onOpenToolbarMenu: (e: React.MouseEvent) => void;
  canvasRef: React.RefObject<HTMLDivElement | null>;
};

export function WorkflowCanvasArea({
  nodes,
  edges,
  notes,
  pan,
  zoom,
  selectedNodeId,
  menuState,
  activeNodeMenuId,
  hoveredEdgeId,
  drawingLine,
  isPanning,
  canUndo,
  canRedo,
  isLocateOpen,
  isMinimapVisible,
  searchNodeText,
  onCanvasMouseDown,
  onItemMouseDown,
  onDotMouseDown,
  onDotMouseUp,
  onEdgeHover,
  onDeleteEdge,
  onNoteTextChange,
  onActiveNodeMenuToggle,
  onCopyNode,
  onDeleteNode,
  onOpenOutputMenu,
  onAddNode,
  onAddNote,
  onUndo,
  onRedo,
  onZoomChange,
  onOptimizeLayout,
  onLocateToggle,
  onMinimapToggle,
  onSearchChange,
  onCenterNode,
  onOpenToolbarMenu,
  canvasRef,
}: WorkflowCanvasAreaProps) {
  const { knowledgeBases } = useApp();
  const kbOptions = mapPlatformKnowledgeBases(knowledgeBases);
  const filteredNodes = nodes.filter(
    (n) =>
      (n.name || n.type).includes(searchNodeText) || n.id.includes(searchNodeText),
  );

  const [ports, setPorts] = useState<Record<string, PortOffset>>({});
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  useLayoutEffect(() => {
    const next: Record<string, PortOffset> = {};
    document.querySelectorAll<HTMLElement>('[data-wf-port]').forEach((el) => {
      const nodeId = el.dataset.nodeId;
      const handle = el.dataset.handle;
      const root = el.closest('[data-wf-node]') as HTMLElement | null;
      if (!nodeId || !handle || !root) return;
      const er = el.getBoundingClientRect();
      const rr = root.getBoundingClientRect();
      next[`${nodeId}::${handle}`] = {
        x: (er.left + er.width / 2 - rr.left) / zoom,
        y: (er.top + er.height / 2 - rr.top) / zoom,
      };
    });
    setPorts((prev) => {
      const keys = Object.keys(next);
      if (
        keys.length === Object.keys(prev).length &&
        keys.every((k) => {
          const a = prev[k];
          const b = next[k];
          return a && b && Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5;
        })
      ) {
        return prev;
      }
      return next;
    });
  }, [nodes, zoom, selectedNodeId, hoveredNodeId]);

  const renderEdgeGroup = (edge: CanvasEdge, elevated: boolean) => {
    const source = nodes.find((n) => n.id === edge.source);
    const target = nodes.find((n) => n.id === edge.target);
    if (!source || !target) return null;

    const { x1, y1, x2, y2 } = resolveEdgePoints(
      source,
      target,
      edge.sourceHandle,
      ports,
    );
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const isHovered = hoveredEdgeId === edge.id;
    const pathD = `M ${x1} ${y1} C ${x1 + 60} ${y1}, ${x2 - 60} ${y2}, ${x2} ${y2}`;

    return (
      <g
        key={`${elevated ? 'hi' : 'lo'}-${edge.id}`}
        onMouseEnter={() => onEdgeHover(edge.id)}
        onMouseLeave={() => onEdgeHover(null)}
        style={{ pointerEvents: 'auto', cursor: 'pointer' }}
      >
        <path d={pathD} fill="none" stroke="transparent" strokeWidth="20" />
        <path
          d={pathD}
          fill="none"
          stroke={isHovered || elevated ? '#3B82F6' : '#737373'}
          strokeWidth={isHovered || elevated ? '3' : '2'}
        />
        {isHovered && (
          <foreignObject x={midX - 10} y={midY - 10} width="20" height="20">
            <div
              className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-red-600 shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteEdge(edge.id);
              }}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </foreignObject>
        )}
      </g>
    );
  };

  const focusNodeId = hoveredNodeId || selectedNodeId;
  const elevatedEdgeIds = new Set(
    focusNodeId
      ? edges
          .filter((e) => e.source === focusNodeId || e.target === focusNodeId)
          .map((e) => e.id)
      : hoveredEdgeId
        ? [hoveredEdgeId]
        : [],
  );
  // 悬停某条线时，也抬高该线
  if (hoveredEdgeId) elevatedEdgeIds.add(hoveredEdgeId);

  const baseEdges = edges.filter((e) => !elevatedEdgeIds.has(e.id));
  const topEdges = edges.filter((e) => elevatedEdgeIds.has(e.id));

  return (
    <div
      id="canvas-bg"
      ref={canvasRef}
      className="flex-1 relative w-full h-full overflow-hidden"
      style={{
        backgroundColor: CANVAS_BG,
        backgroundImage: `radial-gradient(${CANVAS_DOT} 1px, transparent 1px)`,
        backgroundSize: `${12 * zoom}px ${12 * zoom}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`,
        cursor: isPanning ? 'grabbing' : 'grab',
      }}
      onMouseDown={onCanvasMouseDown}
    >
      <div
        className="absolute top-0 left-0 w-full h-full"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          pointerEvents: 'none',
        }}
      >
        <svg
          id="canvas-svg"
          className="absolute top-0 left-0 w-full h-full overflow-visible z-0"
          style={{ pointerEvents: 'none' }}
        >
          {baseEdges.map((edge) => renderEdgeGroup(edge, false))}
          {drawingLine && (
            <path
              d={`M ${drawingLine.startX} ${drawingLine.startY} C ${drawingLine.startX + 60} ${drawingLine.startY}, ${drawingLine.currentX - 60} ${drawingLine.currentY}, ${drawingLine.currentX} ${drawingLine.currentY}`}
              fill="none"
              stroke="#93C5FD"
              strokeWidth="2"
              strokeDasharray="4"
            />
          )}
        </svg>

        {nodes.map((node) => {
          const branchConfig =
            node.type === '条件分支'
              ? node.branchConfig ?? createDefaultBranchConfig()
              : null;
          const branchGroups = branchConfig ? getOrderedBranchGroups(branchConfig) : [];
          const kbCard = node.type === '知识检索' ? normalizeKbConfig(node.kbConfig) : null;

          return (
            <div
              key={node.id}
              data-wf-node={node.id}
              className={cn(
                'absolute bg-white rounded-xl shadow-sm border z-10 transition-shadow group/node',
                node.type === '条件分支' ? 'w-[288px]' : 'w-[240px]',
                selectedNodeId === node.id
                  ? 'border-sky-400 ring-2 ring-sky-100 shadow-md'
                  : 'border-gray-200 hover:border-gray-300',
              )}
              style={{ left: node.x, top: node.y, pointerEvents: 'auto' }}
              onMouseDown={(e) => onItemMouseDown(e, node.id, 'node')}
              onMouseEnter={() => setHoveredNodeId(node.id)}
              onMouseLeave={() =>
                setHoveredNodeId((id) => (id === node.id ? null : id))
              }
            >
              <div className="p-3 pb-2 flex items-center justify-between border-b border-gray-50">
                <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                  <div className="w-8 h-8 shrink-0 flex items-center justify-center">
                    <WorkflowNodeIcon type={node.type} className="w-8 h-8" />
                  </div>
                  <span className="font-bold text-sm text-gray-800 truncate">{node.name || node.type}</span>
                </div>
                {node.type !== '开始' && node.type !== '结束' && (
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      className="p-1 hover:bg-gray-100 rounded text-gray-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        onActiveNodeMenuToggle(activeNodeMenuId === node.id ? null : node.id);
                      }}
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                    {activeNodeMenuId === node.id && (
                      <div
                        className="absolute right-0 top-full mt-1 bg-white border border-gray-100 shadow-lg rounded-md py-1 w-24 z-50"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCopyNode(e, node);
                          }}
                        >
                          复制
                        </button>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                          onClick={(e) => onDeleteNode(e, node.id)}
                        >
                          删除
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div
                className={cn(
                  'bg-white rounded-b-xl text-xs text-neutral-500 flex flex-col gap-1.5',
                  node.type === '条件分支' ? 'pl-3 pr-0 py-2.5' : 'px-3 py-2.5',
                )}
              >
                {node.type === '知识检索' && kbCard ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-400 shrink-0">输入</span>
                      <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-600">
                        <span className="text-neutral-400 mr-1">Str.</span>
                        Query
                      </span>
                      <span
                        className={cn(
                          'min-w-0 truncate text-[10px]',
                          getKbQueryValue(kbCard) ? 'text-neutral-500' : 'text-rose-500',
                        )}
                      >
                        {getKbQueryValue(kbCard) || '未绑定'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-400 shrink-0">输出</span>
                      <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-700">
                        <span className="text-neutral-400 mr-1">[ ]</span>
                        docRecallList
                      </span>
                    </div>
                    <div className="mt-0.5 pt-1.5 border-t border-neutral-100">
                      <div className="text-neutral-400 mb-1">知识库</div>
                      {kbCard.selectedKbIds.length > 0 ? (
                        <div className="space-y-0.5">
                          {kbCard.selectedKbIds.map((id) => (
                            <div
                              key={id}
                              className="text-neutral-700 font-medium truncate leading-5"
                            >
                              {kbOptions.find((k) => k.id === id)?.name ?? id}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-rose-500">未配置</div>
                      )}
                    </div>
                  </>
                ) : node.type === '条件分支' && branchConfig ? (
                  <div className="flex flex-col gap-2.5 pr-0">
                    {branchGroups.map((group) => (
                      <div key={group.id} className="relative flex items-center gap-2 pr-3 min-h-[28px]">
                        <div className="w-[56px] shrink-0 text-[11px] text-neutral-500 leading-tight">
                          {group.kind}
                        </div>
                        {group.kind === '否则' ? (
                          <div className="flex-1 min-w-0" />
                        ) : (
                          <div className="flex-1 min-w-0 rounded-md border border-neutral-200 bg-white px-1.5 py-1.5">
                            <div className="flex flex-col">
                              {(group.conditions.length
                                ? group.conditions
                                : [
                                    {
                                      id: 'empty',
                                      left: '',
                                      operator: '等于' as const,
                                      right: '',
                                      rightMode: '引用' as const,
                                      joinNext: '或' as const,
                                    },
                                  ]
                              ).map((cond, idx, arr) => (
                                <BranchCardConditionRow
                                  key={cond.id}
                                  condition={cond}
                                  showJoin={idx < arr.length - 1}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                        <div
                          data-wf-port
                          data-node-id={node.id}
                          data-handle={group.id}
                          className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center cursor-crosshair z-20"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            onDotMouseDown(e, node.id, true, group.id);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenOutputMenu(e, node, group.id);
                          }}
                        >
                          <NodePortDot />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-neutral-400">输入</span>
                      <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-600">
                        <span className="text-neutral-400 mr-1">Str.</span>
                        input
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-neutral-400">输出</span>
                      <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-700">
                        <span className="text-neutral-400 mr-1">Str.</span>
                        output
                      </span>
                    </div>
                  </>
                )}
              </div>
              {node.type !== '开始' && (
                <div
                  data-wf-port
                  data-node-id={node.id}
                  data-handle="in"
                  className="absolute top-1/2 -left-2.5 -translate-y-1/2 w-5 h-5 flex items-center justify-center cursor-crosshair z-20"
                  onMouseDown={(e) => onDotMouseDown(e, node.id, false)}
                  onMouseUp={(e) => onDotMouseUp(e, node.id)}
                >
                  <NodePortDot />
                </div>
              )}
              {node.type !== '结束' && node.type !== '条件分支' && (
                <div
                  data-wf-port
                  data-node-id={node.id}
                  data-handle="out"
                  className="absolute top-1/2 -right-2.5 -translate-y-1/2 w-5 h-5 flex items-center justify-center cursor-crosshair z-20"
                  onMouseDown={(e) => onDotMouseDown(e, node.id, true)}
                  onClick={(e) => onOpenOutputMenu(e, node)}
                >
                  <NodePortDot />
                </div>
              )}
            </div>
          );
        })}

        {/* 悬停/选中节点相关连线置顶，避免被卡片遮挡 */}
        <svg
          className="absolute top-0 left-0 w-full h-full overflow-visible z-30"
          style={{ pointerEvents: 'none' }}
        >
          {topEdges.map((edge) => renderEdgeGroup(edge, true))}
        </svg>

        {notes.map((note) => (
          <div
            key={note.id}
            className={cn(
              'absolute w-56 bg-[#fef08a] shadow-md border z-10 transition-shadow rounded-md overflow-hidden',
              selectedNodeId === note.id
                ? 'border-yellow-500 ring-2 ring-yellow-400/50'
                : 'border-yellow-300',
            )}
            style={{ left: note.x, top: note.y, pointerEvents: 'auto' }}
            onMouseDown={(e) => onItemMouseDown(e, note.id, 'note')}
          >
            <div className="h-4 bg-[#fde047] cursor-move flex items-center justify-center border-b border-yellow-300/50">
              <div className="w-6 h-1 rounded-full bg-yellow-500/50" />
            </div>
            <textarea
              className="w-full p-3 bg-transparent resize-none outline-none text-sm text-yellow-900 placeholder-yellow-700/50"
              placeholder="在这里输入注释..."
              value={note.text}
              onChange={(e) => onNoteTextChange(note.id, e.target.value)}
              onMouseDown={(e) => e.stopPropagation()}
              style={{ minHeight: '100px' }}
            />
          </div>
        ))}
      </div>

      {menuState.visible && (
        <div
          className="absolute bg-white rounded-xl shadow-xl border border-gray-100 w-48 p-2 z-[80] flex flex-col gap-1 animate-in fade-in duration-100"
          style={
            menuState.isToolbar
              ? { left: '50%', bottom: '80px', marginLeft: '-150px' }
              : { left: menuState.x + 10, top: menuState.y - 10 }
          }
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="text-xs text-gray-400 font-medium px-2 py-1">选择节点类型</div>
          {NODE_TYPES.map((type) => {
            return (
            <div key={type} className="relative group">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddNode(type);
                }}
                className="w-full text-left px-2 py-1.5 text-[13px] text-gray-700 group-hover:bg-indigo-50 group-hover:text-indigo-600 rounded-md transition-colors flex items-center gap-2 font-medium"
              >
                <WorkflowNodeIcon type={type} className="w-7 h-7" />
                {type}
              </button>
              <div
                className={cn(
                  'absolute top-0 w-[260px] bg-white rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.12)] border border-gray-100 p-4 z-[90] hidden group-hover:flex flex-col gap-1.5 pointer-events-none',
                  !menuState.isToolbar && menuState.x > window.innerWidth - 350
                    ? 'right-[100%] mr-2'
                    : 'left-[100%] ml-2',
                )}
              >
                <div className="flex items-center gap-2">
                  <WorkflowNodeIcon type={type} className="w-8 h-8" />
                  <h4 className="font-bold text-gray-800 text-[15px]">{type}</h4>
                </div>
                <p className="text-[12px] text-gray-500 leading-relaxed text-justify">
                  {NODE_DESCRIPTIONS[type]}
                </p>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {isMinimapVisible && (
        <div
          className="absolute bottom-6 left-6 w-52 h-36 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-20 flex flex-col pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="text-[11px] font-bold text-gray-500 px-3 py-2 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
            <span>导航视图</span>
            <button type="button" onClick={onMinimapToggle} className="hover:text-gray-800 text-gray-500">
              ×
            </button>
          </div>
          <div
            className="relative flex-1 bg-gray-50/80"
            style={{
              backgroundImage: `radial-gradient(${CANVAS_DOT} 1px, transparent 1px)`,
              backgroundSize: '10px 10px',
            }}
          >
            <div className="absolute top-1/2 left-1/4 w-8 h-4 bg-blue-400 rounded-sm border border-blue-500 opacity-80 transform -translate-y-1/2" />
            <div className="absolute top-1/2 left-1/2 w-8 h-4 bg-purple-400 rounded-sm border border-purple-500 opacity-80 transform -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute top-1/2 right-1/4 w-8 h-4 bg-indigo-400 rounded-sm border border-indigo-500 opacity-80 transform -translate-y-1/2" />
            <div className="absolute top-1/2 left-1/2 w-24 h-16 border-[1.5px] border-red-500 transform -translate-x-1/2 -translate-y-1/2 bg-red-500/10 rounded" />
          </div>
        </div>
      )}

      <div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center bg-white rounded-full shadow-lg border border-gray-100 p-1.5 gap-1 z-30 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onMouseDown={onOpenToolbarMenu}
          className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors mr-2"
        >
          <PlusCircle className="w-4 h-4" /> 添加节点
        </button>
        <TooltipButton text="添加注释" onMouseDown={onAddNote}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h8" />
          </svg>
        </TooltipButton>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <TooltipButton text="撤销" disabled={!canUndo} onMouseDown={onUndo}>
          <Undo2 className="w-5 h-5" />
        </TooltipButton>
        <TooltipButton text="重做" disabled={!canRedo} onMouseDown={onRedo}>
          <Redo2 className="w-5 h-5" />
        </TooltipButton>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <div className="flex items-center px-2 gap-3 text-gray-600">
          <button type="button" className="hover:text-gray-900" onMouseDown={() => onZoomChange(-0.1)}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
            </svg>
          </button>
          <span className="text-sm font-medium select-none w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button type="button" className="hover:text-gray-900" onMouseDown={() => onZoomChange(0.1)}>
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <TooltipButton text="优化布局" onMouseDown={onOptimizeLayout}>
          <Layout className="w-5 h-5" />
        </TooltipButton>
        <div className="relative flex items-center justify-center">
          <TooltipButton
            text="快速定位"
            onMouseDown={onLocateToggle}
            className={isLocateOpen ? 'bg-gray-100' : ''}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </TooltipButton>
          {isLocateOpen && (
            <div
              className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="p-2 border-b border-gray-100 bg-gray-50 flex items-center px-3">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索节点..."
                  className="w-full bg-transparent text-sm ml-2 outline-none"
                  value={searchNodeText}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
              </div>
              <div className="max-h-48 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {filteredNodes.map((node) => (
                  <div
                    key={node.id}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      onCenterNode(node.id);
                    }}
                    className="px-4 py-2 hover:bg-indigo-50 cursor-pointer text-sm text-gray-700 flex items-center justify-between border-b border-gray-50 last:border-0"
                  >
                    <span className="truncate">{node.name || node.type}</span>
                    <span className="text-xs text-gray-400 shrink-0 ml-2">
                      {(node.id.split('_')[1] || '').slice(-4)}
                    </span>
                  </div>
                ))}
                {filteredNodes.length === 0 && (
                  <div className="p-4 text-center text-xs text-gray-400">无匹配节点</div>
                )}
              </div>
            </div>
          )}
        </div>
        <TooltipButton
          text="缩略图"
          onMouseDown={onMinimapToggle}
          className={isMinimapVisible ? 'text-indigo-600 bg-indigo-50' : ''}
        >
          <div className="w-4 h-4 border-2 border-current rounded-sm" />
        </TooltipButton>
      </div>
    </div>
  );
}