import type {
  CanvasEdge,
  CanvasNode,
  CanvasNote,
  CanvasSnapshot,
  ValidationError,
  WorkflowBranchConfig,
  WorkflowBranchGroup,
} from './workflowTypes';
import {
  BRANCH_OPS_WITHOUT_RIGHT,
  createDefaultBranchConfig,
  getKbQueryValue,
  getOrderedBranchGroups,
  normalizeKbConfig,
} from './workflowConstants';

export const NODE_WIDTH = 240;
export const BRANCH_NODE_WIDTH = 288;
export const NODE_HEIGHT = 80;

export function getNodeWidth(node: CanvasNode): number {
  return node.type === '条件分支' ? BRANCH_NODE_WIDTH : NODE_WIDTH;
}

/** 估算条件分支各规则组相对节点顶部的出口中心 Y */
export function getBranchHandleCenters(config: WorkflowBranchConfig): {
  id: string;
  y: number;
}[] {
  const HEADER = 48;
  const GAP = 10;
  const PAD_Y = 10;
  let cursor = HEADER + PAD_Y;
  const result: { id: string; y: number }[] = [];

  getOrderedBranchGroups(config).forEach((group) => {
    const h = estimateBranchGroupHeight(group);
    result.push({ id: group.id, y: cursor + h / 2 });
    cursor += h + GAP;
  });

  return result;
}

function estimateBranchGroupHeight(group: WorkflowBranchGroup): number {
  if (group.kind === '否则') return 40;
  const n = Math.max(1, group.conditions.length);
  const rowH = 28;
  const joinH = 14;
  const boxPad = 14;
  return Math.max(40, boxPad + n * rowH + Math.max(0, n - 1) * joinH);
}

export function getEdgeSourcePoint(
  source: CanvasNode,
  sourceHandle?: string,
): { x: number; y: number } {
  const w = getNodeWidth(source);
  if (source.type === '条件分支' && sourceHandle) {
    const cfg = source.branchConfig ?? createDefaultBranchConfig();
    const centers = getBranchHandleCenters(cfg);
    const hit = centers.find((c) => c.id === sourceHandle);
    return { x: source.x + w, y: source.y + (hit?.y ?? 40) };
  }
  return { x: source.x + w, y: source.y + 40 };
}

/** 目标节点左侧入口（估算，优先用实测 port） */
export function getEdgeTargetPoint(target: CanvasNode): { x: number; y: number } {
  return { x: target.x, y: target.y + 40 };
}

export type PortOffset = { x: number; y: number };

export function resolveEdgePoints(
  source: CanvasNode,
  target: CanvasNode,
  sourceHandle: string | undefined,
  ports: Record<string, PortOffset>,
): { x1: number; y1: number; x2: number; y2: number } {
  const outKey = `${source.id}::${sourceHandle ?? 'out'}`;
  const inKey = `${target.id}::in`;
  const out = ports[outKey];
  const inn = ports[inKey];
  const sp = getEdgeSourcePoint(source, sourceHandle);
  const tp = getEdgeTargetPoint(target);
  return {
    x1: out ? source.x + out.x : sp.x,
    y1: out ? source.y + out.y : sp.y,
    x2: inn ? target.x + inn.x : tp.x,
    y2: inn ? target.y + inn.y : tp.y,
  };
}

