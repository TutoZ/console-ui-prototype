"""Read-only knowledge/plan checks. Does not execute UI or authorize release."""
from __future__ import annotations
import argparse
import hashlib
import json
import re
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
ROOT = BASE.parents[1]
KEYS = ('domain', 'object', 'action', 'outcome')


def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8'))


def route(intent, catalog):
    missing = [k for k in KEYS if not isinstance(intent.get(k), str) or not intent[k].strip()]
    if missing:
        return {'status': 'needs_clarification', 'missing': missing}
    matches = [t for t in catalog['templates'] if all(t[k] == intent[k] for k in KEYS)]
    if not matches:
        return {'status': 'no_match', 'reason': 'No exact domain/object/action/outcome recipe; do not fall back.'}
    if len(matches) > 1:
        return {'status': 'ambiguous', 'candidates': [t['id'] for t in matches]}
    return {'status': 'matched', 'template': matches[0]}


def catalog_errors(catalog, units, root=ROOT):
    errors = []
    def fail(code, detail):
        errors.append({'code': code, 'detail': detail})
    def exported(source, symbol):
        path = root / source
        if not path.is_file():
            fail('missing_source', source)
            return
        text = path.read_text(encoding='utf-8')
        if not re.search(r'export\s+(?:async\s+)?(?:const|function|class)\s+' + re.escape(symbol) + r'\b', text):
            fail('missing_export', f'{source}:{symbol}')
    for source, expected in catalog['sources'].items():
        path = root / source
        if not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest() != expected:
            fail('source_drift', source)
    for key, token in catalog['tokens'].items():
        for symbol in token['symbols']:
            exported(token['source'], symbol)
    for key, comp in catalog['components'].items():
        exported(comp['source'], comp['symbol'])
        for token in comp['tokens']:
            if token not in catalog['tokens']:
                fail('unknown_token', f'{key}:{token}')
    unit_ids = {u['id'] for u in units['units']}
    if len(unit_ids) != len(units['units']):
        fail('duplicate_unit', 'atomic-cases.json')
    ids, signatures = set(), set()
    for template in catalog['templates']:
        signature = tuple(template[k] for k in KEYS)
        if template['id'] in ids or signature in signatures:
            fail('duplicate_template', template['id'])
        ids.add(template['id']); signatures.add(signature)
        for rule in template['domain_rules']:
            meta = catalog['domain_rules'].get(rule)
            if not meta or meta['domain'] != template['domain']:
                fail('domain_contamination', f'{template["id"]}:{rule}')
        slots = set()
        for slot in template['slots']:
            if slot['id'] in slots:
                fail('duplicate_slot', slot['id'])
            slots.add(slot['id'])
            comp = catalog['components'].get(slot['component'])
            if not comp:
                fail('unknown_component', slot['component'])
            elif any(t not in comp['tokens'] or t not in catalog['tokens'] for t in slot['tokens']):
                fail('invalid_slot_token', f'{template["id"]}:{slot["id"]}')
        for unit in template['required_units']:
            if unit not in unit_ids:
                fail('unknown_unit', unit)
    return errors


def plan_errors(plan, catalog):
    errors = []
    def fail(code, detail):
        errors.append({'code': code, 'detail': detail})
    selection = route(plan, catalog)
    if selection['status'] != 'matched':
        fail('intent_' + selection['status'], selection)
        return errors
    template = selection['template']
    if plan.get('template_id') != template['id']:
        fail('wrong_template', plan.get('template_id'))
    if plan.get('action') in plan.get('excluded_actions', []):
        fail('excluded_action', plan['action'])
    if plan.get('evidence_mode') not in ['prototype', 'integration']:
        fail('invalid_evidence_mode', plan.get('evidence_mode'))
    context = plan.get('entity_context', {})
    if not all(isinstance(context.get(k), str) and context[k].strip() for k in ['teamId', 'employeeId']):
        fail('missing_entity_context', 'teamId/employeeId required')
    supplied_rules = plan.get('domain_rules', [])
    if set(supplied_rules) != set(template['domain_rules']):
        fail('domain_rule_scope', supplied_rules)
    if len(supplied_rules) != len(set(supplied_rules)):
        fail('duplicate_rule', supplied_rules)
    for rule in supplied_rules:
        if rule not in catalog['domain_rules'] or catalog['domain_rules'][rule]['domain'] != plan['domain']:
            fail('domain_contamination', rule)
    if set(plan.get('product_rules', [])) != set(catalog['product_rules']):
        fail('product_guard_missing', plan.get('product_rules'))
    expected = {s['id']: s for s in template['slots']}
    seen = set()
    for slot in plan.get('slots', []):
        sid = slot.get('id')
        if sid in seen:
            fail('duplicate_slot', sid)
        seen.add(sid)
        if sid not in expected:
            fail('unplanned_slot', sid)
            continue
        target = expected[sid]
        if slot.get('component') != target['component']:
            fail('component_binding_mismatch', sid)
        # Exact binding prevents assigning a visually valid AI token to a save action.
        if slot.get('tokens') != target['tokens']:
            fail('token_binding_mismatch', sid)
    for sid, slot in expected.items():
        if slot['required'] and sid not in seen:
            fail('missing_slot', sid)
    ids = plan.get('unit_ids', [])
    if len(ids) != len(set(ids)):
        fail('duplicate_unit', ids)
    if set(ids) != set(template['required_units']):
        fail('unit_scope_mismatch', ids)
    return errors


