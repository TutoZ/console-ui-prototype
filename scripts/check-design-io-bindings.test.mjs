import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { verifyBindings } from './check-design-io-bindings.mjs';
const load = () => JSON.parse(fs.readFileSync('docs/digital-employee-playbook/runs/save-candidate/bindings.json','utf8'));
test('真实组件与槽位引用通过',()=>assert.equal(verifyBindings(load()).status,'passed'));
test('同名独立包不能冒充本地源码',()=>{const m=load();m.bindings[0].source='packages/joysupport-ui/src/components/PageHeader.tsx';assert.equal(verifyBindings(m).status,'failed');});
test('存在但没使用的Token不能通过',()=>{const m=load();m.bindings[3].tokens=[{symbol:'BTN_AI_TEXT',placement:'element'}];assert.equal(verifyBindings(m).status,'failed');});
test('未渲染槽位不能通过',()=>{const m=load();m.bindings[0].slot='imaginary_slot';assert.equal(verifyBindings(m).status,'failed');});
