// A small in-memory stand-in for the parts of SpreadsheetApp the register uses,
// so the whole Apps Script project can run under Node in tests.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function makeSheet(name) {
  const grid = [];
  const bg = {};
  const cell = (r, c) => (grid[r - 1] && grid[r - 1][c - 1] !== undefined ? grid[r - 1][c - 1] : '');
  const put = (r, c, v) => { (grid[r - 1] = grid[r - 1] || [])[c - 1] = v; };
  const sheet = {
    name, grid, bg,
    getName: () => name,
    getLastRow: () => {
      for (let r = grid.length; r > 0; r--) if ((grid[r - 1] || []).some(v => v !== '' && v !== undefined)) return r;
      return 0;
    },
    getLastColumn: () => Math.max(0, ...grid.map(row => (row || []).length)),
    setFrozenRows: () => sheet,
    clear: () => { grid.length = 0; },
    appendRow: (vals) => { const r = sheet.getLastRow() + 1; vals.forEach((v, i) => put(r, i + 1, v)); },
    getRange: (r, c, nr = 1, nc = 1) => {
      const range = {
        getSheet: () => sheet, getRow: () => r, getColumn: () => c, getNumColumns: () => nc,
        getValue: () => cell(r, c),
        getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => cell(r + i, c + j))),
        setValues: (vals) => {
          if (vals.length !== nr || vals.some(row => row.length !== nc)) throw new Error(`setValues shape mismatch on ${name}`);
          vals.forEach((row, i) => row.forEach((v, j) => put(r + i, c + j, v)));
          return range;
        },
        setValue: (v) => { put(r, c, v); return range; },
        clearContent: () => { for (let i = 0; i < nr; i++) for (let j = 0; j < nc; j++) put(r + i, c + j, ''); return range; },
        setBackground: (color) => { bg[`${r},${c}`] = color; return range; },
        setFontWeight: () => range, setFontSize: () => range, setDataValidation: () => range,
      };
      return range;
    },
  };
  return sheet;
}

function loadProject({ user = 'reviewer@example.com' } = {}) {
  const sheets = {};
  const ss = {
    getSheetByName: (n) => sheets[n] || null,
    insertSheet: (n) => (sheets[n] = makeSheet(n)),
  };
  const chain = { addItem: () => chain, addSeparator: () => chain, addToUi: () => chain };
  const context = {
    SpreadsheetApp: {
      getActive: () => ss,
      getUi: () => ({ createMenu: () => chain }),
      newDataValidation: () => ({ requireValueInList: () => ({ build: () => ({}) }) }),
    },
    Session: { getActiveUser: () => ({ getEmail: () => user }) },
    Date, Math, Number, String, Object, Array, JSON, console,
  };
  vm.createContext(context);
  const src = path.join(__dirname, '..', 'src');
  // Load Rules before Policy on purpose: Apps Script doesn't guarantee file order.
  for (const f of ['Rules.gs', 'Code.gs', 'SampleData.gs', 'Policy.gs']) {
    vm.runInContext(fs.readFileSync(path.join(src, f), 'utf8'), context, { filename: f });
  }
  return { context, sheets };
}

module.exports = { loadProject };
