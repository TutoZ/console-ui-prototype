import React, { useEffect, useRef, useState } from 'react';
import { Copy, GripVertical, Minus } from '@/lib/icons';
import { cn } from '@/lib/utils';
import {
  BRANCH_COMPARE_OPS,
  BRANCH_OPS_WITHOUT_RIGHT,
  branchGroupPriorityLabel,
  createBranchCondition,
  getConfigurableBranchGroups,
  getOrderedBranchGroups,
  MAX_BRANCH_CONDITIONS,
  MAX_BRANCH_RULE_GROUPS,
} from './workflowConstants';
import type {
  BranchCompareOp,
  BranchJoinLogic,
  BranchRightMode,
  WorkflowBranchCondition,
  WorkflowBranchConfig,
  WorkflowBranchGroup,
} from './workflowTypes';
import { WorkflowVarPicker } from './WorkflowVarPicker';
import { InfoTooltip } from './workflowUi';

type VarPickerTarget = {
  groupId: string;
  condId: string;
  side: 'left' | 'right';
};

type WorkflowBranchConfigFormProps = {
  config: WorkflowBranchConfig;
  onChange: (next: WorkflowBranchConfig) => void;
};

const RIGHT_MODES: BranchRightMode[] = ['输入', '引用', '枚举'];
const ENUM_OPTIONS = ['成功', '失败', '超时', '未知'];

function SelectField({
  value,
  placeholder,
  invalid,
  active,
  onClick,
  className,
}: {
  value: string;
  placeholder: string;
  invalid?: boolean;
  active?: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full h-8 px-2.5 rounded-md border bg-neutral-50 text-left text-[13px] flex items-center justify-between gap-1 cursor-pointer transition',
        active
          ? 'border-live ring-1 ring-sky-200 bg-white'
          : invalid
            ? 'border-destructive'
            : 'border-neutral-200 hover:border-neutral-300',
        className,
      )}
    >
      <span className={cn('truncate', value ? 'text-neutral-800' : 'text-neutral-400')}>
        {value || placeholder}
      </span>
      <svg className="w-3.5 h-3.5 text-neutral-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}

