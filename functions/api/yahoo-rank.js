const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const type = url.searchParams.get('type') || 'change-up';
  const period = url.searchParams.get('period') || 'day';
  const res = await fetch('https://tw.stock.yahoo.com/rank/' + type, { headers: { 'User-Agent': UA } });
  const html = await res.text();
  const ex = (m, k) => (m || []).map(x => x.replace('"' + k + '":"', '').replace('"', ''));
  const names = ex(html.match(/"symbolName":"([^"]+)"/g), 'symbolName');
  const prices = ex(html.match(/"price":"([^"]+)"/g), 'price');
  const changes = ex(html.match(/"change":"([^"]+)"/g), 'change');
  const pcts = ex(html.match(/"changePercent":"([^"]+)"/g), 'changePercent');
  const symbols = ex(html.match(/"symbol":"([^"]+)"/g), 'symbol');

  if (period === 'day') {
    const stocks = names.slice(0, 30).map((name, i) => ({ name, code: (symbols[i] || '').replace(/\.(TW|TWO)$/, ''), price: prices[i] || '', change: changes[i] || '', changePercent: pcts[i] || '' }));
    return new Response(JSON.stringify({ stocks }), { headers: { 'Content-Type': 'application/json' } });
  }
  const range = period === 'week' ? '5d' : '1mo';
  const results = [];
  for (const sym of symbols.slice(0, 20)) {
    try {
      const cr = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/' + sym + '?range=' + range + '&interval=1d', { headers: { 'User-Agent': UA } });
      const cd = await cr.json();
      const m = cd?.chart?.result?.[0]?.meta;
      if (m) { const p = m.regularMarketPrice || 0, pc = m.chartPreviousClose || p, pct = pc > 0 ? ((p - pc) / pc * 100) : 0; const idx = symbols.indexOf(sym); results.push({ name: names[idx] || sym, code: sym.replace(/\.(TW|TWO)$/, ''), price: p.toString(), changePercent: (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%' }); }
    } catch {}
  }
  results.sort((a, b) => (type.includes('down') ? 1 : -1) * (parseFloat(a.changePercent) - parseFloat(b.changePercent)));
  return new Response(JSON.stringify({ stocks: results.slice(0, 10) }), { headers: { 'Content-Type': 'application/json' } });
}
