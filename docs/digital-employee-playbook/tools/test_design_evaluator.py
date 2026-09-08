import copy
import tempfile
import unittest
from pathlib import Path
from design_evaluator import BASE, read, route, plan_errors, catalog_errors, inspect_results, evaluate

class EvaluatorTests(unittest.TestCase):
    def setUp(self):
        self.catalog = read(BASE/'catalog.json')
        self.units = read(BASE/'atomic-cases.json')
        self.plan = read(BASE/'examples/save-plan.json')
    def codes(self, plan):
        return {e['code'] for e in plan_errors(plan, self.catalog)}
    def test_all_four_intents_match(self):
        for t in self.catalog['templates']:
            self.assertEqual(route(t, self.catalog)['template']['id'], t['id'])
    def test_missing_action_requires_clarification(self):
        self.plan.pop('action')
        self.assertEqual(route(self.plan, self.catalog)['status'], 'needs_clarification')
    def test_same_words_in_qc_do_not_fall_back(self):
        self.plan['domain'] = 'quality_inspection'
        self.assertEqual(route(self.plan, self.catalog)['status'], 'no_match')
    def test_multiple_actions_do_not_guess(self):
        self.plan['action'] = 'save_and_apply'
        self.assertEqual(route(self.plan, self.catalog)['status'], 'no_match')
    def test_ambiguous_catalog_does_not_pick_first(self):
        self.catalog['templates'].append(copy.deepcopy(self.catalog['templates'][0]))
        self.assertEqual(route(self.plan, self.catalog)['status'], 'ambiguous')
    def test_valid_plan(self):
        self.assertEqual(plan_errors(self.plan, self.catalog), [])
    def test_wrong_template(self):
        self.plan['template_id'] = 'TPL-APPLY'
        self.assertIn('wrong_template', self.codes(self.plan))
    def test_apply_rule_contaminates_save(self):
        self.plan['domain_rules'].append('DOM-OS-04')
        self.assertIn('domain_rule_scope', self.codes(self.plan))
    def test_unknown_domain_rule_rejected(self):
        self.plan['domain_rules'].append('DOM-QC-99')
        self.assertIn('domain_contamination', self.codes(self.plan))
    def test_missing_required_slot(self):
        self.plan['slots'].pop()
        self.assertIn('missing_slot', self.codes(self.plan))
    def test_unrequested_growth_chart(self):
        self.plan['slots'].append({'id':'growth_chart','component':'CMP-TABLE','tokens':['K-TABLE']})
        self.assertIn('unplanned_slot', self.codes(self.plan))
    def test_valid_but_wrong_token(self):
        self.plan['slots'][3]['tokens'] = ['K-AI']
        self.assertIn('token_binding_mismatch', self.codes(self.plan))
    def test_wrong_component(self):
        self.plan['slots'][3]['component'] = 'CMP-DIALOG'
        self.assertIn('component_binding_mismatch', self.codes(self.plan))
    def test_missing_atomic_unit(self):
        self.plan['unit_ids'].pop()
        self.assertIn('unit_scope_mismatch', self.codes(self.plan))
    def test_entity_required(self):
        self.plan['entity_context'].pop('teamId')
        self.assertIn('missing_entity_context', self.codes(self.plan))
    def test_excluded_action(self):
        self.plan['excluded_actions'].append('save_candidate')
        self.assertIn('excluded_action', self.codes(self.plan))
    def test_unknown_export_is_caught(self):
        self.catalog['tokens']['K-PRIMARY']['symbols']=['NON_EXISTING_DESIGN_TOKEN']
        errors=catalog_errors(self.catalog,self.units)
        self.assertIn('missing_export',{e['code'] for e in errors})
    def test_source_drift_is_caught(self):
        self.catalog['sources']['lib/ui.ts']='outdated'
        self.assertIn('source_drift',{e['code'] for e in catalog_errors(self.catalog,self.units)})
    def test_false_pass_without_evidence(self):
        r=read(BASE/'examples/save-results-not-run.json')
        for u in r['units']:u['status']='passed'
        result=inspect_results(self.plan,r,self.units,BASE)
        self.assertEqual(result['status'],'incomplete')
        self.assertTrue(any('missing_evidence' in p for p in result['problems']))
    def test_not_run_stays_incomplete(self):
        r=read(BASE/'examples/save-results-not-run.json')
        result=inspect_results(self.plan,r,self.units,BASE)
        self.assertEqual(result['status'],'incomplete')
    def test_evidence_does_not_authorize_release(self):
        r=read(BASE/'examples/save-results-not-run.json')
        kinds={u['id']:u['evidence_kind'] for u in self.units['units']}
        with tempfile.TemporaryDirectory() as d:
            evidence=Path(d)/'fixture.txt';evidence.write_text('Synthetic test fixture, not product evidence')
            for u in r['units']:
                u.update(status='passed',observed='synthetic observation',evidence=[{'path':'fixture.txt','kind':kinds[u['id']]}])
            result=inspect_results(self.plan,r,self.units,Path(d))
            self.assertEqual(result['status'],'ready_for_human_review')
            self.assertFalse(result['semantic_verified'])
            self.assertFalse(result['release_authorized'])
    def test_wrong_environment_rejected(self):
        r=read(BASE/'examples/save-results-not-run.json');r['mode']='integration'
        self.assertIn('task_or_environment_mismatch',inspect_results(self.plan,r,self.units,BASE)['problems'])
    def test_static_pass_never_implies_runtime_pass(self):
        result=evaluate(self.plan,self.catalog,self.units)
        self.assertEqual(result['static_status'],'passed')
        self.assertEqual(result['runtime_status'],'not_verified')
        self.assertFalse(result['release_authorized'])

if __name__ == '__main__':
    unittest.main(verbosity=2)
