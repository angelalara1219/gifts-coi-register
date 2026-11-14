/**
 * Gifts, Hospitality & Conflicts of Interest Register for Google Sheets.
 *
 * Adds a "Compliance" menu that:
 *   - sets up the register tabs with dropdowns
 *   - reviews every entry against the policy rules (Rules.gs, Policy.gs)
 *   - refreshes a dashboard
 * and keeps an audit log whenever someone records a decision.
 *
 * The rules recommend; people decide. Nothing is approved automatically.
 */

/* global evaluateGift, crossCheckConflicts, evaluateDisclosure, attestationStatus, RESULT, SAMPLE_GIFTS, SAMPLE_COI, SAMPLE_ATTESTATIONS */

var SHEETS = {
  gifts: 'Gifts & Hospitality',
  coi: 'Conflicts of Interest',
  attest: 'Attestations',
  dashboard: 'Dashboard',
  audit: 'Audit Log'
};

var HEADERS = {
  gifts: ['Date', 'Employee', 'Department', 'Direction', 'Counterparty', 'Counterparty type',
          'Description', 'Value (USD)', 'Business purpose',
          'Result', 'Required approver', 'Why', 'Decision', 'Decided by', 'Decided on'],
  coi: ['Disclosed on', 'Employee', 'Department', 'Type', 'Related party', 'Overlap',
        'Employee influences decisions?', 'Description',
        'Risk', 'Required approver', 'Mitigation', 'Decision', 'Decided by', 'Decided on'],
  attest: ['Employee', 'Department', 'Last attested', 'Status'],
  audit: ['Timestamp', 'User', 'Sheet', 'Row', 'Change']
};

var DROPDOWNS = {
  gifts: { 'Direction': ['Given', 'Received'],
           'Counterparty type': ['Private', 'Government official', 'Vendor in active bid'],
           'Decision': ['Approved', 'Approved with conditions', 'Rejected', 'Returned or donated'] },
  coi: { 'Type': ['Outside employment', 'Board seat', 'Financial interest', 'Family relationship', 'Side business'],
         'Overlap': ['None', 'Vendor', 'Customer', 'Partner', 'Competitor'],
         'Employee influences decisions?': ['Yes', 'No'],
         'Decision': ['Acknowledged', 'Approved with mitigation', 'Not permitted'] }
};

var COLORS = { red: '#fbebeb', orange: '#f9ece7', yellow: '#f9eeda', green: '#e5f4e4', gray: '#f0efec' };

// ------------------------------------------------------------------ menu

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Compliance')
    .addItem('Review all entries', 'reviewAll')
    .addItem('Refresh dashboard', 'refreshDashboard')
    .addSeparator()
    .addItem('Set up register tabs', 'setUpSheets')
    .addItem('Load sample data (synthetic)', 'loadSampleData')
    .addToUi();
}

// ------------------------------------------------------------------ setup

function setUpSheets() {
  var ss = SpreadsheetApp.getActive();
  ['gifts', 'coi', 'attest', 'audit'].forEach(function (key) {
    var sheet = ss.getSheetByName(SHEETS[key]) || ss.insertSheet(SHEETS[key]);
    sheet.getRange(1, 1, 1, HEADERS[key].length).setValues([HEADERS[key]])
      .setFontWeight('bold').setBackground(COLORS.gray);
    sheet.setFrozenRows(1);
    var drops = DROPDOWNS[key] || {};
    Object.keys(drops).forEach(function (header) {
      var col = HEADERS[key].indexOf(header) + 1;
      var rule = SpreadsheetApp.newDataValidation().requireValueInList(drops[header], true).build();
      sheet.getRange(2, col, 999, 1).setDataValidation(rule);
    });
  });
  if (!ss.getSheetByName(SHEETS.dashboard)) ss.insertSheet(SHEETS.dashboard, 0);
}

function loadSampleData() {
  setUpSheets();
  var ss = SpreadsheetApp.getActive();
  writeRows_(ss.getSheetByName(SHEETS.gifts), SAMPLE_GIFTS);
  writeRows_(ss.getSheetByName(SHEETS.coi), SAMPLE_COI);
  writeRows_(ss.getSheetByName(SHEETS.attest), SAMPLE_ATTESTATIONS);
  reviewAll();
}

function writeRows_(sheet, rows) {
  if (!rows.length) return;
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
  }
  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

// ------------------------------------------------------------------ review

function reviewAll() {
  var ss = SpreadsheetApp.getActive();
  reviewGifts_(ss.getSheetByName(SHEETS.gifts));
  reviewDisclosures_(ss.getSheetByName(SHEETS.coi));
  reviewAttestations_(ss.getSheetByName(SHEETS.attest));
  refreshDashboard();
}

function readTable_(sheet, key) {
  var last = sheet.getLastRow();
  if (last < 2) return [];
  var values = sheet.getRange(2, 1, last - 1, HEADERS[key].length).getValues();
  return values.map(function (row, i) {
    var obj = { _row: i + 2 };
    HEADERS[key].forEach(function (h, c) { obj[h] = row[c]; });
    return obj;
  }).filter(function (o) {
    return String(o[HEADERS[key][0]]).trim() !== '' || String(o[HEADERS[key][1]]).trim() !== '';
  });
}

