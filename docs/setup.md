# Setting it up in Google Sheets

Takes about five minutes. No add-ons or paid tools needed.

1. Create a new Google Sheet.
2. Go to **Extensions > Apps Script**.
3. In the editor, create four script files named `Code`, `Rules`, `Policy` and `SampleData`, and paste in the matching files from [`src/`](../src). Delete the empty `myFunction` that Google adds.
4. Open **Project Settings** (the gear icon), turn on **Show "appsscript.json" manifest file**, and replace its contents with [`src/appsscript.json`](../src/appsscript.json).
5. Save, go back to the Sheet, and reload the page. A **Compliance** menu appears.
6. Choose **Compliance > Load sample data (synthetic)**. The first time, Google asks you to authorize the script for this spreadsheet.

You'll get five tabs: Dashboard, Gifts & Hospitality, Conflicts of Interest, Attestations and Audit Log.

**Day to day**

- Employees add rows to the Gifts & Hospitality and Conflicts of Interest tabs. Dropdowns keep the inputs consistent.
- Compliance runs **Compliance > Review all entries**. Every row gets a result, the required approver and the reason, color coded.
- A reviewer records the outcome in the **Decision** column. The script stamps who decided and when, and writes it to the Audit Log.
- Thresholds live in `Policy.gs`, so changing the policy doesn't mean touching the rules.

**Optional:** to review automatically, add a time-driven trigger for `reviewAll` (Apps Script > Triggers > Add Trigger), for example every morning.

If you use [clasp](https://github.com/google/clasp), you can push the `src/` folder directly instead of copying and pasting.