export function WorkflowBranchConfigForm({ config, onChange }: WorkflowBranchConfigFormProps) {
  const [varPicker, setVarPicker] = useState<VarPickerTarget | null>(null);
  const [modeOpenFor, setModeOpenFor] = useState<string | null>(null);
  const [dragGroupId, setDragGroupId] = useState<string | null>(null);
  const [dropOverId, setDropOverId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const ordered = getOrderedBranchGroups(config);
  const configurable = getConfigurableBranchGroups(config);
  const canAddGroup = configurable.length < MAX_BRANCH_RULE_GROUPS;
  const elseIfGroups = configurable.filter((g) => g.kind === '否则如果');

  useEffect(() => {
    if (!varPicker && !modeOpenFor) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setVarPicker(null);
        setModeOpenFor(null);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [varPicker, modeOpenFor]);

  const patchGroups = (groups: WorkflowBranchGroup[]) => onChange({ groups });

  const updateGroup = (groupId: string, patch: Partial<WorkflowBranchGroup>) => {
    patchGroups(config.groups.map((g) => (g.id === groupId ? { ...g, ...patch } : g)));
  };

  const updateCondition = (
    groupId: string,
    condId: string,
    patch: Partial<WorkflowBranchCondition>,
  ) => {
    const group = config.groups.find((g) => g.id === groupId);
    if (!group) return;
    updateGroup(groupId, {
      conditions: group.conditions.map((c) =>
        c.id === condId ? { ...c, rightMode: c.rightMode ?? '引用', ...patch } : c,
      ),
    });
  };

  const addElseIfGroup = () => {
    if (!canAddGroup) return;
    const elseIdx = config.groups.findIndex((g) => g.kind === '否则');
    const next: WorkflowBranchGroup = {
      id: `bg_elif_${Date.now()}`,
      kind: '否则如果',
      conditions: [createBranchCondition()],
    };
    const groups = [...config.groups];
    if (elseIdx >= 0) groups.splice(elseIdx, 0, next);
    else groups.push(next);
    patchGroups(groups);
  };

  const removeGroup = (groupId: string) => {
    const group = config.groups.find((g) => g.id === groupId);
    if (!group || group.kind !== '否则如果') return;
    patchGroups(config.groups.filter((g) => g.id !== groupId));
  };

  const duplicateGroup = (groupId: string) => {
    if (!canAddGroup) return;
    const group = config.groups.find((g) => g.id === groupId);
    if (!group || group.kind === '否则') return;
    const stamp = Date.now();
    const cloned: WorkflowBranchGroup = {
      id: `bg_elif_${stamp}`,
      kind: '否则如果',
      conditions: group.conditions.map((c, i) => ({
        ...c,
        id: `bc_${stamp}_${i}`,
        rightMode: c.rightMode ?? '引用',
      })),
    };
    const elseIdx = config.groups.findIndex((g) => g.kind === '否则');
    const groups = [...config.groups];
    if (elseIdx >= 0) groups.splice(elseIdx, 0, cloned);
    else groups.push(cloned);
    patchGroups(groups);
  };

  const reorderElseIf = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const ids = elseIfGroups.map((g) => g.id);
    const from = ids.indexOf(fromId);
    const to = ids.indexOf(toId);
    if (from < 0 || to < 0) return;
    const nextIds = [...ids];
    nextIds.splice(from, 1);
    nextIds.splice(to, 0, fromId);
    const ifGroup = config.groups.find((g) => g.kind === '如果');
    const elseGroup = config.groups.find((g) => g.kind === '否则');
    const map = new Map(elseIfGroups.map((g) => [g.id, g]));
    patchGroups([
      ...(ifGroup ? [ifGroup] : []),
      ...nextIds.map((id) => map.get(id)!).filter(Boolean),
      ...(elseGroup ? [elseGroup] : []),
    ]);
  };

  const addCondition = (groupId: string) => {
    const group = config.groups.find((g) => g.id === groupId);
    if (!group || group.kind === '否则') return;
    if (group.conditions.length >= MAX_BRANCH_CONDITIONS) return;
    updateGroup(groupId, {
      conditions: [...group.conditions, createBranchCondition()],
    });
  };

  const removeCondition = (groupId: string, condId: string) => {
    const group = config.groups.find((g) => g.id === groupId);
    if (!group || group.conditions.length <= 1) return;
    updateGroup(groupId, {
      conditions: group.conditions.filter((c) => c.id !== condId),
    });
  };

  return (
    <div ref={rootRef} className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 font-semibold text-[13px] text-neutral-800">
          规则设置 <InfoTooltip text="规则组按优先级从上到下判断，命中即停；组内条件用「或 / 且」组合。" />
        </div>
        <button
          type="button"
          disabled={!canAddGroup}
          onClick={addElseIfGroup}
          className={cn(
            'text-[13px] font-medium cursor-pointer',
            canAddGroup ? 'text-live hover:opacity-80' : 'text-neutral-300 cursor-not-allowed',
          )}
        >
          + 添加规则组
        </button>
      </div>

      <div className="space-y-2.5">
        {ordered.map((group) => {
          const priority = branchGroupPriorityLabel(group, configurable);
          const canDrag = group.kind === '否则如果';
          const canDeleteGroup = group.kind === '否则如果';

          if (group.kind === '否则') {
            return (
              <div
                key={group.id}
                className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-[13px] font-medium text-neutral-600"
              >
                否则
                <span className="ml-2 text-[11px] font-normal text-neutral-400">兜底分支</span>
              </div>
            );
          }

          return (
            <div
              key={group.id}
              onDragOver={(e) => {
                if (!canDrag || !dragGroupId) return;
                e.preventDefault();
                setDropOverId(group.id);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (!canDrag || !dragGroupId) return;
                reorderElseIf(dragGroupId, group.id);
                setDragGroupId(null);
                setDropOverId(null);
              }}
              className={cn(
                'rounded-lg border bg-white overflow-hidden transition',
                dropOverId === group.id && dragGroupId !== group.id
                  ? 'border-live ring-1 ring-sky-200'
                  : 'border-neutral-200',
                dragGroupId === group.id && 'opacity-60',
              )}
            >
              <div className="flex items-center gap-1.5 px-2.5 py-2 bg-neutral-50 border-b border-neutral-100">
                <span
                  draggable={canDrag}
                  title={canDrag ? '拖拽调整优先级' : undefined}
                  onDragStart={(e) => {
                    if (!canDrag) {
                      e.preventDefault();
                      return;
                    }
                    setDragGroupId(group.id);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragEnd={() => {
                    setDragGroupId(null);
                    setDropOverId(null);
                  }}
                  className={cn(
                    'shrink-0 p-0.5 text-neutral-300',
                    canDrag ? 'cursor-grab active:cursor-grabbing hover:text-neutral-500' : 'cursor-default',
                  )}
                >
                  <GripVertical className="w-3.5 h-3.5" />
                </span>
                <span className="text-[13px] font-semibold text-neutral-800">{group.kind}</span>
                {priority ? (
                  <span className="text-[11px] font-medium text-live bg-sky-50 px-1.5 py-0.5 rounded">
                    {priority.replace('优先级 ', '优先级')}
                  </span>
                ) : null}
                <div className="flex-1" />
                <button
                  type="button"
                  title="复制规则组"
                  disabled={!canAddGroup}
                  onClick={() => duplicateGroup(group.id)}
                  className="h-7 w-7 rounded-md flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-white cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={!canDeleteGroup}
                  title={canDeleteGroup ? '删除规则组' : '默认规则组不可删除'}
                  onClick={() => canDeleteGroup && removeGroup(group.id)}
                  className={cn(
                    'h-7 w-7 rounded-md flex items-center justify-center',
                    canDeleteGroup
                      ? 'text-neutral-400 hover:text-neutral-700 hover:bg-white cursor-pointer'
                      : 'text-neutral-200 cursor-not-allowed',
                  )}
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>

              <div className="p-2.5">
                <div className="relative flex flex-col gap-0">
                  {group.conditions.map((cond, idx) => {
                    const hideRight = BRANCH_OPS_WITHOUT_RIGHT.includes(cond.operator);
                    const mode = cond.rightMode ?? '引用';
                    const leftInvalid = !cond.left.trim();
                    const rightInvalid = !hideRight && !cond.right.trim();
                    const leftActive =
                      varPicker?.groupId === group.id &&
                      varPicker.condId === cond.id &&
                      varPicker.side === 'left';
                    const rightActive =
                      varPicker?.groupId === group.id &&
                      varPicker.condId === cond.id &&
                      varPicker.side === 'right';
                    const showJoin = idx < group.conditions.length - 1;
                    const canRemoveCond = group.conditions.length > 1;
                    const showLogicRail = group.conditions.length > 1;

                    return (
                      <div key={cond.id} className="relative flex gap-2">
                        {showLogicRail ? (
                          <div className="w-9 shrink-0 relative flex flex-col items-center">
                            {idx > 0 ? (
                              <div className="absolute top-0 bottom-1/2 left-1/2 w-px -translate-x-1/2 bg-neutral-200" />
                            ) : null}
                            {showJoin ? (
                              <>
                                <div className="absolute top-1/2 bottom-0 left-1/2 w-px -translate-x-1/2 bg-neutral-200" />
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-[1]">
                                  <select
                                    value={cond.joinNext}
                                    onChange={(e) =>
                                      updateCondition(group.id, cond.id, {
                                        joinNext: e.target.value as BranchJoinLogic,
                                      })
                                    }
                                    className="h-6 min-w-[36px] rounded border border-neutral-200 bg-white px-1 text-[11px] text-neutral-700 outline-none cursor-pointer shadow-sm"
                                  >
                                    <option value="或">或</option>
                                    <option value="且">且</option>
                                  </select>
                                </div>
                              </>
                            ) : null}
                          </div>
                        ) : null}

                        <div className={cn('flex-1 min-w-0 pb-3', showJoin && 'pb-5')}>
                          <div className="relative space-y-1.5">
                            <div className="relative">
                              <SelectField
                                value={cond.left}
                                placeholder="请选择"
                                invalid={leftInvalid}
                                active={leftActive}
                                onClick={() => {
                                  setModeOpenFor(null);
                                  setVarPicker(
                                    leftActive
                                      ? null
                                      : { groupId: group.id, condId: cond.id, side: 'left' },
                                  );
                                }}
                              />
                              {leftInvalid ? (
                                <div className="text-destructive text-[11px] mt-0.5">请选择</div>
                              ) : null}
                              {leftActive ? (
                                <div className="absolute left-0 right-0 top-full mt-1 z-50">
                                  <WorkflowVarPicker
                                    mode="branch"
                                    onPick={(key) => {
                                      updateCondition(group.id, cond.id, { left: key });
                                      setVarPicker(null);
                                    }}
                                  />
                                </div>
                              ) : null}
                            </div>

                            <div className="flex items-start gap-1.5">
                              <div className="flex-1 min-w-0">
                                <select
                                  value={cond.operator}
                                  onChange={(e) =>
                                    updateCondition(group.id, cond.id, {
                                      operator: e.target.value as BranchCompareOp,
                                    })
                                  }
                                  className="w-full h-8 rounded-md border border-neutral-200 bg-neutral-50 px-2 text-[13px] text-neutral-700 outline-none cursor-pointer"
                                >
                                  {BRANCH_COMPARE_OPS.map((op) => (
                                    <option key={op} value={op}>
                                      {op}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              {canRemoveCond ? (
                                <button
                                  type="button"
                                  title="删除条件"
                                  onClick={() => removeCondition(group.id, cond.id)}
                                  className="h-8 w-8 shrink-0 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 cursor-pointer"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                              ) : null}
                            </div>

                            {!hideRight ? (
                              <div className="flex items-start gap-1.5 relative">
                                <div className="relative w-[72px] shrink-0">
                                  <SelectField
                                    value={mode}
                                    placeholder="引用"
                                    active={modeOpenFor === cond.id}
                                    onClick={() => {
                                      setVarPicker(null);
                                      setModeOpenFor(modeOpenFor === cond.id ? null : cond.id);
                                    }}
                                  />
                                  {modeOpenFor === cond.id ? (
                                    <div className="absolute left-0 top-full mt-1 z-50 w-[88px] rounded-md border border-neutral-200 bg-white shadow-lg overflow-hidden py-0.5">
                                      {RIGHT_MODES.map((m) => (
                                        <button
                                          key={m}
                                          type="button"
                                          onClick={() => {
                                            updateCondition(group.id, cond.id, {
                                              rightMode: m,
                                              right: m === mode ? cond.right : '',
                                            });
                                            setModeOpenFor(null);
                                          }}
                                          className={cn(
                                            'w-full px-2.5 py-1.5 text-left text-[12px] cursor-pointer',
                                            m === mode
                                              ? 'bg-sky-50 text-live'
                                              : 'text-neutral-700 hover:bg-neutral-50',
                                          )}
                                        >
                                          {m}
                                        </button>
                                      ))}
                                    </div>
                                  ) : null}
                                </div>

                                <div className="flex-1 min-w-0 relative">
                                  {mode === '输入' ? (
                                    <input
                                      type="text"
                                      value={cond.right}
                                      onChange={(e) =>
                                        updateCondition(group.id, cond.id, { right: e.target.value })
                                      }
                                      placeholder="请输入"
                                      className={cn(
                                        'w-full h-8 px-2.5 rounded-md border bg-neutral-50 text-[13px] outline-none',
                                        rightInvalid
                                          ? 'border-destructive'
                                          : 'border-neutral-200 focus:border-live',
                                      )}
                                    />
                                  ) : mode === '枚举' ? (
                                    <select
                                      value={cond.right}
                                      onChange={(e) =>
                                        updateCondition(group.id, cond.id, { right: e.target.value })
                                      }
                                      className={cn(
                                        'w-full h-8 px-2 rounded-md border bg-neutral-50 text-[13px] outline-none cursor-pointer',
                                        rightInvalid ? 'border-destructive' : 'border-neutral-200',
                                      )}
                                    >
                                      <option value="">请选择</option>
                                      {ENUM_OPTIONS.map((o) => (
                                        <option key={o} value={o}>
                                          {o}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <>
                                      <SelectField
                                        value={cond.right}
                                        placeholder="请选择"
                                        invalid={rightInvalid}
                                        active={rightActive}
                                        onClick={() => {
                                          setModeOpenFor(null);
                                          setVarPicker(
                                            rightActive
                                              ? null
                                              : {
                                                  groupId: group.id,
                                                  condId: cond.id,
                                                  side: 'right',
                                                },
                                          );
                                        }}
                                      />
                                      {rightActive ? (
                                        <div className="absolute left-0 right-0 top-full mt-1 z-50">
                                          <WorkflowVarPicker
                                            mode="branch"
                                            onPick={(key) => {
                                              updateCondition(group.id, cond.id, { right: key });
                                              setVarPicker(null);
                                            }}
                                          />
                                        </div>
                                      ) : null}
                                    </>
                                  )}
                                  {rightInvalid ? (
                                    <div className="text-destructive text-[11px] mt-0.5">请选择</div>
                                  ) : null}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={group.conditions.length >= MAX_BRANCH_CONDITIONS}
                  onClick={() => addCondition(group.id)}
                  className={cn(
                    'mt-0.5 text-[13px] font-medium',
                    group.conditions.length > 1 && 'ml-9',
                    group.conditions.length >= MAX_BRANCH_CONDITIONS
                      ? 'text-neutral-300 cursor-not-allowed'
                      : 'text-live hover:opacity-80 cursor-pointer',
                  )}
                >
                  + 添加
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
