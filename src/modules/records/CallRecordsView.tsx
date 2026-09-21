import React, { useState, useMemo } from 'react';
import {
  Search,
  RotateCcw,
  Headphones,
  ChevronRight,
  Copy,
  Download,
  Filter,
  Check,
  Calendar,
  Sparkles,
} from '@/lib/icons';
import { CallRecord, CallFilterState, HangupParty } from './callRecordsTypes';
import { INITIAL_CALL_RECORDS } from './callRecordsMockData';
import { CallDetailDrawer } from './CallDetailDrawer';
import { cn } from '@/lib/utils';
import { BTN_INK, BTN_SOFT } from '@/lib/ui';
import { useApp } from '../../context/AppContext';

export const CallRecordsView: React.FC<{
  embedded?: boolean;
}> = ({ embedded = false }) => {
  const { showToast } = useApp();

  // Local copy of call records to allow editing remarks/corrections in drawer
  const [calls, setCalls] = useState<CallRecord[]>(() => INITIAL_CALL_RECORDS);

  // Filter State
  const [filters, setFilters] = useState<CallFilterState>({
    timeQuickRange: 'today',
    dateFrom: '2026-08-09 00:00:00',
    dateTo: '2026-08-10 23:59:59',
    callIdQuery: '',
    phoneQuery: '',
    agentFilter: 'all',
    locationFilter: 'all',
    hangupPartyFilter: 'all',
    tagFilter: 'all',
  });

  // Applied filter state (updated on clicking "搜索" or "重置")
  const [appliedFilters, setAppliedFilters] = useState<CallFilterState>(filters);

  // Selected Call for Detail Drawer
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);

  // Quick Time Range Selection
  const handleQuickTimeRange = (range: CallFilterState['timeQuickRange']) => {
    let from = '2026-08-10 00:00:00';
    let to = '2026-08-10 23:59:59';
    if (range === 'yesterday') {
      from = '2026-08-09 00:00:00';
      to = '2026-08-09 23:59:59';
    } else if (range === 'week') {
      from = '2026-08-04 00:00:00';
      to = '2026-08-10 23:59:59';
    } else if (range === 'month') {
      from = '2026-07-11 00:00:00';
      to = '2026-08-10 23:59:59';
    }
    setFilters((prev) => ({
      ...prev,
      timeQuickRange: range,
      dateFrom: from,
      dateTo: to,
    }));
  };

  const handleSearch = () => {
    setAppliedFilters(filters);
    showToast('筛选结果已更新');
  };

  const handleReset = () => {
    const defaultFilters: CallFilterState = {
      timeQuickRange: 'today',
      dateFrom: '2026-08-09 00:00:00',
      dateTo: '2026-08-10 23:59:59',
      callIdQuery: '',
      phoneQuery: '',
      agentFilter: 'all',
      locationFilter: 'all',
      hangupPartyFilter: 'all',
      tagFilter: 'all',
    };
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    showToast('筛选条件已重置');
  };

  // Filter computation
  const filteredCalls = useMemo(() => {
    return calls.filter((item) => {
      if (appliedFilters.callIdQuery.trim()) {
        const q = appliedFilters.callIdQuery.trim().toLowerCase();
        if (!item.id.toLowerCase().includes(q)) return false;
      }
      if (appliedFilters.phoneQuery.trim()) {
        const q = appliedFilters.phoneQuery.trim();
        if (!item.customerPhone.includes(q)) return false;
      }
      if (appliedFilters.agentFilter !== 'all') {
        if (item.agentName !== appliedFilters.agentFilter) return false;
      }
      if (appliedFilters.locationFilter !== 'all') {
        if (item.location !== appliedFilters.locationFilter) return false;
      }
      if (appliedFilters.hangupPartyFilter !== 'all') {
        if (item.hangupParty !== appliedFilters.hangupPartyFilter) return false;
      }
      if (appliedFilters.tagFilter !== 'all') {
        if (!item.tags.includes(appliedFilters.tagFilter)) return false;
      }
      return true;
    });
  }, [calls, appliedFilters]);

  // Options extracted from data
  const agentOptions = useMemo(() => {
    const list = Array.from(new Set(calls.map((c) => c.agentName)));
    return ['all', ...list];
  }, [calls]);

  const locationOptions = useMemo(() => {
    const list = Array.from(new Set(calls.map((c) => c.location)));
    return ['all', ...list];
  }, [calls]);

  const hangupOptions: (HangupParty | 'all')[] = [
    'all',
    '客户挂断',
    '坐席挂断',
    '系统挂断',
    '数字员工挂断',
  ];

  const tagOptions = [
    'all',
    '配送预约',
    '故障配送',
    '冰箱排查',
    '发票开具',
    '企业采购',
    '高意向',
    '日期确认',
  ];

  // Drawer Navigation
  const currentInspectIndex = useMemo(() => {
    if (!selectedCallId) return -1;
    return filteredCalls.findIndex((c) => c.id === selectedCallId);
  }, [filteredCalls, selectedCallId]);

  const activeCall = currentInspectIndex >= 0 ? filteredCalls[currentInspectIndex] : null;

  const handlePrevCall = () => {
    if (currentInspectIndex > 0) {
      setSelectedCallId(filteredCalls[currentInspectIndex - 1].id);
    }
  };

  const handleNextCall = () => {
    if (currentInspectIndex < filteredCalls.length - 1) {
      setSelectedCallId(filteredCalls[currentInspectIndex + 1].id);
    }
  };

  const handleUpdateCall = (updated: CallRecord) => {
    setCalls((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const copyCallId = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(id);
      showToast(`已复制 Call ID: ${id}`);
    } catch {
      showToast(`Call ID: ${id}`);
    }
  };

  // Hangup party badge styling
  const renderHangupBadge = (party: HangupParty) => {
    switch (party) {
      case '客户挂断':
        return (
          <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-medium">
            客户挂断
          </span>
        );
      case '坐席挂断':
        return (
          <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/80 font-medium">
            坐席挂断
          </span>
        );
      case '系统挂断':
        return (
          <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 font-medium">
            系统挂断
          </span>
        );
      case '数字员工挂断':
        return (
          <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-medium">
            数字员工挂断
          </span>
        );
      default:
        return <span>{party}</span>;
    }
  };

  return (
    <div className={cn('space-y-4', embedded ? 'p-0' : 'p-6 max-w-[1600px] mx-auto')}>
      {/* 1. Page Header (Icon + Title + Description) */}
      {!embedded && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Headphones size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-neutral-900 tracking-tight flex items-center gap-2">
                呼叫记录
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200">
                  接待记录
                </span>
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                支持查看多维度呼叫明细与深度质检复盘，提供完整对话还原与音频核对能力
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Filter Box (实时筛选) */}
      <div className="bg-white rounded-xl border border-neutral-200/90 p-4 shadow-xs space-y-3.5">
        <div className="flex items-center gap-2 pb-2.5 border-b border-neutral-100">
          <Filter size={14} className="text-blue-600" />
          <span className="text-xs font-bold text-neutral-800 tracking-tight">实时筛选</span>
        </div>

        {/* Filter Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 呼入时间段 */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-700 mb-1.5">
              呼入时间段
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(
                [
                  { id: 'today', label: '今天' },
                  { id: 'yesterday', label: '昨天' },
                  { id: 'week', label: '最近7天' },
                  { id: 'month', label: '最近30天' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleQuickTimeRange(item.id)}
                  className={cn(
                    'h-7 px-2.5 rounded-md border text-[11px] transition-colors cursor-pointer',
                    filters.timeQuickRange === item.id
                      ? 'border-blue-500 text-blue-700 bg-blue-50/70 font-medium'
                      : 'border-neutral-200 text-neutral-600 hover:border-neutral-300 bg-white',
                  )}
                >
                  {item.label}
                </button>
              ))}
              <div className="flex items-center gap-1 text-[11px] text-neutral-400">
                <input
                  type="text"
                  value={filters.dateFrom.slice(0, 16)}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="h-7 w-32 px-2 rounded-md border border-neutral-200 text-[11px] text-neutral-700 font-mono"
                  placeholder="开始时间"
                />
                <span>~</span>
                <input
                  type="text"
                  value={filters.dateTo.slice(0, 16)}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className="h-7 w-32 px-2 rounded-md border border-neutral-200 text-[11px] text-neutral-700 font-mono"
                  placeholder="结束时间"
                />
              </div>
            </div>
          </div>

          {/* Call ID */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-700 mb-1.5">Call ID</label>
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
              />
              <input
                type="text"
                value={filters.callIdQuery}
                onChange={(e) => setFilters({ ...filters, callIdQuery: e.target.value })}
                placeholder="请输入 Call ID，例如 CALL-..."
                className="w-full h-8 pl-8 pr-3 rounded-md border border-neutral-200 text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 客户号码 */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-700 mb-1.5">客户号码</label>
            <input
              type="text"
              value={filters.phoneQuery}
              onChange={(e) => setFilters({ ...filters, phoneQuery: e.target.value })}
              placeholder="请输入客户手机号码"
              className="w-full h-8 px-3 rounded-md border border-neutral-200 text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Filter Row 2 */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 pt-1 items-end">
          {/* 数字员工 */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-700 mb-1.5">数字员工</label>
            <select
              value={filters.agentFilter}
              onChange={(e) => setFilters({ ...filters, agentFilter: e.target.value })}
              className="w-full h-8 px-2.5 rounded-md border border-neutral-200 text-xs text-neutral-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {agentOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === 'all' ? '全部数字员工' : opt}
                </option>
              ))}
            </select>
          </div>

          {/* 号码归属地 */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-700 mb-1.5">号码归属地</label>
            <select
              value={filters.locationFilter}
              onChange={(e) => setFilters({ ...filters, locationFilter: e.target.value })}
              className="w-full h-8 px-2.5 rounded-md border border-neutral-200 text-xs text-neutral-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {locationOptions.map((loc) => (
                <option key={loc} value={loc}>
                  {loc === 'all' ? '全部归属地' : loc}
                </option>
              ))}
            </select>
          </div>

          {/* 挂断方 */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-700 mb-1.5">挂断方</label>
            <select
              value={filters.hangupPartyFilter}
              onChange={(e) => setFilters({ ...filters, hangupPartyFilter: e.target.value })}
              className="w-full h-8 px-2.5 rounded-md border border-neutral-200 text-xs text-neutral-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {hangupOptions.map((h) => (
                <option key={h} value={h}>
                  {h === 'all' ? '全部挂断方' : h}
                </option>
              ))}
            </select>
          </div>

          {/* 通话标签 */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-700 mb-1.5">通话标签</label>
            <select
              value={filters.tagFilter}
              onChange={(e) => setFilters({ ...filters, tagFilter: e.target.value })}
              className="w-full h-8 px-2.5 rounded-md border border-neutral-200 text-xs text-neutral-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {tagOptions.map((tag) => (
                <option key={tag} value={tag}>
                  {tag === 'all' ? '全部标签' : tag}
                </option>
              ))}
            </select>
          </div>

          {/* 搜索与重置按钮 */}
          <div className="flex items-center gap-2 col-span-2 md:col-span-4 lg:col-span-1 justify-end">
            <button
              type="button"
              onClick={handleSearch}
              className="h-8 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
            >
              <Search size={13} />
              搜索
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="h-8 px-3 rounded-md border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw size={13} className="text-neutral-400" />
              重置
            </button>
          </div>
        </div>
      </div>

      {/* 3. Results Statistics Bar */}
      <div className="flex items-center justify-between px-1">
        <div className="text-xs text-neutral-600 flex items-center gap-1.5">
          <span>当前共查询符合条件的呼叫记录</span>
          <span className="font-mono font-bold text-neutral-900 text-sm">
            {filteredCalls.length}
          </span>
          <span>条</span>
        </div>

        <button
          type="button"
          onClick={() => showToast('已导出符合条件的呼叫记录报表')}
          className="h-8 px-3 rounded-md border border-neutral-200 hover:bg-white text-xs text-neutral-700 inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
        >
          <Download size={13} className="text-neutral-400" />
          导出话单
        </button>
      </div>

      {/* 4. Call Records Table */}
      <div className="bg-white rounded-xl border border-neutral-200/90 overflow-hidden shadow-xs">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
            <thead>
              <tr className="border-b border-neutral-200/80 bg-neutral-50/70 text-neutral-500 font-medium">
                <th className="py-3 px-4">Call ID</th>
                <th className="py-3 px-3">呼入时间</th>
                <th className="py-3 px-3">客户号码</th>
                <th className="py-3 px-3">数字员工名称</th>
                <th className="py-3 px-3">号码归属地</th>
                <th className="py-3 px-3">通话时长</th>
                <th className="py-3 px-3">对话轮次</th>
                <th className="py-3 px-3">挂断方</th>
                <th className="py-3 px-3">通话标签</th>
                <th className="py-3 px-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-800">
              {filteredCalls.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-neutral-400 text-xs">
                    没有找到匹配的呼叫记录，请调整筛选条件后再试。
                  </td>
                </tr>
              ) : (
                filteredCalls.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-sky-50/30 transition-colors group cursor-pointer"
                    onClick={() => setSelectedCallId(c.id)}
                  >
                    {/* Call ID */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-neutral-800 font-medium">
                        <span>{c.id}</span>
                        <button
                          type="button"
                          onClick={(e) => copyCallId(c.id, e)}
                          title="复制 Call ID"
                          className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-neutral-700 transition-opacity p-0.5 rounded cursor-pointer"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    </td>

                    {/* 呼入时间 */}
                    <td className="py-3.5 px-3 font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                      {c.callInTime}
                    </td>

                    {/* 客户号码 */}
                    <td className="py-3.5 px-3 font-mono text-neutral-800 whitespace-nowrap font-medium">
                      {c.customerPhone}
                    </td>

                    {/* 数字员工名称 */}
                    <td className="py-3.5 px-3 font-medium text-neutral-900 whitespace-nowrap">
                      <span className="text-sky-700 hover:underline">{c.agentName}</span>
                    </td>

                    {/* 号码归属地 */}
                    <td className="py-3.5 px-3 text-neutral-600 whitespace-nowrap">
                      {c.location}
                    </td>

                    {/* 通话时长 */}
                    <td className="py-3.5 px-3 font-mono text-neutral-800 whitespace-nowrap">
                      {c.duration}
                    </td>

                    {/* 对话轮次 */}
                    <td className="py-3.5 px-3 text-neutral-800 whitespace-nowrap font-medium">
                      {c.rounds} 轮
                    </td>

                    {/* 挂断方 */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {renderHangupBadge(c.hangupParty)}
                    </td>

                    {/* 通话标签 */}
                    <td className="py-3.5 px-3">
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {c.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className="text-[10.5px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 whitespace-nowrap font-medium"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* 操作 (通话详情) */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCallId(c.id);
                        }}
                        className="text-blue-600 hover:text-blue-700 font-semibold text-xs inline-flex items-center gap-0.5 cursor-pointer transition-colors"
                      >
                        通话详情
                        <ChevronRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Right Slide-out Detail Drawer */}
      {activeCall && (
        <CallDetailDrawer
          call={activeCall}
          currentIndex={currentInspectIndex}
          totalCalls={filteredCalls.length}
          onClose={() => setSelectedCallId(null)}
          onPrevCall={handlePrevCall}
          onNextCall={handleNextCall}
          onUpdateCall={handleUpdateCall}
          showToast={showToast}
        />
      )}
    </div>
  );
};
