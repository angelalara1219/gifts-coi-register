const test = require('node:test');
const assert = require('node:assert');
const { evaluateGift, evaluateDisclosure, attestationStatus, crossCheckConflicts, RESULT } = require('../src/Rules.gs');
const { loadProject } = require('./mock-sheets');

const gift = (over = {}) => Object.assign({
  date: '2026-06-01', direction: 'Given', counterparty: 'Acme', counterpartyType: 'Private',
  description: 'Lunch', value: 50, businessPurpose: 'Project kickoff',
}, over);

test('small private gift is log-only', () => {
  assert.equal(evaluateGift(gift(), []).result, RESULT.ALLOWED);
});

test('approval tiers by value', () => {
  assert.equal(evaluateGift(gift({ value: 180 }), []).result, RESULT.MANAGER);
  assert.equal(evaluateGift(gift({ value: 400 }), []).result, RESULT.COMPLIANCE);
});

test('cash equivalents are always prohibited, even when small', () => {
  const out = evaluateGift(gift({ description: '$25 Gift Card', value: 25 }), []);
  assert.equal(out.result, RESULT.PROHIBITED);
});

test('anything to a government official needs Compliance; travel or $100+ adds Legal', () => {
  assert.equal(evaluateGift(gift({ counterpartyType: 'Government official', value: 20 }), []).result, RESULT.COMPLIANCE);
  assert.equal(evaluateGift(gift({ counterpartyType: 'Government official', value: 150 }), []).result, RESULT.LEGAL);
  assert.equal(evaluateGift(gift({ counterpartyType: 'Government official', value: 0, description: 'Hotel stay' }), []).result, RESULT.LEGAL);
});

test('vendor in an active bid: decline what is received, do not give', () => {
  assert.equal(evaluateGift(gift({ direction: 'Received', counterpartyType: 'Vendor in active bid' }), []).result, RESULT.DECLINE);
  assert.equal(evaluateGift(gift({ counterpartyType: 'Vendor in active bid' }), []).result, RESULT.PROHIBITED);
});

test('missing business purpose is incomplete', () => {
  assert.equal(evaluateGift(gift({ businessPurpose: ' ' }), []).result, RESULT.INCOMPLETE);
});

test('many small gifts to one counterparty escalate to Compliance', () => {
  const history = [gift({ date: '2026-01-10', value: 95 }), gift({ date: '2026-03-10', value: 95 }),
                   gift({ date: '2026-04-10', value: 240 })];
  const out = evaluateGift(gift({ date: '2026-05-10', value: 90 }), history);
  assert.equal(out.result, RESULT.COMPLIANCE);
  assert.match(out.reasons.join(' '), /Pattern: \$520/);
});

test('pattern check ignores entries older than 12 months and later entries', () => {
  const history = [gift({ date: '2025-01-01', value: 900 }), gift({ date: '2026-12-01', value: 900 })];
  assert.equal(evaluateGift(gift({ value: 90 }), history).result, RESULT.ALLOWED);
});

test('gift to a counterparty the employee has a disclosed conflict with escalates', () => {
  const out = crossCheckConflicts(evaluateGift(gift({ value: 40 }), []), 'Jordan Ellis', 'Acme',
    [{ employee: 'jordan ellis', relatedParty: 'ACME', type: 'Financial interest' }]);
  assert.equal(out.result, RESULT.COMPLIANCE);
  assert.match(out.reasons.join(' '), /disclosed a financial interest involving Acme/);
  const clean = crossCheckConflicts(evaluateGift(gift({ value: 40 }), []), 'Someone Else', 'Acme',
    [{ employee: 'Jordan Ellis', relatedParty: 'Acme', type: 'Financial interest' }]);
  assert.equal(clean.result, RESULT.ALLOWED);
});

test('conflicts of interest risk levels', () => {
  assert.equal(evaluateDisclosure({ overlap: 'Competitor', influence: 'Yes' }).risk, 'High');
  assert.equal(evaluateDisclosure({ overlap: 'Vendor', influence: 'Yes', relatedParty: 'Apex' }).risk, 'High');
  assert.equal(evaluateDisclosure({ overlap: 'Customer', influence: 'No' }).risk, 'Medium');
  assert.equal(evaluateDisclosure({ type: 'Board seat', overlap: 'None', influence: 'No' }).risk, 'Medium');
  assert.equal(evaluateDisclosure({ type: 'Outside employment', overlap: 'None', influence: 'No' }).risk, 'Low');
});

test('attestation status', () => {
  const today = '2026-11-14';
  assert.equal(attestationStatus('', today), 'Never attested');
  assert.equal(attestationStatus('2025-10-01', today), 'Overdue');
  assert.equal(attestationStatus('2025-12-01', today), 'Due soon');
  assert.equal(attestationStatus('2026-06-01', today), 'Current');
});

test('full Apps Script run: setup, sample data, review, dashboard, audit log', () => {
  const { context, sheets } = loadProject();
  context.onOpen();
  context.loadSampleData();

  const gifts = sheets['Gifts & Hospitality'].grid;
  const results = gifts.slice(1).map(r => r[9]);
  assert.ok(results.includes('Prohibited'), 'gift card should be prohibited');
  assert.ok(results.includes('Decline'), 'gift from vendor in bid should be declined');
  assert.ok(results.includes('Needs Compliance + Legal review'), 'official travel needs Legal');
  assert.ok(results.includes('Incomplete'), 'missing purpose is incomplete');
  assert.ok(gifts.slice(1).some(r => /Pattern/.test(r[11])), 'Northwind gifts should trip the pattern check');
  assert.ok(gifts.slice(1).some(r => /Conflict of interest: Jordan Ellis/.test(r[11])),
    "Jordan's Northwind gifts should be cross-checked against the Northwind shares disclosure");

  const coiRisks = sheets['Conflicts of Interest'].grid.slice(1).map(r => r[8]);
  assert.deepEqual([...new Set(coiRisks)].sort(), ['High', 'Low', 'Medium']);
  const attest = sheets['Attestations'].grid.slice(1).map(r => r[3]);
  assert.ok(attest.includes('Never attested'));
  assert.ok(sheets['Dashboard'].grid.flat().includes('Waiting on a decision'));

  // A reviewer records a decision -> stamped and logged.
  const sheet = sheets['Gifts & Hospitality'];
  const range = sheet.getRange(5, 13);
  range.setValue('Approved with conditions');
  context.onEdit({ range, value: 'Approved with conditions', oldValue: undefined });
  assert.equal(sheet.grid[4][13], 'reviewer@example.com');
  const log = sheets['Audit Log'].grid;
  assert.match(String(log[log.length - 1][4]), /Approved with conditions/);
});

test('edits outside the Decision column are not logged', () => {
  const { context, sheets } = loadProject();
  context.loadSampleData();
  const before = sheets['Audit Log'].grid.length;
  const range = sheets['Gifts & Hospitality'].getRange(3, 8);
  context.onEdit({ range, value: 999 });
  assert.equal(sheets['Audit Log'].grid.length, before);
});
