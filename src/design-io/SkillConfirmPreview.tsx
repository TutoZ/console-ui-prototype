import React, { useState } from 'react';
import { SkillRoundConfirmCard, type SkillConfirmItem } from '../components/skills/SkillRoundConfirmCard';
import { PAGE, PANEL, BTN_SOFT, FIELD, LABEL } from '../../lib/ui';

export function SkillConfirmPreview() {
  const [revision, setRevision] = useState(1);
  const [content, setContent] = useState('查询订单进度。');
  const [confirmed, setConfirmed] = useState<number[]>([]);
  const items = (n: number): SkillConfirmItem[] => [{ id: `scope-${n}`, label: `方案 ${n}：查询订单进度；${n === 1 ? '无权限转人工。' : '无权限或无记录时转人工，不编造结果。'}`, checked: true }];
  return <main className={`${PAGE} min-h-screen`}>
    <h1 className="text-xl font-semibold mb-2">Skill 确认写入 · 交互试跑</h1>
    <p className="text-xs text-neutral-500 mb-4">演示数据。确认后更新右侧内容；新方案出现后旧方案只读。</p>
    <button type="button" className={`${BTN_SOFT} mb-4 focus-visible:ring-2 focus-visible:ring-neutral-800`} onClick={() => setRevision(r => r + 1)}>生成下一方案</button>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
      <section data-slot="confirmation" aria-label="方案确认" className="space-y-3">
        {Array.from({length: revision}, (_, i) => i + 1).map(n => <SkillRoundConfirmCard key={n} title={`确认方案 ${n}`} items={items(n)} locked={n !== revision} confirmed={confirmed.includes(n)} onConfirm={selected => {
          if (n !== revision || confirmed.includes(n)) return;
          setContent(selected.filter(x => x.checked).map(x => x.value || x.label).join('\n'));
          setConfirmed(old => [...old, n]);
        }} />)}
      </section>
      <section data-slot="content" className={`${PANEL} p-4`}>
        <label htmlFor="skill-preview-content" className={LABEL}>当前 Skill 内容</label>
        <textarea id="skill-preview-content" className={`${FIELD} w-full min-h-48`} value={content} onChange={e => setContent(e.target.value)} />
        <p role="status" className="text-xs text-neutral-500 mt-2">{confirmed.includes(revision) ? `方案 ${revision} 已写入` : '当前方案尚未写入'}</p>
      </section>
    </div>
  </main>;
}