def inspect_results(plan, results, units, evidence_root):
    """Checks evidence manifests, not whether the supplied observations are truthful."""
    problems = []
    statuses = {'passed', 'failed', 'blocked', 'not_run', 'not_applicable'}
    required = set(plan['unit_ids'])
    records = results.get('units', [])
    seen = set()
    if results.get('task_id') != plan.get('task_id') or results.get('mode') != plan.get('evidence_mode'):
        problems.append('task_or_environment_mismatch')
    expected_kinds = {u['id']: u['evidence_kind'] for u in units['units']}
    for record in records:
        uid = record.get('id')
        if uid in seen or uid not in required:
            problems.append(f'{uid}:duplicate_or_unplanned')
        seen.add(uid)
        status = record.get('status')
        if status not in statuses:
            problems.append(f'{uid}:invalid_status')
        if status != 'passed':
            problems.append(f'{uid}:{status}')
            continue
        evidence = record.get('evidence', [])
        if not evidence:
            problems.append(f'{uid}:missing_evidence')
        if not str(record.get('observed', '')).strip():
            problems.append(f'{uid}:missing_observation')
        if not any(e.get('kind') == expected_kinds.get(uid) for e in evidence):
            problems.append(f'{uid}:wrong_evidence_kind')
        for ev in evidence:
            relative = ev.get('path', '')
            path = (evidence_root / relative).resolve()
            if not relative or not path.is_relative_to(evidence_root.resolve()) or not path.is_file() or path.stat().st_size == 0:
                problems.append(f'{uid}:missing_or_invalid_evidence_file')
    for uid in required - seen:
        problems.append(f'{uid}:missing_result')
    return {'status': 'incomplete' if problems else 'ready_for_human_review', 'problems': problems,
            'semantic_verified': False, 'release_authorized': False}


def evaluate(plan, catalog, units, results=None, evidence_root=BASE, root=ROOT):
    errors = catalog_errors(catalog, units, root) + plan_errors(plan, catalog)
    report = {
        'task_id': plan.get('task_id'), 'scope': 'knowledge_plan_and_evidence_manifest_only',
        'static_status': 'failed' if errors else 'passed', 'errors': errors,
        'runtime_status': 'not_verified', 'visual_status': 'not_verified',
        'business_status': 'not_verified', 'release_authorized': False,
        'unresolved_gaps': catalog['known_gaps'],
    }
    report['evidence'] = inspect_results(plan, results, units, evidence_root) if results is not None and not errors else {'status': 'not_checked', 'semantic_verified': False}
    report['next_action'] = '修正规划/映射后重检' if errors else '执行原子用例与组合用例，补运行证据并由评审者核验；品牌/组件缺口另行处理'
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['route', 'check'])
    parser.add_argument('--plan', type=Path, required=True)
    parser.add_argument('--results', type=Path)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    catalog, units, plan = read(BASE/'catalog.json'), read(BASE/'atomic-cases.json'), read(args.plan)
    if args.command == 'route':
        output = route(plan, catalog)
        code = 0 if output['status'] == 'matched' else 1
    else:
        results = read(args.results) if args.results else None
        output = evaluate(plan, catalog, units, results, args.results.parent if args.results else BASE)
        code = 0 if output['static_status'] == 'passed' and (results is None or output['evidence']['status'] == 'ready_for_human_review') else 1
    rendered = json.dumps(output, ensure_ascii=False, indent=2) + '\n'
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(rendered, encoding='utf-8')
    print(rendered, end='')
    return code

if __name__ == '__main__':
    raise SystemExit(main())
