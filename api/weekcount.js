export const config = {
  runtime: 'edge',
};

const SHEET_CSV_URL = 'INDSÆT_DIN_GOOGLE_SHEET_CSV_URL_HER';

function parseCSV(csv) {
  const lines = csv.split('\n').filter(Boolean);
  const headers = lines.shift().split(',').map(h => h.trim());

  return lines.map(line => {
    const cols = line.split(',');
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = (cols[i] || '').trim();
    });
    return obj;
  });
}

function isThisWeek(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d)) return false;

  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  return d >= start && d < end;
}

export default async function handler() {
  try {
    const res = await fetch(SHEET_CSV_URL, { cache: 'no-store' });
    const csv = await res.text();
    const rows = parseCSV(csv);

    const count = rows.filter(r => isThisWeek(r.Dato)).length;

    return new Response(
      JSON.stringify({ success: true, count }),
      { headers: { 'content-type': 'application/json' } }
    );
  } catch {
    return new Response(
      JSON.stringify({ success: false, count: 0 }),
      { headers: { 'content-type': 'application/json' } }
    );
  }
}

