const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

export async function onRequest() {
  const res = await fetch('https://norway.twsthr.info/StockHoldersContinue.aspx', { headers: { 'User-Agent': UA } });
  const html = await res.text();
  const tables = html.match(/<table[^>]*>([\s\S]*?)<\/table>/g) || [];
  const dt = tables[4] || '';
  const rows = dt.match(/<tr[^>]*>([\s\S]*?)<\/tr>/g) || [];
  const stocks = [];
  for (let i = 1; i < rows.length && stocks.length < 30; i++) {
    const cells = rows[i].match(/<td[^>]*>([\s\S]*?)<\/td>/g) || [];
    if (cells.length < 6) continue;
    const cl = cells.map(c => c.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, '').trim());
    const m = (cl[2] || '').match(/^(\d{4,5})\s+(.+)$/);
    if (!m) continue;
    const change = cl[4] || '0';
    const wd = cl[5] || '';
    const pm = wd.match(/[-\d.]+(\d{2}\.\d{2})$/);
    const cur = pm ? pm[1] : '0';
    const cn = parseFloat(change) || 0;
    const cu = parseFloat(cur) || 0;
    stocks.push({ code: m[1], name: m[2], bigHolderPct: cur, change, prevPct: (cu - cn).toFixed(2) });
  }
  stocks.sort((a, b) => parseFloat(b.bigHolderPct) - parseFloat(a.bigHolderPct));
  const dm = html.match(/(\d{8})/);
  return new Response(JSON.stringify({ date: (dm || [])[1] || '', hasComparison: true, stocks: stocks.slice(0, 20) }), { headers: { 'Content-Type': 'application/json' } });
}
