// Runs the register on the synthetic sample data and writes:
//   sample-data/*.csv        the sample entries, ready to import into a Sheet
//   docs/sample-review.md    what "Compliance > Review all entries" produces
// Usage: node scripts/export-sample.js
const fs = require('fs');
const path = require('path');
const { loadProject } = require('../tests/mock-sheets');

const root = path.join(__dirname, '..');
const { context: g, sheets } = loadProject();
g.loadSampleData();

const text = v => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v ?? ''));
const csvCell = v => { const s = text(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const mdCell = v => text(v).replace(/\|/g, '/');

function writeCsv(file, header, rows) {
  fs.mkdirSync(path.join(root, 'sample-data'), { recursive: true });
  fs.writeFileSync(path.join(root, 'sample-data', file),
    [header, ...rows].map(r => r.map(csvCell).join(',')).join('\n') + '\n');
}
writeCsv('gifts_hospitality.csv', g.HEADERS.gifts.slice(0, 9), g.SAMPLE_GIFTS.map(r => r.slice(0, 9)));
writeCsv('conflicts_of_interest.csv', g.HEADERS.coi.slice(0, 8), g.SAMPLE_COI.map(r => r.slice(0, 8)));
writeCsv('attestations.csv', g.HEADERS.attest.slice(0, 3), g.SAMPLE_ATTESTATIONS.map(r => r.slice(0, 3)));

function table(sheetName, cols) {
  const grid = sheets[sheetName].grid;
  const header = grid[0];
  const idx = cols.map(c => header.indexOf(c));
  const lines = [`| ${cols.join(' | ')} |`, `|${cols.map(() => '---').join('|')}|`];
  grid.slice(1).forEach(row => lines.push(`| ${idx.map(i => mdCell(row[i])).join(' | ')} |`));
  return lines.join('\n');
}

const today = new Date().toISOString().slice(0, 10);
const md = `# Sample review output

This is what **Compliance > Review all entries** writes into the Sheet when it runs on the synthetic sample data. Generated ${today} by \`scripts/export-sample.js\`. Every person, company and amount is made up.

## Gifts & hospitality

${table('Gifts & Hospitality', ['Date', 'Employee', 'Counterparty', 'Counterparty type', 'Description', 'Value (USD)', 'Result', 'Required approver', 'Why'])}

## Conflicts of interest

${table('Conflicts of Interest', ['Employee', 'Type', 'Related party', 'Overlap', 'Employee influences decisions?', 'Risk', 'Required approver', 'Mitigation'])}

## Annual attestations (as of ${today})

${table('Attestations', ['Employee', 'Department', 'Last attested', 'Status'])}
`;
fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
fs.writeFileSync(path.join(root, 'docs', 'sample-review.md'), md);
console.log('wrote sample-data/*.csv and docs/sample-review.md');
