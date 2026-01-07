/**
 * DanceMap – Automatisk oprydning
 * 
 * GØR:
 * 1. Sletter events med dato < i dag
 * 2. Sorterer resten efter dato (stigende)
 * 3. Kører deterministisk
 */

function cleanupEvents() {
  const SHEET_NAME = 'Events'; // ret hvis dit sheet hedder noget andet
  const DATE_COLUMN = 1; // kolonne A = Dato

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return;

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const range = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn());
  const values = range.getValues();

  const filtered = values.filter(row => {
    const cell = row[DATE_COLUMN - 1];
    if (!(cell instanceof Date)) return true;
    cell.setHours(0, 0, 0, 0);
    return cell >= today;
  });

  // Ryd eksisterende rows
  range.clearContent();

  if (filtered.length === 0) return;

  // Sortér efter dato
  filtered.sort((a, b) => {
    const da = a[DATE_COLUMN - 1];
    const db = b[DATE_COLUMN - 1];
    if (!(da instanceof Date)) return 1;
    if (!(db instanceof Date)) return -1;
    return da - db;
  });

  sheet.getRange(2, 1, filtered.length, filtered[0].length).setValues(filtered);
}

/**
 * Opret daglig trigger (kør én gang)
 */
function setupDailyCleanup() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'cleanupEvents') {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger('cleanupEvents')
    .timeBased()
    .everyDays(1)
    .atHour(4) // kl. 04:00
    .create();
}
