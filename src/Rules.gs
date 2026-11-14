/**
 * The decision rules, kept as plain functions with no Sheets calls so they can
 * be tested outside Google (see tests/). Code.gs feeds rows in and writes the
 * results back to the sheet.
 */

/* global POLICY */
// Looked up when a rule runs, not at load time: Apps Script loads files in
// project order, so POLICY may not exist yet when this file is read.
function getPolicy_() {
  return (typeof POLICY !== 'undefined') ? POLICY : require('./Policy.gs').POLICY;
}

var RESULT = {
  ALLOWED: 'Allowed - log only',
  MANAGER: 'Needs manager approval',
  COMPLIANCE: 'Needs Compliance approval',
  LEGAL: 'Needs Compliance + Legal review',
  PROHIBITED: 'Prohibited',
  DECLINE: 'Decline',
  INCOMPLETE: 'Incomplete'
};

function money(n) {
  return '$' + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function hasAny(text, words) {
  var t = String(text || '').toLowerCase();
  for (var i = 0; i < words.length; i++) {
    if (t.indexOf(words[i]) !== -1) return words[i];
  }
  return '';
}

function daysBetween(a, b) {
  return Math.floor((new Date(b) - new Date(a)) / 86400000);
}

/**
 * Evaluate one gift or hospitality entry.
 *
 * entry: { date, direction ('Given'|'Received'), counterparty,
 *          counterpartyType ('Private'|'Government official'|'Vendor in active bid'),
 *          description, value, businessPurpose }
 * history: earlier entries (same shape) used for the 12-month pattern check
 *
 * Returns { result, reasons: [], approver }
 */
function evaluateGift(entry, history, policy) {
  var p = policy || getPolicy_();
  var reasons = [];
  var value = Number(entry.value) || 0;
  var type = String(entry.counterpartyType || '').toLowerCase();
  var isOfficial = type.indexOf('government') !== -1;
  var inBid = type.indexOf('active bid') !== -1;

  var banned = hasAny(entry.description, p.prohibitedKeywords);
  if (banned) {
    return { result: RESULT.PROHIBITED, approver: 'None - not allowed',
             reasons: ['"' + banned + '" is a cash equivalent, which is never allowed'] };
  }
  if (inBid) {
    var verb = entry.direction === 'Received' ? 'Decline or return it' : 'Do not give it';
    return { result: entry.direction === 'Received' ? RESULT.DECLINE : RESULT.PROHIBITED,
             approver: 'Compliance (notify)',
             reasons: ['Counterparty is in an active bid or contract negotiation. ' + verb +
                       ', and tell Compliance so it is on record.'] };
  }
  if (!String(entry.businessPurpose || '').trim()) {
    return { result: RESULT.INCOMPLETE, approver: 'Employee',
             reasons: ['Add a business purpose before this can be reviewed'] };
  }

  var result, approver;
  if (isOfficial) {
    var travel = hasAny(entry.description, p.travelKeywords);
    if (value >= p.officialLegalReviewAt || travel) {
      result = RESULT.LEGAL;
      approver = 'Compliance and Legal (before it happens)';
      reasons.push('Government official' + (travel ? ' with ' + travel + ' involved' : '') +
                   (value >= p.officialLegalReviewAt ? ', value ' + money(value) : '') +
                   ': anti-bribery laws such as the FCPA apply');
    } else {
      result = RESULT.COMPLIANCE;
      approver = 'Compliance (before it happens)';
      reasons.push('Anything of value to a government official needs Compliance pre-approval');
    }
  } else if (value <= p.noApprovalMax) {
    result = RESULT.ALLOWED;
    approver = 'None';
    reasons.push('Within the ' + money(p.noApprovalMax) + ' log-only limit');
  } else if (value <= p.managerApprovalMax) {
    result = RESULT.MANAGER;
    approver = 'Manager';
    reasons.push(money(value) + ' is above ' + money(p.noApprovalMax));
  } else {
    result = RESULT.COMPLIANCE;
    approver = 'Compliance';
    reasons.push(money(value) + ' is above the ' + money(p.managerApprovalMax) + ' manager limit');
    if (entry.direction === 'Received') {
      reasons.push('Compliance may ask that it be returned, shared with the team, or donated');
    }
  }

  // Pattern check: lots of small gifts to or from one counterparty add up.
  var cutoff = new Date(entry.date);
  cutoff.setFullYear(cutoff.getFullYear() - 1);
  var earlier = (history || []).filter(function (h) {
    return String(h.counterparty).toLowerCase() === String(entry.counterparty).toLowerCase() &&
           new Date(h.date) >= cutoff && new Date(h.date) < new Date(entry.date);
  });
  var total = earlier.reduce(function (sum, h) { return sum + (Number(h.value) || 0); }, value);
  if (earlier.length && total > p.annualCounterpartyFlag) {
    reasons.push('Pattern: ' + money(total) + ' with ' + entry.counterparty + ' across ' +
                 (earlier.length + 1) + ' entries in 12 months (flag at ' + money(p.annualCounterpartyFlag) + ')');
    if (result === RESULT.ALLOWED || result === RESULT.MANAGER) {
      result = RESULT.COMPLIANCE;
      approver = 'Compliance';
    }
  }
  return { result: result, reasons: reasons, approver: approver };
}

/**
 * Cross-check a gift against the conflicts register: if the employee has
 * disclosed a conflict with the same counterparty, a reviewer looking only at
 * the gift would miss it. Escalates the gift to at least Compliance.
 *
 * out: the result of evaluateGift (changed in place and returned)
 */
function crossCheckConflicts(out, employee, counterparty, disclosures) {
  var match = (disclosures || []).filter(function (d) {
    return String(d.employee).toLowerCase() === String(employee).toLowerCase() &&
           String(d.relatedParty).toLowerCase() === String(counterparty).toLowerCase();
  })[0];
  if (!match) return out;
  out.reasons.push('Conflict of interest: ' + employee + ' disclosed a ' +
                   String(match.type).toLowerCase() + ' involving ' + counterparty);
  if (out.result === RESULT.ALLOWED || out.result === RESULT.MANAGER) {
    out.result = RESULT.COMPLIANCE;
    out.approver = 'Compliance';
  }
  return out;
}

/**
 * Evaluate one conflicts of interest disclosure.
 *
 * d: { type, relatedParty, overlap ('None'|'Vendor'|'Customer'|'Competitor'|'Partner'),
 *      influence ('Yes'|'No' - does the employee's role touch decisions about that party?) }
 * Returns { risk, mitigation, approver }
 */
function evaluateDisclosure(d) {
  var overlap = String(d.overlap || 'None');
  var hasOverlap = overlap.toLowerCase() !== 'none' && overlap !== '';
  var influence = String(d.influence || '').toLowerCase() === 'yes';

  if (overlap.toLowerCase() === 'competitor' && influence) {
    return { risk: 'High', approver: 'Compliance and Legal',
             mitigation: 'Interest in a competitor plus decision-making influence. Legal review before it continues; ' +
                         'may need to be unwound or the employee moved off related work.' };
  }
  if (hasOverlap && influence) {
    return { risk: 'High', approver: 'Compliance and manager',
             mitigation: 'Recuse from all decisions involving ' + (d.relatedParty || 'the related party') +
                         '. Record the recusal, tell the team who decides instead, and review in 6 months.' };
  }
  if (hasOverlap || String(d.type).toLowerCase() === 'board seat') {
    return { risk: 'Medium', approver: 'Manager',
             mitigation: 'Manager acknowledges in writing. Keep it separate from company time and resources; review yearly.' };
  }
  return { risk: 'Low', approver: 'None',
           mitigation: 'Record the disclosure and confirm it in the next annual attestation.' };
}

/**
 * Annual attestation status for one employee.
 * Returns 'Overdue' | 'Due soon' | 'Current' | 'Never attested'
 */
function attestationStatus(lastAttested, today, policy) {
  var p = policy || getPolicy_();
  if (!lastAttested) return 'Never attested';
  var days = daysBetween(lastAttested, today);
  if (days > p.attestationDays) return 'Overdue';
  if (days > p.attestationDays - p.attestationDueSoonDays) return 'Due soon';
  return 'Current';
}

if (typeof module !== 'undefined') {
  module.exports = { evaluateGift: evaluateGift, evaluateDisclosure: evaluateDisclosure,
                     crossCheckConflicts: crossCheckConflicts,
                     attestationStatus: attestationStatus, RESULT: RESULT };
}
