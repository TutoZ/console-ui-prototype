/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Plus, 
  MessageSquareCode, 
  Link2, 
  Trash2, 
  Check, 
  X, 
  Cpu, 
  UserCheck,
  Send,
  HelpCircle,
  UploadCloud,
  CheckCircle2,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
  FileText,
  ChevronDown,
  MessageSquare,
  Headphones,
  Copy,
} from '@/lib/icons';
import { HiredAgent, type JobFamily } from '../types';
import { defaultOpeningLineForAgent } from '@/lib/agentDefaultCopy';
import { PROFILE_USER } from '@/lib/profileUser';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { EmployeeCardRelay } from './employees/relay/EmployeeCardRelay';
import cardStyles from './employees/relay/EmployeeCardRelay.module.scss';
import { hasEmployeeTrainNotice } from '@/lib/masterTemplateUpgrade';
import { EmployeeHomeRelay } from './employees/relay/EmployeeHomeRelay';
import homeStyles from './employees/relay/EmployeeHomeRelay.module.scss';
import { RELAY_HOME_ASSETS } from '@/lib/relayHomeAssets';
import { AGENT_AVATAR_PRESETS, agentAvatarForCard, agentAvatarForEditor } from '@/lib/agentAvatarDisplay';
import { ONBOARDING_TOAST_STEP1, ONBOARDING_TOAST_STEP3, ONBOARDING_TOAST_STEP4, ONBOARDING_TOAST_COMPLETE } from '@/lib/onboardingCopy';
import { EMPLOYEE_RESOURCE_TERMS, LIFECYCLE_TERMS, DISMISS_EMPLOYEE_COPY, EMPLOYEE_PAGE_COPY, ORG_COPY, SEARCH_COPY, MASTER_TEMPLATE_TERMS, QC_TERMS, NAV_TERMS } from '@/lib/platformTerminology';
import { OnboardingConfigPanel } from './onboarding/OnboardingConfigPanel';
import { OnboardingCapabilityTestPanel } from './onboarding/OnboardingCapabilityTestPanel';
import {
  OnboardingQcConfigPanel,
} from './onboarding/OnboardingQcConfigPanel';
import { OnboardingQcTestPanel } from './onboarding/OnboardingQcTestPanel';
import { OnboardingBuildTour } from './onboarding/OnboardingBuildTour';
import { AgentVersionPanel } from './onboarding/AgentVersionPanel';
import { OnboardingWorkspaceHeader } from './onboarding/OnboardingWorkspaceHeader';
import { isAgentOnDuty, isDomainOpsAgent, isQcAgent, isQcTrainingComplete, navigateToJobFamilyCapability, pendingOpsActionFor, resolveJobFamily, resolveEmployeeCategory, JOB_FAMILY_FULL_LABELS, supportsDutyToggle } from '@/lib/jobFamily';
import {
  loadBuildTourSeen,
  saveBuildTourSeen,
} from '@/lib/onboardingBuildTour';
import {
  OnboardingChannelsPanel,
} from './onboarding/OnboardingWorkspacePanels';
import {
  DEFAULT_ONBOARDING_WORKSPACE_TAB,
  ONBOARDING_WORKSPACE_TABS,
  isOnboardingWorkspaceTab,
  normalizeOnboardingWorkspaceTab,
  type OnboardingWorkspaceTabId,
} from '@/lib/onboardingWorkspaceTabs';
import { SegmentedTabBar } from './common/SegmentedTabs';

const QC_ONBOARDING_TABS = [{ id: 'build' as const, label: '入职培训' }] as const;
import { ResizableSplitPane } from './common/ResizableSplitPane';
import { Modal } from './common/Modal';
import {
  CreateEmployeeTypeModal,
  type CreateEmployeePayload,
} from './CreateEmployeeTypeModal';
import { WorkflowPrototypeFrame } from './WorkflowPrototypeFrame';
import { BTN_INK, BTN_MD, BTN_SOFT } from '@/lib/ui';
import { ChatReplySkeleton, WorkLogSkeleton } from './common/LoadingSkeletons';
import { ContentBusy } from './common/ContentBusy';
import { useMockLatency } from '@/lib/useMockLatency';
import { pickMockLatencyMs } from '@/lib/mockLatency';
import type { ThoughtStep } from '../types';
import {
  createSavedSnapshot,
  ensureAgentSnapshots,
  savedSnapshotTitle,
  snapshotToAgentUpdates,
} from '../lib/agentVersions';
import {
  applyAgentVersionSnapshot,
  EmployeeVersionSwitchModal,
} from './employees/EmployeeVersionSwitchModal';

