import { test } from 'node:test';
import assert from 'node:assert/strict';
import { trainingReducer as reduce, initialTrainingState as initial, canSave } from './trainingState';
test('AU-S01 保存不能改变在岗版本', () => {
  const saved = reduce(reduce(initial, { type:'start', requestId:1 }), { type:'success', requestId:1 });
  assert.equal(saved.activeVersion, 'V1');
});
test('AU-S02 重复回执只产生一个候选存档', () => {
  const pending = reduce(initial, { type:'start', requestId:1 });
  const saved = reduce(pending, { type:'success', requestId:1 });
  assert.equal(saved.candidate?.id, 'V2');
  assert.deepEqual(reduce(saved, { type:'success', requestId:1 }), saved);
});
test('AU-S03 保存失败不丢草稿', () => {
  const edited = reduce(initial, { type:'edit', text:'新的培训要求' });
  const failed = reduce(reduce(edited, { type:'start', requestId:1 }), { type:'failure', requestId:1 });
  assert.equal(failed.draft, edited.draft);
  assert.equal(failed.candidate, null);
});
test('AU-S04 失败后可以重试成功', () => {
  const failed = reduce(reduce(initial, { type:'start', requestId:1 }), { type:'failure', requestId:1 });
  assert.ok(canSave(failed));
  const saved = reduce(reduce(failed, { type:'start', requestId:2 }), { type:'success', requestId:2 });
  assert.equal(saved.phase, 'saved');
});
test('旧请求不能覆盖新请求', () => {
  const pending = reduce(initial, { type:'start', requestId:2 });
  assert.deepEqual(reduce(pending, { type:'success', requestId:1 }), pending);
});
test('空白输入和保存中禁止重复提交', () => {
  assert.equal(canSave(reduce(initial, { type:'edit', text:'  ' })), false);
  const pending = reduce(initial, { type:'start', requestId:1 });
  assert.deepEqual(reduce(pending, { type:'start', requestId:2 }), pending);
});
test('修改草稿不改写已保存候选', () => {
  const saved = reduce(reduce(initial, { type:'start', requestId:1 }), { type:'success', requestId:1 });
  const edited = reduce(saved, { type:'edit', text:'不同的要求' });
  assert.equal(edited.candidate?.text, initial.draft);
  assert.equal(edited.activeVersion, 'V1');
  assert.ok(canSave(edited));
});
