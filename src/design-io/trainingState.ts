/** Isolated prototype state: never reads or writes real employee storage. */
export type Candidate = { id: string; text: string };
export type TrainingState = {
  draft: string;
  activeVersion: string;
  candidate: Candidate | null;
  phase: 'idle' | 'saving' | 'saved' | 'failed';
  requestId: number | null;
  message: string;
};
export type TrainingEvent =
  | { type: 'edit'; text: string }
  | { type: 'start'; requestId: number }
  | { type: 'success'; requestId: number }
  | { type: 'failure'; requestId: number }
  | { type: 'reset' };
export const initialTrainingState: TrainingState = {
  draft: '只回答员工知识中有依据的问题；超出岗位权限时转交值班同事。',
  activeVersion: 'V1', candidate: null, phase: 'idle', requestId: null, message: '',
};
export function canSave(state: TrainingState): boolean {
  return Boolean(state.draft.trim()) && state.phase !== 'saving' && state.draft.trim() !== state.candidate?.text;
}
export function trainingReducer(state: TrainingState, event: TrainingEvent): TrainingState {
  if (event.type === 'reset') return { ...initialTrainingState };
  if (event.type === 'edit') {
    if (state.phase === 'saving') return state;
    return { ...state, draft: event.text, phase: 'idle', message: '' };
  }
  if (event.type === 'start') {
    if (!canSave(state)) return state;
    return { ...state, phase: 'saving', requestId: event.requestId, message: '正在保存培训内容…' };
  }
  if (state.phase !== 'saving' || event.requestId !== state.requestId) return state;
  if (event.type === 'failure') return { ...state, phase: 'failed', requestId: null, message: '保存失败，培训内容已保留。请重试。' };
  return {
    ...state, phase: 'saved', requestId: null,
    candidate: { id: `V${Number(state.candidate?.id.slice(1) ?? 1) + 1}`, text: state.draft.trim() },
    message: '已保存候选存档，尚未应用。当前仍使用 V1 接待。',
  };
}
