export const config = {
  runtime: 'edge',
};

const SHEET_CSV_URL = 'INDSÆT_DIN_GOOGLE_SHEET_CSV_URL_HER';

function normalize(q) {
  return q
    .toLowerCase()
    .trim()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'oe')
    .replace(/å/g, 'aa')
    .replace(/\s+/g, ' ');
}

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

function formatEvents(events) {
  if (!events.length) return 'Ingen events fundet.';

  return events
    .map(e => {
      let out = `🗓 ${e.Dato || ''}`;
      if (e.Navn) out += `\n📌 ${e.Navn}`;
      if (e.Tid) out += `\n🕗 ${e.Tid}`;
      if (e.Dansetype) out += `\n💃 ${e.Dansetype}`;
      if (e.Sted) out += `\n📍 ${e.Sted}`;
      if (e.Pris) out += `\n💰 ${e.Pris}`;
      return out;
    })
    .join('\n\n');
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query');

  if (!query) {
    return new Response(
      JSON.stringify({ success: true, text: 'Skriv fx: salsa i dag', hasMore: false }),
      { headers: { 'content-type': 'application/json' } }
    );
  }

  try {
    const res = await fetch(SHEET_CSV_URL, { cache: 'no-store' });
    const csv = await res.text();
    const rows = parseCSV(csv);

    const q = normalize(query);

    const matches = rows.filter(row =>
      normalize(Object.values(row).join(' ')).includes(q)
    );

    return new Response(
      JSON.stringify({
        success: true,
        text: formatEvents(matches),
        hasMore: false
      }),
      { headers: { 'content-type': 'application/json' } }
    );
  } catch {
    return new Response(
      JSON.stringify({ success: false, text: 'Teknisk fejl.', hasMore: false }),
      { headers: { 'content-type': 'application/json' } }
    );
  }
}

