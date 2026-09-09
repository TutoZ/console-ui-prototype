import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = 'docs/digital-employee-playbook';
export function verifyBindings(manifest, rootDir = root) {
  const source = fs.readFileSync(path.join(rootDir, manifest.file), 'utf8');
  const ast = ts.createSourceFile(manifest.file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const errors = [];
  const imported = new Map();
  for (const stmt of ast.statements) {
    if (!ts.isImportDeclaration(stmt) || !ts.isStringLiteral(stmt.moduleSpecifier)) continue;
    const spec = stmt.moduleSpecifier.text;
    const stem = spec.startsWith('@/') ? path.join(rootDir, spec.slice(2)) : spec.startsWith('.') ? path.resolve(rootDir, path.dirname(manifest.file), spec) : null;
    const resolved = stem && ['', '.tsx', '.ts', '/index.tsx', '/index.ts'].map(ext => stem + ext).find(f => fs.existsSync(f) && fs.statSync(f).isFile());
    const bindings = stmt.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) for (const b of bindings.elements) imported.set(b.name.text, { source: resolved && path.relative(rootDir, resolved), symbol: (b.propertyName ?? b.name).text });
  }
  const slots = new Map();
  const allIdentifiers = new Set();
  function walk(node) {
    if (ts.isIdentifier(node)) allIdentifiers.add(node.text);
    const opening = ts.isJsxElement(node) ? node.openingElement : ts.isJsxSelfClosingElement(node) ? node : null;
    if (opening) {
      const attr = opening.attributes.properties.find(a => ts.isJsxAttribute(a) && a.name.getText(ast) === 'data-slot');
      if (attr?.initializer && ts.isStringLiteral(attr.initializer)) {
        const id = attr.initializer.text;
        if (slots.has(id)) errors.push(`duplicate_rendered_slot:${id}`);
        slots.set(id, node);
      }
    }
    ts.forEachChild(node, walk);
  }
  walk(ast);
  function identifiers(node) {
    const result = new Set();
    function visit(n) { if (ts.isIdentifier(n)) result.add(n.text); ts.forEachChild(n, visit); }
    visit(node); return result;
  }
  for (const binding of manifest.bindings) {
    const subtree = slots.get(binding.slot);
    if (!subtree) { errors.push(`missing_rendered_slot:${binding.slot}`); continue; }
    const refs = identifiers(subtree);
    const actual = imported.get(binding.symbol);
    if (!actual || actual.source !== binding.source || actual.symbol !== binding.symbol) errors.push(`wrong_import:${binding.slot}:${binding.symbol}`);
    if (!refs.has(binding.symbol)) errors.push(`unused_in_slot:${binding.slot}:${binding.symbol}`);
    for (const token of binding.tokens) {
      if (token.placement === 'component_internal') {
        const internal = fs.readFileSync(path.join(rootDir, binding.source), 'utf8');
        if (!internal.includes(token.symbol)) errors.push(`missing_internal_token:${binding.slot}:${token.symbol}`);
      } else {
        if (imported.get(token.symbol)?.source !== 'lib/ui.ts' || !refs.has(token.symbol)) errors.push(`missing_applied_token:${binding.slot}:${token.symbol}`);
      }
    }
  }
  // This sample intentionally exposes no apply action and no raw color literals.
  if (/#[0-9a-fA-F]{3,8}\b/.test(source)) errors.push('raw_color_literal');
  return { file: manifest.file, status: errors.length ? 'failed' : 'passed', errors, checked_slots: manifest.bindings.length,
    scope: 'AST import and slot identifier usage; computed styles and behavior require browser evidence' };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const manifestPath = process.argv[2] || `${base}/runs/save-candidate/bindings.json`;
  const report = verifyBindings(JSON.parse(fs.readFileSync(manifestPath, 'utf8')));
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.status === 'passed' ? 0 : 1;
}
