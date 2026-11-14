# Sample review output

This is what **Compliance > Review all entries** writes into the Sheet when it runs on the synthetic sample data. Generated 2026-11-14 by `scripts/export-sample.js`. Every person, company and amount is made up.

## Gifts & hospitality

| Date | Employee | Counterparty | Counterparty type | Description | Value (USD) | Result | Required approver | Why |
|---|---|---|---|---|---|---|---|---|
| 2026-02-10 | Jordan Ellis | Northwind Retail | Private | Team lunch after quarterly review | 85 | Needs Compliance approval | Compliance | Within the $100 log-only limit; Conflict of interest: Jordan Ellis disclosed a financial interest involving Northwind Retail |
| 2026-03-18 | Jordan Ellis | Northwind Retail | Private | Holiday gift basket | 90 | Needs Compliance approval | Compliance | Within the $100 log-only limit; Conflict of interest: Jordan Ellis disclosed a financial interest involving Northwind Retail |
| 2026-06-05 | Jordan Ellis | Northwind Retail | Private | Concert tickets for two | 240 | Needs Compliance approval | Compliance | $240 is above $100; Conflict of interest: Jordan Ellis disclosed a financial interest involving Northwind Retail |
| 2026-09-12 | Jordan Ellis | Northwind Retail | Private | Dinner with client team | 150 | Needs Compliance approval | Compliance | $150 is above $100; Pattern: $565 with Northwind Retail across 4 entries in 12 months (flag at $500); Conflict of interest: Jordan Ellis disclosed a financial interest involving Northwind Retail |
| 2026-04-22 | Priya Raman | Brightpath Media | Private | Conference pass | 450 | Needs Compliance approval | Compliance | $450 is above the $250 manager limit; Compliance may ask that it be returned, shared with the team, or donated |
| 2026-05-14 | Marcus Lee | Apex Print Solutions | Vendor in active bid | Bottle of wine and chocolates | 60 | Decline | Compliance (notify) | Counterparty is in an active bid or contract negotiation. Decline or return it, and tell Compliance so it is on record. |
| 2026-07-01 | Sofia Alvarez | Ministry of Communications (Brazil) | Government official | Coffee meeting | 25 | Needs Compliance approval | Compliance (before it happens) | Anything of value to a government official needs Compliance pre-approval |
| 2026-08-19 | Sofia Alvarez | Ministry of Communications (Brazil) | Government official | Hotel and airfare to visit HQ | 2400 | Needs Compliance + Legal review | Compliance and Legal (before it happens) | Government official with airfare involved, value $2,400: anti-bribery laws such as the FCPA apply; Pattern: $2,425 with Ministry of Communications (Brazil) across 2 entries in 12 months (flag at $500) |
| 2026-10-03 | Ben Carter | Lumen Creative Agency | Private | $200 gift card | 200 | Prohibited | None - not allowed | "gift card" is a cash equivalent, which is never allowed |
| 2026-10-28 | Aisha Khan | Cloudline Data Services | Private | Branded hoodie | 40 | Incomplete | Employee | Add a business purpose before this can be reviewed |

## Conflicts of interest

| Employee | Type | Related party | Overlap | Employee influences decisions? | Risk | Required approver | Mitigation |
|---|---|---|---|---|---|---|---|
| Marcus Lee | Family relationship | Apex Print Solutions | Vendor | Yes | High | Compliance and manager | Recuse from all decisions involving Apex Print Solutions. Record the recusal, tell the team who decides instead, and review in 6 months. |
| Priya Raman | Board seat | Local Food Bank | None | No | Medium | Manager | Manager acknowledges in writing. Keep it separate from company time and resources; review yearly. |
| Daniel Okoye | Side business | Okoye Analytics | Customer | No | Medium | Manager | Manager acknowledges in writing. Keep it separate from company time and resources; review yearly. |
| Hannah Brooks | Financial interest | Rival social app | Competitor | Yes | High | Compliance and Legal | Interest in a competitor plus decision-making influence. Legal review before it continues; may need to be unwound or the employee moved off related work. |
| Aisha Khan | Outside employment | Community college | None | No | Low | None | Record the disclosure and confirm it in the next annual attestation. |
| Jordan Ellis | Financial interest | Northwind Retail | Customer | Yes | High | Compliance and manager | Recuse from all decisions involving Northwind Retail. Record the recusal, tell the team who decides instead, and review in 6 months. |

## Annual attestations (as of 2026-11-14)

| Employee | Department | Last attested | Status |
|---|---|---|---|
| Jordan Ellis | Sales | 2026-01-20 | Current |
| Priya Raman | Partnerships | 2025-12-01 | Due soon |
| Marcus Lee | Procurement | 2025-10-15 | Overdue |
| Sofia Alvarez | Public Policy | 2026-03-02 | Current |
| Ben Carter | Marketing |  | Never attested |
| Aisha Khan | Engineering | 2026-06-11 | Current |