function reviewGifts_(sheet) {
  var rows = readTable_(sheet, 'gifts');
  var disclosures = readTable_(SpreadsheetApp.getActive().getSheetByName(SHEETS.coi), 'coi')
    .map(function (d) { return { employee: d['Employee'], relatedParty: d['Related party'], type: d['Type'] }; });
  var entries = rows.map(function (r) {
    return { date: r['Date'], direction: r['Direction'], counterparty: r['Counterparty'],
             counterpartyType: r['Counterparty type'], description: r['Description'],
             value: r['Value (USD)'], businessPurpose: r['Business purpose'] };
  });
  var col = HEADERS.gifts.indexOf('Result') + 1;
  rows.forEach(function (r, i) {
    var out = evaluateGift(entries[i], entries, null);
    if (out.result !== RESULT.PROHIBITED && out.result !== RESULT.DECLINE) {
      crossCheckConflicts(out, r['Employee'], r['Counterparty'], disclosures);
    }
    sheet.getRange(r._row, col, 1, 3).setValues([[out.result, out.approver, out.reasons.join('; ')]]);
    sheet.getRange(r._row, col).setBackground(colorForGift_(out.result));
  });
}

function reviewDisclosures_(sheet) {
  var col = HEADERS.coi.indexOf('Risk') + 1;
  readTable_(sheet, 'coi').forEach(function (r) {
    var out = evaluateDisclosure({ type: r['Type'], relatedParty: r['Related party'], overlap: r['Overlap'],
                                   influence: r['Employee influences decisions?'] });
    sheet.getRange(r._row, col, 1, 3).setValues([[out.risk, out.approver, out.mitigation]]);
    sheet.getRange(r._row, col).setBackground(
      out.risk === 'High' ? COLORS.red : out.risk === 'Medium' ? COLORS.yellow : COLORS.green);
  });
}

function reviewAttestations_(sheet) {
  var today = new Date();
  var col = HEADERS.attest.indexOf('Status') + 1;
  readTable_(sheet, 'attest').forEach(function (r) {
    var status = attestationStatus(r['Last attested'], today, null);
    sheet.getRange(r._row, col).setValue(status).setBackground(
      status === 'Current' ? COLORS.green : status === 'Due soon' ? COLORS.yellow : COLORS.red);
  });
}

function colorForGift_(result) {
  if (result === RESULT.PROHIBITED || result === RESULT.DECLINE) return COLORS.red;
  if (result === RESULT.LEGAL) return COLORS.orange;
  if (result === RESULT.COMPLIANCE || result === RESULT.MANAGER || result === RESULT.INCOMPLETE) return COLORS.yellow;
  return COLORS.green;
}

// ------------------------------------------------------------------ dashboard

function refreshDashboard() {
  var ss = SpreadsheetApp.getActive();
  var dash = ss.getSheetByName(SHEETS.dashboard) || ss.insertSheet(SHEETS.dashboard, 0);
  dash.clear();
  var gifts = readTable_(ss.getSheetByName(SHEETS.gifts), 'gifts');
  var coi = readTable_(ss.getSheetByName(SHEETS.coi), 'coi');
  var att = readTable_(ss.getSheetByName(SHEETS.attest), 'attest');

  var rows = [['Gifts, Hospitality & Conflicts of Interest', ''], ['Updated', new Date()], ['', ''],
              ['Gifts & hospitality', 'Count']];
  countBy_(gifts, 'Result').forEach(function (r) { rows.push(r); });
  rows.push(['Waiting on a decision',
             gifts.filter(function (g) { return g['Result'] !== RESULT.ALLOWED && !g['Decision']; }).length]);
  rows.push(['', ''], ['Conflicts of interest', 'Count']);
  countBy_(coi, 'Risk').forEach(function (r) { rows.push(r); });
  rows.push(['Waiting on a decision', coi.filter(function (c) { return c['Risk'] !== 'Low' && !c['Decision']; }).length]);
  rows.push(['', ''], ['Annual attestations', 'Count']);
  countBy_(att, 'Status').forEach(function (r) { rows.push(r); });

  dash.getRange(1, 1, rows.length, 2).setValues(rows);
  dash.getRange(1, 1).setFontWeight('bold').setFontSize(14);
  [4, 4 + countBy_(gifts, 'Result').length + 3,
   4 + countBy_(gifts, 'Result').length + 3 + countBy_(coi, 'Risk').length + 3].forEach(function (r) {
    dash.getRange(r, 1, 1, 2).setFontWeight('bold').setBackground(COLORS.gray);
  });
}

function countBy_(rows, field) {
  var counts = {};
  rows.forEach(function (r) { var k = r[field] || '(not reviewed)'; counts[k] = (counts[k] || 0) + 1; });
  return Object.keys(counts).sort().map(function (k) { return [k, counts[k]]; });
}

// ------------------------------------------------------------------ audit trail

/**
 * Simple trigger: when someone records a Decision, stamp who and when, and
 * write it to the Audit Log so there's a record of every approval.
 */
function onEdit(e) {
  var sheet = e.range.getSheet();
  var key = sheet.getName() === SHEETS.gifts ? 'gifts' : sheet.getName() === SHEETS.coi ? 'coi' : null;
  if (!key || e.range.getRow() < 2) return;
  var decisionCol = HEADERS[key].indexOf('Decision') + 1;
  if (e.range.getColumn() !== decisionCol || e.range.getNumColumns() !== 1) return;

  var user = Session.getActiveUser().getEmail() || 'Unknown user';
  var now = new Date();
  sheet.getRange(e.range.getRow(), decisionCol + 1, 1, 2).setValues([[user, now]]);
  var who = sheet.getRange(e.range.getRow(), 2).getValue();
  SpreadsheetApp.getActive().getSheetByName(SHEETS.audit).appendRow(
    [now, user, sheet.getName(), e.range.getRow(),
     'Decision set to "' + e.value + '" for ' + who + (e.oldValue ? ' (was "' + e.oldValue + '")' : '')]);
}
