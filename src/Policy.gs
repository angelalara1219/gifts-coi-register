/**
 * Policy settings. These are example thresholds to show the method; a real
 * program sets them in its written Gifts & Hospitality and Conflicts of
 * Interest policies and reviews them regularly.
 */
var POLICY = {
  currency: 'USD',

  // Gifts and hospitality with private-sector counterparties
  noApprovalMax: 100,       // up to this: log it, no approval needed
  managerApprovalMax: 250,  // above noApprovalMax up to this: manager approves
                            // above this: Compliance approves

  // Government officials: Compliance pre-approval for anything of value,
  // and Legal review at or above this amount, or for any travel or lodging
  officialLegalReviewAt: 100,

  // Pattern check: total from or to the same counterparty in the last 12 months
  annualCounterpartyFlag: 500,

  // Annual conflicts of interest attestation
  attestationDays: 365,
  attestationDueSoonDays: 30,

  // Gifts that are never allowed
  prohibitedKeywords: ['cash', 'gift card', 'gift certificate', 'prepaid card', 'voucher', 'crypto', 'loan'],
  travelKeywords: ['flight', 'airfare', 'hotel', 'lodging', 'travel', 'accommodation']
};

if (typeof module !== 'undefined') { module.exports = { POLICY: POLICY }; }