export function getFormattedTime(): string {
  const date = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function createDefaultNodes(): CanvasNode[] {
  return [
    {
      id: 'node_start',
      type: '开始',
      x: 200,
      y: 300,
      desc: '定义工作流的全局输入变量',
    },
    {
      id: 'node_end',
      type: '结束',
      x: 700,
      y: 300,
      desc: '工作流的最终节点，用于返回工作流运行后的结果信息',
      endConfig: {
        streaming: true,
        parts: [{ id: 'endt_default', kind: 'text', text: '' }],
      },
    },
  ];
}

export function createDefaultArchives(): import('./workflowTypes').ArchiveItem[] {
  return [
    {
      id: '1786515187882',
      status: 'ACTIVE',
      time: '2026-08-12 14:13:07',
      nodes: [],
      edges: [],
      notes: [],
    },
    {
      id: '1786515175160',
      status: 'HISTORY',
      time: '2026-08-12 14:13:07',
      nodes: [],
      edges: [],
      notes: [],
    },
  ];
}

export function computeValidationErrors(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
): ValidationError[] {
  const errors: ValidationError[] = [];
  nodes.forEach((node) => {
    const hasIncoming = edges.some((e) => e.target === node.id);
    const hasOutgoing = edges.some((e) => e.source === node.id);

    if (node.type === '开始' && !hasOutgoing) {
      errors.push({ id: node.id, type: node.type, msg: '节点未连接完整' });
    } else if (node.type === '结束' && !hasIncoming) {
      errors.push({ id: node.id, type: node.type, msg: '节点未连接完整' });
    } else if (node.type === '条件分支') {
      if (!hasIncoming) {
        errors.push({ id: node.id, type: node.type, msg: '节点未连接完整' });
      }
    } else if (node.type !== '开始' && node.type !== '结束') {
      if (!hasIncoming || !hasOutgoing) {
        errors.push({ id: node.id, type: node.type, msg: '节点未连接完整' });
      }
    }

    if (node.type === '知识检索') {
      const kb = normalizeKbConfig(node.kbConfig);
      if (!getKbQueryValue(kb)) {
        errors.push({ id: node.id, type: node.type, msg: 'Query 参数值不可为空' });
      }
      if (!kb.selectedKbIds.length) {
        errors.push({ id: node.id, type: node.type, msg: '知识库不可为空' });
      }
    }

    if (node.type === '条件分支') {
      const cfg = node.branchConfig ?? createDefaultBranchConfig();
      const groups = getOrderedBranchGroups(cfg);
      groups.forEach((group) => {
        const linked = edges.some(
          (e) => e.source === node.id && e.sourceHandle === group.id,
        );
        if (!linked) {
          errors.push({
            id: node.id,
            type: node.type,
            msg: `「${group.kind}」分支未连接下游`,
          });
        }
        if (group.kind === '否则') return;
        group.conditions.forEach((cond, i) => {
          if (!cond.left.trim()) {
            errors.push({
              id: node.id,
              type: node.type,
              msg: `「${group.kind}」第 ${i + 1} 条条件左值不可为空`,
            });
          }
          const needRight = !BRANCH_OPS_WITHOUT_RIGHT.includes(cond.operator);
          if (needRight && !cond.right.trim()) {
            errors.push({
              id: node.id,
              type: node.type,
              msg: `「${group.kind}」第 ${i + 1} 条条件右值不可为空`,
            });
          }
        });
      });
    }
  });
  return errors;
}

/** 写入边时：同一 source+sourceHandle 仅保留一条 */
export function upsertCanvasEdge(
  edges: CanvasEdge[],
  edge: CanvasEdge,
): CanvasEdge[] {
  if (edge.sourceHandle) {
    return [
      ...edges.filter(
        (e) => !(e.source === edge.source && e.sourceHandle === edge.sourceHandle),
      ),
      edge,
    ];
  }
  return [...edges, edge];
}

export function optimizeNodeLayout(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
): CanvasNode[] {
  const adj: Record<string, string[]> = {};
  const inDegree: Record<string, number> = {};
  nodes.forEach((n) => {
    adj[n.id] = [];
    inDegree[n.id] = 0;
  });
  edges.forEach((e) => {
    if (adj[e.source]) adj[e.source].push(e.target);
    if (inDegree[e.target] !== undefined) inDegree[e.target]++;
  });

  const cols: Record<string, number> = {};
  nodes.forEach((n) => {
    cols[n.id] = 0;
  });

  let queue = nodes.filter((n) => inDegree[n.id] === 0).map((n) => n.id);
  if (queue.length === 0 && nodes.length > 0) queue = [nodes[0].id];

  let iters = 0;
  while (queue.length > 0 && iters < nodes.length * 3) {
    const u = queue.shift()!;
    iters++;
    (adj[u] || []).forEach((v) => {
      if (cols[v] < cols[u] + 1) {
        cols[v] = cols[u] + 1;
        queue.push(v);
      }
    });
  }

  const colGroups: Record<number, CanvasNode[]> = {};
  nodes.forEach((n) => {
    const c = cols[n.id] || 0;
    if (!colGroups[c]) colGroups[c] = [];
    colGroups[c].push(n);
  });

  return nodes.map((n) => {
    const c = cols[n.id] || 0;
    const group = colGroups[c];
    const r = group.findIndex((gn) => gn.id === n.id);
    const x = 150 + c * 380;
    const y = 300 + (r - (group.length - 1) / 2) * 160;
    return { ...n, x, y };
  });
}

export function getLayoutBounds(nodes: CanvasNode[]) {
  if (nodes.length === 0) return null;
  const minX = Math.min(...nodes.map((n) => n.x));
  const maxX = Math.max(...nodes.map((n) => n.x)) + NODE_WIDTH;
  const minY = Math.min(...nodes.map((n) => n.y));
  const maxY = Math.max(...nodes.map((n) => n.y)) + 100;
  return { minX, maxX, minY, maxY, centerX: (minX + maxX) / 2, centerY: (minY + maxY) / 2 };
}

export function snapshotOf(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  notes: CanvasNote[],
): CanvasSnapshot {
  return { nodes, edges, notes };
}
