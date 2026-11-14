/**
 * Synthetic sample data. Every person, company and amount here is made up.
 * Columns match HEADERS in Code.gs; the review columns are left blank for
 * the rules to fill in.
 */

var SAMPLE_GIFTS = [
  // Date, Employee, Department, Direction, Counterparty, Counterparty type, Description, Value, Business purpose, Result, Approver, Why, Decision, Decided by, Decided on
  ['2026-02-10', 'Jordan Ellis', 'Sales', 'Given', 'Northwind Retail', 'Private', 'Team lunch after quarterly review', 85, 'Quarterly business review', '', '', '', '', '', ''],
  ['2026-03-18', 'Jordan Ellis', 'Sales', 'Given', 'Northwind Retail', 'Private', 'Holiday gift basket', 90, 'Client appreciation', '', '', '', '', '', ''],
  ['2026-06-05', 'Jordan Ellis', 'Sales', 'Given', 'Northwind Retail', 'Private', 'Concert tickets for two', 240, 'Relationship building', '', '', '', '', '', ''],
  ['2026-09-12', 'Jordan Ellis', 'Sales', 'Given', 'Northwind Retail', 'Private', 'Dinner with client team', 150, 'Contract renewal discussion', '', '', '', '', '', ''],
  ['2026-04-22', 'Priya Raman', 'Partnerships', 'Received', 'Brightpath Media', 'Private', 'Conference pass', 450, 'Industry event invitation', '', '', '', '', '', ''],
  ['2026-05-14', 'Marcus Lee', 'Procurement', 'Received', 'Apex Print Solutions', 'Vendor in active bid', 'Bottle of wine and chocolates', 60, 'Thank-you note', '', '', '', '', '', ''],
  ['2026-07-01', 'Sofia Alvarez', 'Public Policy', 'Given', 'Ministry of Communications (Brazil)', 'Government official', 'Coffee meeting', 25, 'Briefing on advertising rules', '', '', '', '', '', ''],
  ['2026-08-19', 'Sofia Alvarez', 'Public Policy', 'Given', 'Ministry of Communications (Brazil)', 'Government official', 'Hotel and airfare to visit HQ', 2400, 'Site visit', '', '', '', '', '', ''],
  ['2026-10-03', 'Ben Carter', 'Marketing', 'Given', 'Lumen Creative Agency', 'Private', '$200 gift card', 200, 'Thank you for campaign work', '', '', '', '', '', ''],
  ['2026-10-28', 'Aisha Khan', 'Engineering', 'Received', 'Cloudline Data Services', 'Private', 'Branded hoodie', 40, '', '', '', '', '', '', '']
];

var SAMPLE_COI = [
  // Disclosed on, Employee, Department, Type, Related party, Overlap, Influences decisions?, Description, Risk, Approver, Mitigation, Decision, Decided by, Decided on
  ['2026-01-15', 'Marcus Lee', 'Procurement', 'Family relationship', 'Apex Print Solutions', 'Vendor', 'Yes', 'Brother-in-law is sales director at a print vendor', '', '', '', '', '', ''],
  ['2026-02-02', 'Priya Raman', 'Partnerships', 'Board seat', 'Local Food Bank', 'None', 'No', 'Unpaid board member at a nonprofit', '', '', '', '', '', ''],
  ['2026-03-09', 'Daniel Okoye', 'Engineering', 'Side business', 'Okoye Analytics', 'Customer', 'No', 'Small consulting business; one client also advertises with the company', '', '', '', '', '', ''],
  ['2026-05-20', 'Hannah Brooks', 'Product', 'Financial interest', 'Rival social app', 'Competitor', 'Yes', 'Holds early-stage equity in a competitor', '', '', '', '', '', ''],
  ['2026-06-11', 'Aisha Khan', 'Engineering', 'Outside employment', 'Community college', 'None', 'No', 'Teaches an evening coding class', '', '', '', '', '', ''],
  ['2026-09-30', 'Jordan Ellis', 'Sales', 'Financial interest', 'Northwind Retail', 'Customer', 'Yes', 'Owns shares in a major advertiser they manage', '', '', '', '', '', '']
];

var SAMPLE_ATTESTATIONS = [
  ['Jordan Ellis', 'Sales', '2026-01-20', ''],
  ['Priya Raman', 'Partnerships', '2025-12-01', ''],
  ['Marcus Lee', 'Procurement', '2025-10-15', ''],
  ['Sofia Alvarez', 'Public Policy', '2026-03-02', ''],
  ['Ben Carter', 'Marketing', '', ''],
  ['Aisha Khan', 'Engineering', '2026-06-11', '']
];

if (typeof module !== 'undefined') {
  module.exports = { SAMPLE_GIFTS: SAMPLE_GIFTS, SAMPLE_COI: SAMPLE_COI, SAMPLE_ATTESTATIONS: SAMPLE_ATTESTATIONS };
}
