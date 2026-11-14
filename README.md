# Gifts, Hospitality & Conflicts of Interest Register

A Google Sheets register, powered by Apps Script, for the everyday ethics questions every company deals with: Can I accept this? Can I give this? Do I need to disclose this? It checks every entry against a written policy, tells the employee who needs to approve it and why, and keeps an audit trail of every decision.

## Why I built this

Gifts and conflicts of interest programs usually fail quietly. The log is a spreadsheet nobody reviews, the thresholds live in a PDF, and nobody notices that the same client got four "small" gifts this year, or that the employee sending them owns shares in that client.

I built this the way I've built most of my compliance tooling: in Google Workspace, with Apps Script doing the busywork, so it runs where people already work. The rules recommend; people decide.

— Angela Lara, CAMS

## What it does

| Check | How it works |
|---|---|
| **Approval tiers** | Private-sector gifts up to $100: log only. $100–$250: manager. Over $250: Compliance. |
| **Government officials** | Anything of value needs Compliance pre-approval. Travel, lodging or $100+ adds Legal review, because anti-bribery laws like the FCPA apply. |
| **Never allowed** | Cash and cash equivalents (gift cards, vouchers, prepaid cards), at any amount. |
| **Active bids** | Gifts to or from a vendor in an active bid: declined, and Compliance is told so it's on record. |
| **Patterns** | Adds up everything with the same counterparty over 12 months. Four small gifts that pass one at a time still get flagged together. |
| **Conflicts cross-check** | If an employee gives gifts to a company they've disclosed a conflict with, the gift goes to Compliance, even if it's small. |
| **Conflicts of interest** | Rates each disclosure by overlap (vendor, customer, competitor) and whether the employee influences decisions, then suggests the mitigation, such as recusal. |
| **Annual attestations** | Flags who is overdue, due soon, or has never attested. |
| **Audit trail** | When a reviewer records a decision, the script stamps who and when and logs it. |

See it run on the synthetic sample data: [**sample review output**](docs/sample-review.md). For example, Jordan's four gifts to Northwind Retail each look fine on their own. Together they trip the 12-month pattern check, and the cross-check notices Jordan also disclosed owning shares in Northwind.

## How it's organized

```
src/
  Policy.gs      thresholds and keywords: the policy, in one place
  Rules.gs       the decision rules, written as plain functions with no Sheets calls
  Code.gs        the Sheets side: menu, tabs, dropdowns, review, dashboard, audit log
  SampleData.gs  synthetic sample entries
tests/           run the rules and the whole script against a stand-in for Sheets
sample-data/     the same sample entries as CSV
docs/            setup guide and sample output
```

Keeping the rules separate from the spreadsheet code means the policy logic can be tested on its own, and changing a threshold is a one-line edit in `Policy.gs`.

## Set it up

About five minutes in a new Google Sheet. See [**docs/setup.md**](docs/setup.md).

## Tests

```bash
npm test
```

The tests check every rule, then run the full Apps Script project (setup, sample data, review, dashboard and the audit log) against an in-memory stand-in for Google Sheets. They run on every push with GitHub Actions.

## Notes

- All people, companies and amounts are synthetic. Nothing comes from any employer.
- The thresholds are example settings to show the method. A real program sets them in its written policy, based on its own risk assessment, and reviews them regularly.
- This is a demonstration, not legal advice.

## License

MIT
