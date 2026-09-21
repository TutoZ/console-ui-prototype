/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 号码管理主视图（精准对齐设计图 Image 1 & Image 2）
 */

import React, { useState, useMemo } from 'react';
import {
  RefreshCw,
  Plus,
  Search,
  Check,
  Phone,
} from '@/lib/icons';
import { useApp } from '@/src/context/AppContext';
import { HotlinePhoneNumberItem } from './numberManagementTypes';
import { INITIAL_PHONE_NUMBERS, VOICE_AGENT_OPTIONS } from './numberManagementMockData';
import { BindAgentModal } from './BindAgentModal';
import { ApplyNumberModal } from './ApplyNumberModal';

interface NumberManagementViewProps {
  embedded?: boolean;
}

export const NumberManagementView: React.FC<NumberManagementViewProps> = ({ embedded = false }) => {
  const { showToast, hiredAgents } = useApp();

  // 原始号码数据
  const [numbersList, setNumbersList] = useState<HotlinePhoneNumberItem[]>(INITIAL_PHONE_NUMBERS);

  // 筛选条件
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyUnbound, setOnlyUnbound] = useState<boolean>(false);

  // 提交后的有效筛选（支持点击“查询”按钮或即时输入）
  const [appliedFilters, setAppliedFilters] = useState({
    agent: 'all',
    query: '',
    onlyUnbound: false,
  });

  // 多选选中的行 ID
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  // 弹窗状态
  const [bindModalOpen, setBindModalOpen] = useState(false);
  const [bindTargetItems, setBindTargetItems] = useState<HotlinePhoneNumberItem[]>([]);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 动态聚合系统内可用智能体列表（包含 Mock 中的语音智能体与用户已雇佣智能体）
  const combinedAgentOptions = useMemo(() => {
    const list = [...VOICE_AGENT_OPTIONS];
    if (hiredAgents && hiredAgents.length > 0) {
      hiredAgents.forEach((ag) => {
        if (!list.some((item) => item.name === ag.name)) {
          list.push({
            id: ag.id,
            name: ag.name,
            modelBadge: '已上线',
          });
        }
      });
    }
    return list;
  }, [hiredAgents]);

  // 执行查询按钮
  const handleApplySearch = () => {
    setAppliedFilters({
      agent: selectedAgentFilter,
      query: searchQuery.trim(),
      onlyUnbound: onlyUnbound,
    });
  };

  // 重置筛选
  const handleResetFilters = () => {
    setSelectedAgentFilter('all');
    setSearchQuery('');
    setOnlyUnbound(false);
    setAppliedFilters({
      agent: 'all',
      query: '',
      onlyUnbound: false,
    });
    showToast('已重置筛选条件');
  };

  // 过滤后的号码列表
  const filteredNumbers = useMemo(() => {
    return numbersList.filter((item) => {
      // 1. 智能体筛选
      if (appliedFilters.agent !== 'all') {
        if (appliedFilters.agent === '__unbound__') {
          if (item.boundAgent !== null) return false;
        } else if (item.boundAgent !== appliedFilters.agent) {
          return false;
        }
      }

      // 2. 只查看未绑定
      if (appliedFilters.onlyUnbound) {
        if (item.boundAgent !== null) return false;
      }

      // 3. 号码搜索（完整号码或尾号模糊匹配）
      if (appliedFilters.query) {
        const cleanQ = appliedFilters.query.replace(/\s+/g, '');
        const cleanNum = item.phoneNumber.replace(/\s+/g, '');
        if (!cleanNum.includes(cleanQ)) {
          return false;
        }
      }

      return true;
    });
  }, [numbersList, appliedFilters]);

  // 全选 / 取消全选
  const isAllSelected =
    filteredNumbers.length > 0 &&
    filteredNumbers.every((item) => selectedRowIds.has(item.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedRowIds(new Set());
    } else {
      const allIds = new Set(filteredNumbers.map((i) => i.id));
      setSelectedRowIds(allIds);
    }
  };

  const handleToggleRow = (id: string) => {
    const next = new Set(selectedRowIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedRowIds(next);
  };

  // 刷新号码列表
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast(`号码列表已刷新，共 ${numbersList.length} 个号码`);
    }, 450);
  };

  // 单行点击“更换绑定”或“绑定”
  const handleOpenSingleBind = (item: HotlinePhoneNumberItem) => {
    setBindTargetItems([item]);
    setBindModalOpen(true);
  };

  // 批量绑定
  const handleOpenBatchBind = () => {
    const targets = numbersList.filter((item) => selectedRowIds.has(item.id));
    if (targets.length === 0) return;
    setBindTargetItems(targets);
    setBindModalOpen(true);
  };

  // 绑定保存回调
  const handleConfirmBind = (itemIds: string[], agentName: string | null, remark?: string) => {
    setNumbersList((prev) =>
      prev.map((item) => {
        if (itemIds.includes(item.id)) {
          return {
            ...item,
            boundAgent: agentName,
            ...(remark !== undefined ? { remark } : {}),
            updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
          };
        }
        return item;
      })
    );

    setSelectedRowIds(new Set());

    if (itemIds.length === 1) {
      const target = numbersList.find((i) => i.id === itemIds[0]);
      if (agentName) {
        showToast(`已成功将 ${target?.phoneNumber} 绑定至 ${agentName}`);
      } else {
        showToast(`已解除 ${target?.phoneNumber} 的智能体绑定`);
      }
    } else {
      if (agentName) {
        showToast(`已成功将选中的 ${itemIds.length} 个号码批量绑定至 ${agentName}`);
      } else {
        showToast(`已成功解除选中的 ${itemIds.length} 个号码的智能体绑定`);
      }
    }
  };

  // 申请新号码成功
  const handleApplySuccess = (newNumber: HotlinePhoneNumberItem) => {
    setNumbersList((prev) => [newNumber, ...prev]);
    showToast(`新号码 ${newNumber.phoneNumber} 已申请并接入成功`);
  };

  return (
    <div className="w-full space-y-4 font-sans text-neutral-800">
      {/* 顶部面包屑（若非嵌入模式显示） */}
      {!embedded && (
        <div className="flex items-center gap-1.5 text-xs text-neutral-400 py-0.5">
          <span className="hover:text-neutral-600 transition-colors">热线客服</span>
          <span>/</span>
          <span className="text-neutral-700 font-medium">号码管理</span>
        </div>
      )}

      {/* 顶部筛选卡片（对齐 Image 1 顶部筛选区） */}
      <div className="bg-white rounded-xl border border-neutral-200/80 p-5 shadow-2xs transition-all">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6">
            {/* 绑定智能体 */}
            <div className="min-w-[200px]">
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                绑定智能体
              </label>
              <div className="relative">
                <select
                  value={selectedAgentFilter}
                  onChange={(e) => {
                    setSelectedAgentFilter(e.target.value);
                  }}
                  className="w-full h-9 px-3.5 pr-8 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer appearance-none"
                >
                  <option value="all">全部智能体</option>
                  <option value="__unbound__">未绑定智能体</option>
                  {combinedAgentOptions.map((ag) => (
                    <option key={ag.id} value={ag.name}>
                      {ag.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* 号码搜索 */}
            <div className="min-w-[240px]">
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                号码搜索
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleApplySearch();
                  }}
                  placeholder="请输入完整号码或尾号"
                  className="w-full h-9 px-3.5 pr-8 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-neutral-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* 只查看未绑定智能体的号码 Toggle Switch */}
            <div className="flex items-center gap-2.5 pt-5 select-none cursor-pointer" onClick={() => setOnlyUnbound(!onlyUnbound)}>
              <div
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  onlyUnbound ? 'bg-blue-600' : 'bg-neutral-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    onlyUnbound ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </div>
              <span className="text-xs text-neutral-600 font-normal">
                只查看未绑定智能体的号码
              </span>
            </div>
          </div>

          {/* 右侧重置与查询按钮 */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleResetFilters}
              className="h-9 px-4 text-xs font-medium text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 hover:text-neutral-800 transition-colors shadow-2xs cursor-pointer"
            >
              重置
            </button>
            <button
              type="button"
              onClick={handleApplySearch}
              className="h-9 px-5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-2xs shadow-blue-500/20 cursor-pointer"
            >
              查询
            </button>
          </div>
        </div>
      </div>

      {/* 号码列表主体卡片 */}
      <div className="bg-white rounded-xl border border-neutral-200/80 p-5 shadow-2xs">
        {/* 列表头部操作栏 */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-neutral-900">号码列表</span>
            <span className="text-xs text-neutral-400">
              共 {filteredNumbers.length} 个号码
            </span>
            {selectedRowIds.size > 0 && (
              <span className="text-xs text-blue-600 font-medium ml-2">
                (已选中 {selectedRowIds.size} 项)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {/* 刷新号码列表 */}
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 hover:text-neutral-800 transition-colors cursor-pointer"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
              <span>刷新号码列表</span>
            </button>

            {/* 申请号码 */}
            <button
              type="button"
              onClick={() => setApplyModalOpen(true)}
              className="inline-flex items-center gap-1.5 h-8 px-3.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-2xs shadow-blue-500/20 cursor-pointer"
            >
              <Plus size={14} />
              <span>申请号码</span>
            </button>

            {/* 批量绑定 */}
            <button
              type="button"
              disabled={selectedRowIds.size === 0}
              onClick={handleOpenBatchBind}
              className={`inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg transition-colors ${
                selectedRowIds.size > 0
                  ? 'border border-blue-600 text-blue-600 hover:bg-blue-50 cursor-pointer'
                  : 'border border-neutral-200 bg-neutral-50 text-neutral-300 cursor-not-allowed'
              }`}
            >
              <span>批量绑定</span>
            </button>
          </div>
        </div>

        {/* 表格 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-100 text-neutral-500 text-[11px] font-medium">
                <th className="py-3.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                  />
                </th>
                <th className="py-3.5 px-4 font-normal text-neutral-500">区号</th>
                <th className="py-3.5 px-4 font-normal text-neutral-500">号码</th>
                <th className="py-3.5 px-4 font-normal text-neutral-500">绑定智能体</th>
                <th className="py-3.5 px-4 font-normal text-neutral-500">备注</th>
                <th className="py-3.5 px-4 font-normal text-neutral-500 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {filteredNumbers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search size={28} className="text-neutral-300 stroke-1" />
                      <span>未找到符合条件的号码</span>
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="mt-1 text-xs text-blue-600 hover:underline cursor-pointer"
                      >
                        清空筛选条件
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredNumbers.map((row) => {
                  const isChecked = selectedRowIds.has(row.id);
                  const isBound = Boolean(row.boundAgent);

                  return (
                    <tr
                      key={row.id}
                      className={`hover:bg-neutral-50/70 transition-colors group ${
                        isChecked ? 'bg-blue-50/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleRow(row.id)}
                          className="w-4 h-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                        />
                      </td>

                      {/* 区号 */}
                      <td className="py-3.5 px-4 font-mono text-neutral-700">
                        {row.areaCode}
                      </td>

                      {/* 号码 (蓝色高亮可点击) */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleOpenSingleBind(row)}
                          className="font-mono font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition-colors"
                          title="点击更换绑定"
                        >
                          {row.phoneNumber}
                        </button>
                      </td>

                      {/* 绑定智能体 */}
                      <td className="py-3.5 px-4">
                        {isBound ? (
                          <span className="font-medium text-neutral-800">
                            {row.boundAgent}
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-normal bg-neutral-100 text-neutral-400">
                            未绑定
                          </span>
                        )}
                      </td>

                      {/* 备注 */}
                      <td className="py-3.5 px-4 text-neutral-600">
                        {row.remark || '—'}
                      </td>

                      {/* 操作 */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenSingleBind(row)}
                          className="text-blue-600 hover:text-blue-700 font-medium hover:underline cursor-pointer text-xs transition-colors"
                        >
                          {isBound ? '更换绑定' : '绑定'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 更换绑定 / 绑定智能体弹窗 (对齐 Image 2) */}
      <BindAgentModal
        open={bindModalOpen}
        onClose={() => setBindModalOpen(false)}
        targetItems={bindTargetItems}
        onConfirm={handleConfirmBind}
        availableAgents={combinedAgentOptions}
      />

      {/* 申请号码弹窗 */}
      <ApplyNumberModal
        open={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        onSuccess={handleApplySuccess}
        availableAgents={combinedAgentOptions}
      />
    </div>
  );
};