export const EmployeeManagePage: React.FC = () => {
  const { 
    hiredAgents, 
    updateHiredAgent, 
    deleteHiredAgent,
    createBlankHiredAgent,
    knowledgeBases, 
    skills,
    staff,
    demoStep,
    setDemoStep,
    activeTab,
    setActiveTab,
    activeOnboardingAgentId,
    setActiveOnboardingAgentId,
    onboardingWorkspaceTab,
    setOnboardingWorkspaceTab,
    showDemoGuide,
    setShowDemoGuide,
    showToast,
    setExperienceAgentId,
    setFocusKnowledgeBaseId,
    marketAgents,
    setNavDomain,
    setDomainOpsTab,
    setQcRailTab,
    setQcMainTab,
    setPendingOpsAction,
    setPendingOpsAgentId,
    setShowTaskCenter,
  } = useApp();

  const onboardPanelBusy = useMockLatency(
    activeOnboardingAgentId ? `${activeOnboardingAgentId}:${onboardingWorkspaceTab}` : null,
    'panelSwitch',
  );
  const employeeListBusy = useMockLatency(
    activeOnboardingAgentId ? null : 'employees-cards',
    'pageList',
  );

  // Onboarding Workplace States
  const [onboardingRelayAvatarIndex, setOnboardingRelayAvatarIndex] = useState(0);
  const [dismissConfirmAgentId, setDismissConfirmAgentId] = useState<string | null>(null);
  const [renameAgentId, setRenameAgentId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [versionSwitchAgentId, setVersionSwitchAgentId] = useState<string | null>(null);

  const [onboardRightTab, setOnboardRightTab] = useState<'chat' | 'versions'>('chat');
  const [onboardConfigDirty, setOnboardConfigDirty] = useState(false);
  const [onboardConfigSavedAt, setOnboardConfigSavedAt] = useState<Date | null>(null);
  const [previewSnapshotId, setPreviewSnapshotId] = useState<string | null>(null);
  const [configSyncToken, setConfigSyncToken] = useState(0);
  const [buildTourOpen, setBuildTourOpen] = useState(false);
  const [buildTourStep, setBuildTourStep] = useState(0);

  const closeBuildTour = useCallback((markSeen = true) => {
    if (markSeen) saveBuildTourSeen(true);
    setBuildTourOpen(false);
  }, []);

  const maybeStartBuildTour = useCallback(() => {
    if (!showDemoGuide) return;
    if (loadBuildTourSeen()) return;
    setOnboardingWorkspaceTab('build');
    setOnboardRightTab('chat');
    setBuildTourStep(0);
    setBuildTourOpen(true);
  }, [showDemoGuide, setOnboardingWorkspaceTab]);

  const handleOnboardConfigStateChange = useCallback(
    (state: { isDirty: boolean; lastSavedAt: Date | null }) => {
      setOnboardConfigDirty(state.isDirty);
      setOnboardConfigSavedAt(state.lastSavedAt);
    },
    [],
  );

  const advanceOnboardingDemo = (from: 'A2' | 'A3' | 'A4', to: 'A3' | 'A4' | 'A5' | null) => {
    if (demoStep === from) setDemoStep(to);
  };

  /** 第 3 步：需先保存配置 */
  const onboardingSaveRequired = demoStep === 'A3';
  const onboardingChatLocked = onboardingSaveRequired || !!previewSnapshotId;

  // Dialog test state
  const [testAgent, setTestAgent] = useState<HiredAgent | null>(null);
  const [testInput, setTestInput] = useState('');
  const [testMsgs, setTestMsgs] = useState<{sender: 'user'|'agent'|'system', text: string, time: string}[]>([
    { sender: 'system', text: `进入${LIFECYCLE_TERMS.onboardTest}。可在下方输入测试话术，验证员工知识与技能执行情况。`, time: '现在' }
  ]);
  const [testThinking, setTestThinking] = useState<string[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);

  // Link staff state
  const [bindAgent, setBindAgent] = useState<HiredAgent | null>(null);

  // Filter states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'draft'>('all');
  const [typeFilter, setTypeFilter] = useState<
    'all' | Exclude<JobFamily, 'other'>
  >('all');
  const isTrainingPage = activeTab === 'training';

  // Create new Custom Agent states
  const [isCreating, setIsCreating] = useState(false);
  const [workflowFrame, setWorkflowFrame] = useState<{
    open: boolean;
    name: string;
    id: string;
    avatar: string;
  }>({ open: false, name: '', id: '', avatar: '' });

  const filtered = hiredAgents.filter(a => {
    const sMatch = a.name.toLowerCase().includes(search.toLowerCase()) || a.agentId.toLowerCase().includes(search.toLowerCase());
    if (!sMatch) return false;
    if (isTrainingPage && resolveEmployeeCategory(a) !== 'customer_service') return false;
    if (typeFilter !== 'all' && resolveEmployeeCategory(a) !== typeFilter) return false;
    if (statusFilter === 'all') return true;
    return statusFilter === 'online' ? isAgentOnDuty(a) : !isAgentOnDuty(a);
  });

  const categoryCounts = useMemo(() => {
    const counts: Record<'all' | JobFamily, number> = {
      all: 0,
      customer_service: 0,
      quality_inspection: 0,
      outbound: 0,
      hotline: 0,
      collection: 0,
      telesales: 0,
      followup: 0,
      other: 0,
    };
    hiredAgents.forEach((a) => {
      const sMatch =
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.agentId.toLowerCase().includes(search.toLowerCase());
      if (!sMatch) return;
      if (isTrainingPage && resolveEmployeeCategory(a) !== 'customer_service') return;
      if (statusFilter !== 'all') {
        const onDuty = isAgentOnDuty(a);
        if (statusFilter === 'online' ? !onDuty : onDuty) return;
      }
      const cat = resolveEmployeeCategory(a);
      counts[cat] += 1;
      counts.all += 1;
    });
    return counts;
  }, [hiredAgents, isTrainingPage, search, statusFilter]);

  const activeTabCount =
    typeFilter === 'all'
      ? categoryCounts.all ?? 0
      : categoryCounts[typeFilter] ?? 0;

  /** 分类 Tab 计数为 0，或尚未雇佣任何员工 → 展示完整缺省页 */
  const showDefaultEmptyPage =
    hiredAgents.length === 0 ||
    (typeFilter !== 'all' && activeTabCount === 0);

  const employeeListEmpty = (
    <div className={homeStyles.emptyState}>
      <img
        className={homeStyles.emptyImage}
        src={RELAY_HOME_ASSETS.employeesEmpty}
        alt=""
      />
      <div className={homeStyles.emptyTextGroup}>
        <div className={homeStyles.emptyTitle}>{EMPLOYEE_PAGE_COPY.emptyList}</div>
        <div className={homeStyles.emptySubtitle}>{EMPLOYEE_PAGE_COPY.emptyHint}</div>
      </div>
    </div>
  );

  const completeOnboardingWizard = () => {
    if (demoStep !== 'A4') return;
    setDemoStep('A5');
    showToast(ONBOARDING_TOAST_COMPLETE);
  };

  const toggleStatus = (id: string, s: 'online' | 'draft') => {
    const next = s === 'online' ? 'draft' : 'online';
    updateHiredAgent(id, { status: next });
    if (next === 'online') completeOnboardingWizard();
  };

  // Run mock dialog testing inside the modal
  const handleSendTest = () => {
    if (!testInput.trim() || !testAgent) return;
    
    const userMsg = testInput;
    setTestMsgs(prev => [...prev, { sender: 'user', text: userMsg, time: new Date().toTimeString().split(' ')[0] }]);
    setTestInput('');
    setIsSpinning(true);

    // Step 1 thinking trace
    setTestThinking(['1. 校验输入，激活数字员工大语言模型。', '2. 解析意图：分析文本是否带有售后、支持或优惠券逻辑。']);

    const replyMs = pickMockLatencyMs('aiReply');
    const t1 = Math.min(850, Math.floor(replyMs * 0.28));
    const t2 = Math.min(1500, Math.floor(replyMs * 0.48));

    setTimeout(() => {
      setTestThinking(prev => [...prev, `3. 检索员工知识。已配备 ${testAgent.knowledgeBases.length} 份。`]);
    }, t1);

    setTimeout(() => {
      setTestThinking(prev => [...prev, `4. 调用员工技能。[${testAgent.skills.map(sid => skills.find(sk => sk.id === sid)?.name || sid).join(', ') || '暂未配置'}]`]);
    }, t2);

    setTimeout(() => {
      let aiResponse = '您好！系统已经捕获了您的提问。针对这一情况，我们会安排专业客服极速核实！请问您需要帮您拉起人工顾问吗？';
      
      const t = userMsg.toLowerCase();
      if (t.includes('理赔') || t.includes('赔') || t.includes('吃坏') || t.includes('中毒') || t.includes('医疗') || t.includes('退款') || t.includes('钱')) {
        aiResponse = '已调用【食安险快速理赔测算器】。免赔额 500 元后，本次预估赔付约 2,700 元。请上传病历、发票与现场照片完成线上报案。';
      } else if (t.includes('拖') || t.includes('投诉') || t.includes('愤怒') || t.includes('糟糕') || t.includes('不管')) {
        aiResponse = '食安投诉情绪监测已触发，正在转接理赔专员人工坐席，工单已标记加急。';
      } else if (t.includes('保') || t.includes('范围') || t.includes('保费') || t.includes('价格') || t.includes('多少钱') || t.includes('保障')) {
        aiResponse = '根据《食安责任险产品说明手册 2026》，基础版约 1,280 元/店/年，含 100 万第三者责任限额。具体以门店档位为准。';
      }

      setTestMsgs(prev => [...prev, { 
        sender: 'agent', 
        text: aiResponse, 
        time: new Date().toTimeString().split(' ')[0] 
      }]);
      setTestThinking(prev => [...prev, '5. 生成结构化应答完毕。发射对话。']);
      setIsSpinning(false);
    }, replyMs);
  };

  const openCreateModal = () => {
    setIsCreating(true);
  };

  useEffect(() => {
    if (isTrainingPage) return;
    try {
      if (sessionStorage.getItem('js_open_employee_create') === '1') {
        sessionStorage.removeItem('js_open_employee_create');
        setIsCreating(true);
      }
    } catch {
      /* ignore */
    }
  }, [isTrainingPage]);

  const executeCreate = (payload: CreateEmployeePayload) => {
    const name = payload.name.trim() || '新员工';
    const family: JobFamily = isTrainingPage
      ? 'customer_service'
      : payload.jobFamily;

    if (payload.mode === 'preset') {
      const newAg = createBlankHiredAgent({
        name,
        description: payload.description.trim(),
        jobFamily: family,
        buildMode: 'preset',
        enterTraining: false,
      });
      setIsCreating(false);
      setWorkflowFrame({
        open: true,
        name: newAg.name,
        id: newAg.agentId,
        avatar: newAg.avatar,
      });
      showToast(
        payload.createMethod === 'ai'
          ? '已进入预设流程编排画布（可结合 AI 完善节点）'
          : '已进入预设流程编排画布',
      );
      return;
    }

    createBlankHiredAgent({
      name,
      description: payload.description.trim(),
      jobFamily: family,
      buildMode: 'autonomous',
      enterTraining: family === 'customer_service',
    });
    setIsCreating(false);
    showToast(
      payload.createMethod === 'ai'
        ? '已进入员工培训，可继续对话完善配置'
        : '已创建数字员工，可手动完善配置',
    );
  };

  const onboardingAgent = activeOnboardingAgentId 
    ? hiredAgents.find(a => a.id === activeOnboardingAgentId) 
    : null;

  const previewSnapshot = useMemo(() => {
    if (!onboardingAgent || !previewSnapshotId) return null;
    return ensureAgentSnapshots(onboardingAgent).find((s) => s.id === previewSnapshotId) ?? null;
  }, [onboardingAgent, previewSnapshotId]);

  const dismissConfirmAgent = useMemo(
    () => hiredAgents.find((a) => a.id === dismissConfirmAgentId) ?? null,
    [hiredAgents, dismissConfirmAgentId],
  );

  const renameAgent = useMemo(
    () => hiredAgents.find((a) => a.id === renameAgentId) ?? null,
    [hiredAgents, renameAgentId],
  );

  const versionSwitchAgent = useMemo(
    () => hiredAgents.find((a) => a.id === versionSwitchAgentId) ?? null,
    [hiredAgents, versionSwitchAgentId],
  );

  const handleConfirmDismissAgent = () => {
    if (!dismissConfirmAgent) return;
    const { id } = dismissConfirmAgent;
    deleteHiredAgent(id);
    if (activeOnboardingAgentId === id) {
      setActiveOnboardingAgentId(null);
    }
    setDismissConfirmAgentId(null);
    showToast(DISMISS_EMPLOYEE_COPY.successToast, 'success');
  };

  const openRenameAgent = (agent: HiredAgent) => {
    setRenameAgentId(agent.id);
    setRenameValue(agent.name);
  };

  const handleConfirmRenameAgent = () => {
    if (!renameAgent) return;
    const next = renameValue.trim().slice(0, 8);
    if (!next) {
      showToast('请输入员工名称', 'error');
      return;
    }
    updateHiredAgent(renameAgent.id, { name: next });
    setRenameAgentId(null);
    showToast('已重命名');
  };

  const copyEmployeeId = async (agentId: string) => {
    try {
      await navigator.clipboard.writeText(agentId);
      showToast('已复制员工 ID');
    } catch {
      showToast('复制失败，请重试', 'error');
    }
  };

  const openCustomerPreview = (agent: HiredAgent) => {
    if (agent.status !== 'online') {
      showToast('未上线员工不可预览，请先准予上岗');
      return;
    }
    setExperienceAgentId(agent.id);
    setActiveTab('customerExperience');
  };

  useEffect(() => {
    if (demoStep === 'A3' && activeOnboardingAgentId) {
      setOnboardRightTab('versions');
    }
  }, [demoStep, activeOnboardingAgentId]);

  useEffect(() => {
    setPreviewSnapshotId(null);
  }, [activeOnboardingAgentId]);

  useEffect(() => {
    if (!onboardingAgent?.configSnapshots?.some((s) => s.kind === 'baseline')) {
      if (!onboardingAgent) return;
      updateHiredAgent(onboardingAgent.id, {
        configSnapshots: ensureAgentSnapshots(onboardingAgent),
      });
    }
  }, [onboardingAgent?.id]);

  const openAgentWorkspace = (
    agentId: string,
    tab: OnboardingWorkspaceTabId = DEFAULT_ONBOARDING_WORKSPACE_TAB,
    relayAvatarIndex?: number,
    opts?: { startBuildTour?: boolean; rightTab?: 'chat' | 'versions' },
  ) => {
    const target = hiredAgents.find((a) => a.id === agentId);
    // 质检暂不走入职培训工作台，改到智能质检一级导航
    if (isQcAgent(target)) {
      navigateToJobFamilyCapability('quality_inspection', 'training', {
        setNavDomain,
        setActiveTab,
        setDomainOpsTab,
        setQcRailTab,
        setQcMainTab,
      });
      return;
    }
    setOnboardingWorkspaceTab(normalizeOnboardingWorkspaceTab(tab));
    setOnboardingRelayAvatarIndex(
      relayAvatarIndex ?? Math.max(0, hiredAgents.findIndex((a) => a.id === agentId)),
    );
    setActiveOnboardingAgentId(agentId);
    if (opts?.rightTab) {
      setOnboardRightTab(opts.rightTab);
    } else if (tab === 'build') {
      setOnboardRightTab('chat');
    }
    if (opts?.startBuildTour !== false && !isQcAgent(target)) {
      // 下一帧再开，确保培训页 DOM 已挂载
      window.setTimeout(() => maybeStartBuildTour(), 80);
    }
  };

  // 历史残留：质检岗若仍挂着入职培训，自动退出
  useEffect(() => {
    if (!activeOnboardingAgentId) return;
    const agent = hiredAgents.find((a) => a.id === activeOnboardingAgentId);
    if (isQcAgent(agent)) {
      setActiveOnboardingAgentId(null);
    }
  }, [activeOnboardingAgentId, hiredAgents, setActiveOnboardingAgentId]);

  // 雇佣后自动进入培训页时，同步触发遮罩引导（质检岗跳过客服遮罩）
  useEffect(() => {
    if (!activeOnboardingAgentId || !showDemoGuide) return;
    const agent = hiredAgents.find((a) => a.id === activeOnboardingAgentId);
    if (isQcAgent(agent)) return;
    if (loadBuildTourSeen()) return;
    if (normalizeOnboardingWorkspaceTab(onboardingWorkspaceTab) !== 'build') return;
    if (buildTourOpen) return;
    const timer = window.setTimeout(() => maybeStartBuildTour(), 120);
    return () => window.clearTimeout(timer);
  }, [
    activeOnboardingAgentId,
    hiredAgents,
    showDemoGuide,
    onboardingWorkspaceTab,
    buildTourOpen,
    maybeStartBuildTour,
  ]);

  if (onboardingAgent) {
    const hasKbs = onboardingAgent.knowledgeBases && onboardingAgent.knowledgeBases.length > 0;
    const hasSks = onboardingAgent.skills && onboardingAgent.skills.length > 0;

    const handlePreviewSnapshot = (snapshotId: string) => {
      setPreviewSnapshotId(snapshotId);
      setOnboardRightTab('versions');
    };

    const handleCancelPreview = () => {
      setPreviewSnapshotId(null);
    };

    const handleApplySnapshot = (snapshotId: string) => {
      const snapshots = ensureAgentSnapshots(onboardingAgent);
      const snap = snapshots.find((s) => s.id === snapshotId);
      if (!snap) return;
      updateHiredAgent(onboardingAgent.id, {
        ...snapshotToAgentUpdates(snap),
        publishedSnapshotId: snapshotId,
      });
      setPreviewSnapshotId(null);
      setConfigSyncToken((t) => t + 1);
      setOnboardConfigDirty(false);
      showToast(`已切换至“${snap.title}”`);
    };

    const handleDeleteSnapshot = (snapshotId: string) => {
      const snapshots = ensureAgentSnapshots(onboardingAgent);
      const snap = snapshots.find((s) => s.id === snapshotId);
      if (!snap || snap.kind === 'baseline') return;
      if (onboardingAgent.publishedSnapshotId === snapshotId) {
        showToast('无法删除当前运行中的版本，请先应用其他版本。');
        return;
      }
      updateHiredAgent(onboardingAgent.id, {
        configSnapshots: snapshots.filter((s) => s.id !== snapshotId),
      });
      if (previewSnapshotId === snapshotId) setPreviewSnapshotId(null);
      showToast(`已删除“${snap.title}”`);
    };

    const handleDiscardDraft = () => {
      const snapshots = ensureAgentSnapshots(onboardingAgent);
      const published =
        snapshots.find((s) => s.id === onboardingAgent.publishedSnapshotId) ??
        snapshots.find((s) => s.kind === 'baseline');
      if (!published) return;
      updateHiredAgent(onboardingAgent.id, snapshotToAgentUpdates(published));
      setPreviewSnapshotId(null);
      setConfigSyncToken((t) => t + 1);
      setOnboardConfigDirty(false);
      showToast('已放弃未保存更改，恢复为当前运行版本。');
    };

    const handleOnboardConfigSaved = () => {
      const agent = hiredAgents.find((a) => a.id === onboardingAgent.id) ?? onboardingAgent;
      const snapshots = ensureAgentSnapshots(agent);
      const title = savedSnapshotTitle(agent, skills);
      const snapshot = createSavedSnapshot(agent, snapshots, title);
      updateHiredAgent(agent.id, {
        configSnapshots: [...snapshots, snapshot],
        publishedSnapshotId: snapshot.id,
      });
      setOnboardConfigSavedAt(new Date());
      setOnboardConfigDirty(false);
      if (demoStep === 'A3') {
        advanceOnboardingDemo('A3', 'A4');
        showToast(ONBOARDING_TOAST_STEP4);
      }
    };

    const isQcOnboarding = isQcAgent(onboardingAgent);

    const approveButton = (
      <button
        type="button"
        onClick={() => {
          if (isQcOnboarding) {
            if (!isQcTrainingComplete(onboardingAgent.qcProfile)) {
              showToast(QC_TERMS.completeBlocked);
              return;
            }
            setActiveOnboardingAgentId(null);
            showToast(QC_TERMS.completeSuccess);
            return;
          }
          if (onboardingSaveRequired) {
            showToast(`请先保存配置并完成培训存档，再进行${LIFECYCLE_TERMS.onboardTest}。`);
            return;
          }
          if (previewSnapshotId) {
            showToast(`请先取消预览或应用其他${LIFECYCLE_TERMS.examVersion}，再完成培训。`);
            return;
          }
          setActiveOnboardingAgentId(null);
          if (demoStep === 'A4') {
            showToast(ONBOARDING_TOAST_STEP4);
          } else {
            showToast(`“${onboardingAgent.name}”培训已完成。需要接待时，请在员工卡片上点击“上岗”。`);
          }
        }}
        disabled={!isQcOnboarding && onboardingChatLocked}
        className={cn(
          BTN_MD,
          'gap-1.5',
          !isQcOnboarding && onboardingChatLocked && 'opacity-50 cursor-not-allowed',
        )}
      >
        <Zap size={13} className="fill-current" />
        <span>{LIFECYCLE_TERMS.completeTraining}</span>
      </button>
    );

    const workspaceTab = normalizeOnboardingWorkspaceTab(onboardingWorkspaceTab);

    return (
      <div className="h-screen w-screen flex flex-col bg-paper overflow-hidden text-neutral-800 font-sans">
        <OnboardingWorkspaceHeader
          tabs={isQcOnboarding ? QC_ONBOARDING_TABS : ONBOARDING_WORKSPACE_TABS}
          activeTabId={workspaceTab}
          onTabChange={(id) => {
            if (isOnboardingWorkspaceTab(id)) setOnboardingWorkspaceTab(id);
          }}
          onBack={() => setActiveOnboardingAgentId(null)}
          actions={approveButton}
        />

        <ContentBusy
          busy={onboardPanelBusy}
          size="panel"
          minHeight="min(60vh, 520px)"
          className="flex-1 min-h-0"
        >
        {workspaceTab === 'build' && isQcOnboarding && (
          <ResizableSplitPane
            storageKey="js_qc_onboarding_split_v2"
            defaultRatio={0.68}
            className="bg-paper"
            left={
              <OnboardingQcConfigPanel
                agent={onboardingAgent}
                updateHiredAgent={updateHiredAgent}
                showToast={showToast}
                onSaved={handleOnboardConfigSaved}
                lastSavedAt={onboardConfigSavedAt}
                relayAvatarIndex={onboardingRelayAvatarIndex}
                onConfigStateChange={handleOnboardConfigStateChange}
              />
            }
            right={
              <OnboardingQcTestPanel
                agent={onboardingAgent}
                updateHiredAgent={updateHiredAgent}
                showToast={showToast}
              />
            }
          />
        )}

        {workspaceTab === 'build' && !isQcOnboarding && (
          <ResizableSplitPane
          storageKey="js_onboarding_split_v3"
          defaultRatio={0.72}
          className="bg-paper"
          left={
            <OnboardingConfigPanel
              agent={onboardingAgent}
              relayAvatarIndex={onboardingRelayAvatarIndex}
              knowledgeBases={knowledgeBases}
              skills={skills}
              hasKbs={hasKbs}
              hasSks={hasSks}
              updateHiredAgent={updateHiredAgent}
              showToast={showToast}
              onPersonaConfigured={() => {}}
              onKnowledgeBound={() => {}}
              onSkillBound={() => {}}
              onConfigStateChange={handleOnboardConfigStateChange}
              onConfigSaved={handleOnboardConfigSaved}
              previewSnapshot={previewSnapshot}
              configSyncToken={configSyncToken}
              onCancelPreview={handleCancelPreview}
              onApplyPreview={() => previewSnapshot && handleApplySnapshot(previewSnapshot.id)}
              buildTourStep={buildTourOpen ? buildTourStep : null}
              onCreateSkill={() => {
                try {
                  sessionStorage.setItem('js_home_create_mode', 'skill');
                } catch {
                  /* ignore */
                }
                setActiveTab('platformHome');
                showToast('正在进入技能创建…');
              }}
            />
          }
          right={
            <div className="flex flex-col h-full bg-paper overflow-hidden text-neutral-800 text-left min-h-0">
              {onboardRightTab === 'chat' ? (
                <OnboardingCapabilityTestPanel
                  agent={onboardingAgent}
                  relayAvatarIndex={onboardingRelayAvatarIndex}
                  knowledgeBases={knowledgeBases}
                  skills={skills}
                  showToast={showToast}
                  locked={onboardingChatLocked}
                  lockPlaceholder={
                    previewSnapshotId
                      ? '预览模式中无法测试'
                      : '请先保存配置后再测试'
                  }
                  lockToast={
                    previewSnapshotId
                      ? `请先取消预览或应用其他${LIFECYCLE_TERMS.examVersion}，再进行${LIFECYCLE_TERMS.onboardTest}。`
                      : `请先点击左上角“保存”完成培训存档，再进行${LIFECYCLE_TERMS.onboardTest}。`
                  }
                  headerLeft={
                    <SegmentedTabBar
                      ariaLabel="预览面板"
                      value={onboardRightTab}
                      onChange={(id) => setOnboardRightTab(id as 'chat' | 'versions')}
                      items={[
                        { id: 'chat', label: LIFECYCLE_TERMS.onboardTest },
                        { id: 'versions', label: LIFECYCLE_TERMS.examVersion },
                      ]}
                    />
                  }
                  hintBanner={
                    onboardingSaveRequired && !previewSnapshotId ? (
                      <div className="mx-4 mt-3 mb-0 rounded-[13px] border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900 leading-relaxed shrink-0">
                        引导提示：请先在左侧点击“保存”完成培训存档，保存成功后再进行
                        {LIFECYCLE_TERMS.onboardTest}。
                      </div>
                    ) : null
                  }
                />
              ) : (
                <>
                  <div className="px-4 py-2.5 bg-white border-b border-neutral-200 flex items-center justify-between shrink-0 gap-2 min-h-[54px]">
                    <SegmentedTabBar
                      ariaLabel="预览面板"
                      value={onboardRightTab}
                      onChange={(id) => setOnboardRightTab(id as 'chat' | 'versions')}
                      items={[
                        { id: 'chat', label: LIFECYCLE_TERMS.onboardTest },
                        { id: 'versions', label: LIFECYCLE_TERMS.examVersion },
                      ]}
                    />
                  </div>
                  <AgentVersionPanel
                    agent={onboardingAgent}
                    knowledgeBases={knowledgeBases}
                    skills={skills}
                    isDirty={onboardConfigDirty}
                    lastSavedAt={onboardConfigSavedAt}
                    previewSnapshotId={previewSnapshotId}
                    onPreview={handlePreviewSnapshot}
                    onApplySnapshot={handleApplySnapshot}
                    onDeleteSnapshot={handleDeleteSnapshot}
                    onDiscardDraft={handleDiscardDraft}
                  />
                </>
              )}
            </div>
          }
          />
        )}

        {!isQcOnboarding && workspaceTab === 'channels' && (
          <OnboardingChannelsPanel agent={onboardingAgent} showToast={showToast} />
        )}
        </ContentBusy>

        {!isQcOnboarding && (
        <OnboardingBuildTour
          open={buildTourOpen && workspaceTab === 'build'}
          currentStep={buildTourStep}
          onStepChange={setBuildTourStep}
          onClose={() => closeBuildTour(true)}
          onComplete={() => {
            closeBuildTour(true);
            if (demoStep === 'A3') {
              // 遮罩引导完成，仍停留在第 3 步，引导用户保存
            }
            showToast(ONBOARDING_TOAST_STEP3);
          }}
        />
        )}
      </div>
    );
  }

  const renderEmployeeCard = (agent: HiredAgent) => {
    const index = hiredAgents.findIndex((a) => a.id === agent.id);
    const family = resolveJobFamily(agent);
    const category = resolveEmployeeCategory(agent);
    const isOnline = isAgentOnDuty(agent);
    const cardAvatar = agentAvatarForCard(agent.avatar, index, agent.avatarCustomized);
    const marketAgent = marketAgents.find((m) => m.id === agent.marketId);
    const hasTrainNotice = hasEmployeeTrainNotice(agent, marketAgent);
    const opsAgent = isDomainOpsAgent(agent);
    const navApi = {
      setNavDomain,
      setActiveTab,
      setDomainOpsTab,
      setQcRailTab,
      setQcMainTab,
    };
    const usesChannelDispatch =
      family === 'customer_service' || family === 'hotline' || family === 'other';
    /** 在线客服一级导航（员工培训列表）保留上下岗；首页卡片只做跳转，不展示上下岗 */
    const showDutyToggle = isTrainingPage && supportsDutyToggle(agent);
    const openDispatch = () => {
      if (usesChannelDispatch) {
        openAgentWorkspace(agent.id, 'channels', undefined, { startBuildTour: false });
        return;
      }
      const action = pendingOpsActionFor(family, 'dispatch');
      setPendingOpsAction(action);
      setPendingOpsAgentId(action ? agent.id : null);
      if (action === 'open-task-center') setShowTaskCenter(true);
      navigateToJobFamilyCapability(family, 'dispatch', navApi);
      completeOnboardingWizard();
    };
    const primaryLabel = '员工培训';
    const onPrimary = () => {
      if (demoStep === 'A2') setDemoStep('A3');
      if (opsAgent) {
        const action = pendingOpsActionFor(family, 'training');
        setPendingOpsAction(action);
        setPendingOpsAgentId(action ? agent.id : null);
        navigateToJobFamilyCapability(family, 'training', navApi);
        return;
      }
      if (agent.buildMode === 'preset') {
        setWorkflowFrame({
          open: true,
          name: agent.name,
          id: agent.agentId,
          avatar: agent.avatar,
        });
        return;
      }
      if (family === 'customer_service') {
        setActiveTab('training');
      }
      openAgentWorkspace(agent.id, 'build', index);
    };
    return (
      <EmployeeCardRelay
        key={agent.id}
        name={agent.name}
        desc={agent.description}
        avatar={cardAvatar.kind === 'image' ? cardAvatar.src : cardAvatar.emoji}
        avatarFallback={cardAvatar.kind === 'emoji' ? cardAvatar.emoji : undefined}
        isOnline={isOnline}
        showStatusDot={isTrainingPage}
        hasTrainNotice={hasTrainNotice}
        jobFamilyLabel={JOB_FAMILY_FULL_LABELS[category]}
        primaryActionLabel={primaryLabel}
        onPrimaryAction={onPrimary}
        onDispatchTask={showDutyToggle ? undefined : openDispatch}
        dispatchActionLabel={usesChannelDispatch ? '派出渠道' : '派发任务'}
        showGoOnlineButton={showDutyToggle}
        onGoOnline={
          showDutyToggle ? () => toggleStatus(agent.id, agent.status) : undefined
        }
        moreMenu={
          isTrainingPage ? (
          <div className={cardStyles.moreMenu}>
            <button
              type="button"
              className={cardStyles.moreItem}
              onClick={openDispatch}
            >
              {usesChannelDispatch ? '派出渠道' : '派发任务'}
            </button>
            <button
              type="button"
              className={cardStyles.moreItem}
              onClick={() => void copyEmployeeId(agent.agentId)}
            >
              复制员工 ID
            </button>
            <button
              type="button"
              className={cardStyles.moreItem}
              onClick={() => openRenameAgent(agent)}
            >
              重命名
            </button>
            <button
              type="button"
              className={cardStyles.moreItem}
              onClick={() => setVersionSwitchAgentId(agent.id)}
            >
              {LIFECYCLE_TERMS.switchVersion}
            </button>
            <button
              type="button"
              className={cardStyles.moreItem}
              onClick={() => openCustomerPreview(agent)}
            >
              {NAV_TERMS.customerPreview}
            </button>
            <button
              type="button"
              className={`${cardStyles.moreItem} ${cardStyles.moreItemDanger}`}
              onClick={() => setDismissConfirmAgentId(agent.id)}
            >
              {LIFECYCLE_TERMS.dismiss}
            </button>
          </div>
          ) : undefined
        }
      />
    );
  };

  return (
    <>
    <EmployeeHomeRelay
      activeSubTab="employees"
      showBanner={!isTrainingPage}
      onStartHire={() => {
        setShowDemoGuide(true);
        setDemoStep('A1');
        setActiveTab('market');
        showToast(`第一步：${ONBOARDING_TOAST_STEP1}`);
      }}
      onCreateFromScratch={openCreateModal}
      pageTitle={isTrainingPage ? '员工培训' : undefined}
      createButtonLabel={isTrainingPage ? '创建在线客服' : undefined}
      search={search}
      onSearchChange={setSearch}
      statusFilter={statusFilter}
      onStatusFilterChange={setStatusFilter}
      typeFilter={isTrainingPage ? 'customer_service' : typeFilter}
      onTypeFilterChange={isTrainingPage ? undefined : setTypeFilter}
      listBusy={employeeListBusy}
    >
      {showDefaultEmptyPage ? (
        employeeListEmpty
      ) : filtered.length === 0 ? (
        <div className={homeStyles.emptyState}>
          <div className={homeStyles.emptySubtitle}>{EMPLOYEE_PAGE_COPY.noMatch}</div>
        </div>
      ) : (
        <div className={homeStyles.cardList}>
          {filtered.map((agent) => renderEmployeeCard(agent))}
        </div>
      )}
    </EmployeeHomeRelay>

      <CreateEmployeeTypeModal
        open={isCreating}
        onClose={() => setIsCreating(false)}
        onConfirm={executeCreate}
        lockJobFamily={isTrainingPage ? 'customer_service' : undefined}
      />

      <WorkflowPrototypeFrame
        open={workflowFrame.open}
        agentName={workflowFrame.name}
        agentId={workflowFrame.id}
        agentAvatar={workflowFrame.avatar}
        onClose={() => setWorkflowFrame((prev) => ({ ...prev, open: false }))}
      />

      {/* DIALOGUE SANDBOX TESTING MODAL */}
      {testAgent && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[13px] w-full max-w-4xl shadow-2xl h-[560px] flex overflow-hidden text-neutral-800 animate-in fade-in duration-200">
            {/* Left columns: Chat flow */}
            <div className="flex-1 flex flex-col bg-neutral-50 border-r border-neutral-100">
              {/* Header */}
              <div className="p-4 bg-white border-b border-neutral-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{testAgent.avatar}</div>
                  <div>
                    <h3 className="font-bold text-neutral-900 text-sm">{testAgent.name.slice(0, 8)}</h3>
                  </div>
                </div>
                <button 
                  onClick={() => setTestAgent(null)}
                  className="text-neutral-400 hover:text-neutral-600 p-1 hover:bg-neutral-100 rounded-full cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Message scroll list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar">
                {testMsgs.map((m, idx) => {
                  if (m.sender === 'system') {
                    return (
                      <div key={idx} className="flex justify-center">
                        <span className="bg-neutral-200/80 text-neutral-600 text-[10px] px-3 py-1 rounded-full text-center border border-neutral-300/30 max-w-md leading-relaxed">
                          {m.text}
                        </span>
                      </div>
                    );
                  }

                  const isUser = m.sender === 'user';
                  return (
                    <div key={idx} className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center select-none shrink-0 ${
                        isUser ? 'bg-neutral-800 text-white font-semibold text-[12px]' : 'bg-neutral-100 text-lg border border-neutral-200'
                      }`}>
                        {isUser ? PROFILE_USER.initial : testAgent.avatar}
                      </div>

                      <div className="max-w-[70%]">
                        <div className={`p-3 rounded-[13px] text-xs leading-relaxed text-neutral-800 ${
                          isUser ? 'bg-ink text-white rounded-tr-none' : 'bg-white rounded-tl-none border border-neutral-200 shadow-sm'
                        }`}>
                          {m.text}
                        </div>
                        <span className="block text-[9px] text-neutral-400 mt-1 ${isUser ? 'text-right' : ''}">
                          {m.time}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {isSpinning && <ChatReplySkeleton />}
              </div>

              {/* Dialogue input box */}
              <div className="p-3 bg-white border-t border-neutral-200">
                <div className="flex gap-2 bg-neutral-50 border border-neutral-200 rounded-[13px] p-1.5 focus-within:border-neutral-500">
                  <input 
                    type="text" 
                    placeholder="输入测试话术（例如：闪退退货/多少钱）验证回答策略…" 
                    value={testInput}
                    onChange={e => setTestInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendTest()}
                    disabled={isSpinning}
                    className="flex-1 bg-transparent px-2.5 border-none outline-none text-xs text-neutral-700 placeholder-neutral-400"
                  />
                  <button 
                    onClick={handleSendTest}
                    disabled={isSpinning || !testInput.trim()}
                    className="h-8 w-8 bg-ink hover:bg-ink-hover disabled:bg-neutral-200 text-white font-bold rounded-lg flex items-center justify-center transition cursor-pointer"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Right column: Trace visualizer of steps */}
            <div className="w-80 bg-neutral-800 text-neutral-300 flex flex-col p-5 overflow-y-auto">
              <h4 className="text-xs uppercase text-neutral-500 font-bold tracking-wider mb-4 border-b border-neutral-800 pb-2 flex items-center gap-1.5">
                <Cpu size={14} className="text-live" />
                <span>工作日志</span>
              </h4>

              <div className="space-y-4 text-xs">
                {testThinking.length === 0 && !isSpinning ? (
                  <div className="p-6 text-center text-neutral-600 italic">
                    <p>等待键盘录入...</p>
                    <p className="text-[10px] mt-2">发送消息即可在此查阅 AI 在后台的多级关联、调用以及决策推导过程。</p>
                  </div>
                ) : (
                  <>
                    {testThinking.map((step, idx) => (
                      <div key={idx} className="bg-neutral-950/60 p-2.5 rounded border border-neutral-800/80 font-mono text-[11px] leading-relaxed relative animate-in slide-in-from-top-2 duration-150">
                        {step}
                      </div>
                    ))}
                    {isSpinning ? <WorkLogSkeleton rows={2} className="py-4 opacity-90" /> : null}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LINK SITTING REAL HUMAN STAFF MODAL */}
      {bindAgent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[13px] w-full max-w-md shadow-2xl p-6 text-neutral-800">
            <h3 className="font-extrabold text-neutral-900 text-base mb-4 flex items-center gap-2">
              <UserCheck size={18} className="text-neutral-700" />
              <span>指定兜底坐席</span>
            </h3>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {staff.map(s => (
                <div key={s.id} className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 transition text-xs">
                  <div>
                    <span className="font-bold text-neutral-800">{s.name}</span>
                    <span className="text-[10px] text-neutral-400 ml-2">工号: {s.workId}</span>
                  </div>
                  <button 
                    onClick={() => {
                      showToast(ORG_COPY.bindStaffSuccess(s.name));
                      setBindAgent(null);
                    }}
                    className="bg-ink hover:bg-ink-hover text-white px-3 py-1 rounded text-[10px] font-bold cursor-pointer"
                  >
                    确认绑定
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t border-neutral-100 mt-5">
              <button 
                onClick={() => setBindAgent(null)}
                className="px-4 py-1.5 bg-neutral-100 text-neutral-600 rounded-lg text-xs font-bold"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={!!renameAgent}
        onClose={() => setRenameAgentId(null)}
        title="重命名"
        maxWidth="max-w-sm"
        footer={
          <>
            <button type="button" className={BTN_SOFT} onClick={() => setRenameAgentId(null)}>
              取消
            </button>
            <button type="button" className={BTN_INK} onClick={handleConfirmRenameAgent}>
              确定
            </button>
          </>
        }
      >
        <label className="block space-y-1.5">
          <span className="text-[12px] font-medium text-neutral-600">员工名称</span>
          <Input
            autoFocus
            value={renameValue}
            maxLength={8}
            placeholder="请输入名称"
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirmRenameAgent();
            }}
            className="h-9"
          />
        </label>
      </Modal>

      <EmployeeVersionSwitchModal
        open={Boolean(versionSwitchAgent)}
        agent={versionSwitchAgent}
        onClose={() => setVersionSwitchAgentId(null)}
        onApply={(agentId, snapshotId) => {
          const target = hiredAgents.find((a) => a.id === agentId);
          if (!target) return;
          const patch = applyAgentVersionSnapshot(target, snapshotId);
          if (!patch) return;
          updateHiredAgent(agentId, patch);
          const title =
            ensureAgentSnapshots(target).find((s) => s.id === snapshotId)?.title ?? '所选版本';
          setVersionSwitchAgentId(null);
          showToast(`已切换至“${title}”`);
        }}
        onOpenFullManager={(agentId) => {
          const idx = filtered.findIndex((a) => a.id === agentId);
          openAgentWorkspace(agentId, 'build', idx >= 0 ? idx : undefined, {
            startBuildTour: false,
            rightTab: 'versions',
          });
        }}
      />

      <Modal
        open={!!dismissConfirmAgent}
        onClose={() => setDismissConfirmAgentId(null)}
        title={DISMISS_EMPLOYEE_COPY.modalTitle}
        footer={
          <>
            <button
              type="button"
              onClick={() => setDismissConfirmAgentId(null)}
              className={BTN_SOFT}
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleConfirmDismissAgent}
              className={cn(
                BTN_INK,
                'bg-destructive hover:bg-destructive/90 text-white border-transparent',
              )}
            >
              {DISMISS_EMPLOYEE_COPY.confirmButton}
            </button>
          </>
        }
      >
        <p className="text-neutral-500 leading-relaxed">
          {dismissConfirmAgent
            ? DISMISS_EMPLOYEE_COPY.body(dismissConfirmAgent.name)
            : null}
        </p>
      </Modal>
    </>
  );
};
