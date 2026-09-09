import React, { useEffect, useReducer, useRef, useState } from 'react';
import { PAGE, PANEL, FIELD, LABEL, BTN_INK, BTN_SOFT, badgeClass } from '@/lib/ui';
import { PageHeader } from '../components/common/PageHeader';
import { OnboardingWorkspaceHeader } from '../components/onboarding/OnboardingWorkspaceHeader';
import { ResizableSplitPane } from '../components/common/ResizableSplitPane';
import { ContentBusy } from '../components/common/ContentBusy';
import { trainingReducer, initialTrainingState, canSave } from './trainingState';

export function SaveCandidatePreview() {
  const [state, dispatch] = useReducer(trainingReducer, initialTrainingState);
  const [failNext, setFailNext] = useState(false);
  const [showWorkspace, setShowWorkspace] = useState(true);
  const pending = useRef(false);
  const sequence = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const save = () => {
    if (pending.current || !canSave(state)) return;
    pending.current = true;
    const requestId = ++sequence.current;
    const fail = failNext;
    setFailNext(false);
    dispatch({ type: 'start', requestId });
    timer.current = setTimeout(() => {
      dispatch({ type: fail ? 'failure' : 'success', requestId });
      pending.current = false;
    }, 650);
  };
  const reset = () => {
    if (timer.current) clearTimeout(timer.current);
    pending.current = false;
    setFailNext(false);
    dispatch({ type: 'reset' });
  };
  const dirty = state.draft.trim() !== state.candidate?.text;
  const fields = (
    <section data-slot="fields" className="p-5 space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-neutral-900">教给同事新的工作要求</h2>
        <p className="text-xs text-neutral-500 mt-2 leading-relaxed">先保存，再验证。保存培训不会改变正在进行的接待。</p>
      </div>
      <div>
        <label htmlFor="training-requirement" className={LABEL}>培训要求</label>
        <textarea id="training-requirement" rows={7} className={`${FIELD} py-3 leading-relaxed focus-visible:ring-2 focus-visible:ring-neutral-400`}
          value={state.draft} disabled={state.phase === 'saving'} aria-describedby="training-hint"
          onChange={e => dispatch({ type: 'edit', text: e.target.value })} />
        <p id="training-hint" className="text-xs text-neutral-500 mt-2">说明它应该如何处理工作，以及哪些情况需要转交同事。</p>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <button data-slot="save" type="button" className={`${BTN_INK} aria-disabled:opacity-50 aria-disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2`}
          aria-disabled={!canSave(state)} aria-busy={state.phase === 'saving'} onClick={save}>
          {state.phase === 'saving' ? '正在保存' : state.phase === 'failed' ? '重试保存' : '保存培训'}
        </button>
        <span className="text-xs text-neutral-500">{!state.draft.trim() ? '请填写培训要求' : state.phase === 'saved' && !dirty ? '已保存' : '有待保存的培训内容'}</span>
      </div>
      <div role={state.phase === 'failed' ? 'alert' : 'status'} aria-live="polite" className="min-h-10 text-xs leading-relaxed text-neutral-600">
        {state.message}
      </div>
    </section>
  );
  const evidence = (
    <section className="p-5 space-y-4" aria-label="培训存档">
      <div className="flex justify-between items-center gap-3">
        <h2 className="text-sm font-semibold">培训存档</h2>
        <span data-slot="candidate_status" className={badgeClass(state.candidate ? 'warning' : 'neutral')}>
          {state.candidate ? `${state.candidate.id} · 尚未应用` : '尚无候选存档'}
        </span>
      </div>
      <div data-slot="busy" className={`${PANEL} p-4`}>
        <ContentBusy busy={state.phase === 'saving'} size="panel" label="正在保存候选存档" minHeight={100}>
          {state.candidate ? <div className="space-y-3">
            <p className="text-xs font-semibold">{state.candidate.id} · 已保存的培训要求</p>
            <p className="text-xs text-neutral-600 whitespace-pre-wrap leading-relaxed">{state.candidate.text}</p>
            <p className="text-xs text-neutral-500">下一步：对这份存档进行能力测试。本次试跑仅验证保存流程。</p>
          </div> : <p className="text-xs text-neutral-500 leading-relaxed">保存后，新要求会出现在这里。当前使用的 V1 不受影响。</p>}
        </ContentBusy>
      </div>
      {state.candidate && dirty && <p className="text-xs text-neutral-600">你又修改了培训要求。请重新保存，新内容不会覆盖已保存的存档。</p>}
    </section>
  );
  return (
    <div className="min-h-screen bg-white text-neutral-800 font-sans">
      <div className="px-5 py-2 bg-neutral-100 text-xs text-neutral-500">交互试跑 · 演示数据，不影响实际员工或客户会话</div>
      {showWorkspace ? <>
        <div data-slot="context"><OnboardingWorkspaceHeader tabs={[{ id:'build', label:'入职培训' }]} activeTabId="build" onTabChange={() => {}} onBack={() => setShowWorkspace(false)} /></div>
        <main className={`${PAGE} max-w-6xl mx-auto`}>
          <PageHeader title="售后服务专员 · 入职培训" description="让新要求先成为可验证的培训存档。">
            <span className={badgeClass('success')}>在岗</span>
            <span className="text-xs" data-testid="active-version">当前上岗存档：{state.activeVersion}</span>
          </PageHeader>
          <div data-slot="layout" className={`${PANEL} min-h-96 overflow-hidden`}>
            <ResizableSplitPane minLeftPx={300} minRightPx={280} defaultRatio={0.58} left={fields} right={evidence} />
          </div>
        </main>
      </> : <main className={`${PAGE} max-w-6xl mx-auto`}>
        <PageHeader title="我的数字员工" description="试跑返回页，培训内容保留在当前会话中。" />
        <button type="button" className={`${BTN_INK} focus-visible:ring-2 focus-visible:ring-neutral-400`} onClick={() => setShowWorkspace(true)}>继续培训售后服务专员</button>
      </main>}
      <details className="max-w-6xl mx-auto px-5 pb-5 text-xs text-neutral-500">
        <summary className="cursor-pointer py-3 focus-visible:ring-2 focus-visible:ring-neutral-400">测试工具</summary>
        <div className="flex items-center gap-4 flex-wrap">
          <label className="flex gap-2 items-center"><input type="checkbox" checked={failNext} disabled={state.phase === 'saving'} onChange={e => setFailNext(e.target.checked)} />模拟下一次保存失败</label>
          <button type="button" className={`${BTN_SOFT} focus-visible:ring-2 focus-visible:ring-neutral-400`} onClick={reset}>重置演示</button>
        </div>
      </details>
    </div>
  );
}
