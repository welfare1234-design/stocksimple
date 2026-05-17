const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

export async function onRequest(context) {
  try {
    const url = new URL(context.request.url);
    const type = url.searchParams.get('type') || 'change-up';
    const period = url.searchParams.get('period') || 'day';
    const res = await fetch(`https://tw.stock.yahoo.com/rank/${type}`, { headers: { 'User-Agent': UA } });
    const html = await res.text();

    const extract = (matches, key) => matches.map(m => m.replace(`"${key}":"`, '').replace('"', ''));
    const names = extract(html.match(/"symbolName":"([^"]+)"/g) || [], 'symbolName');
    const prices = extract(html.match(/"price":"([^"]+)"/g) || [], 'price');
    const changes = extract(html.match(/"change":"([^"]+)"/g) || [], 'change');
    const pcts = extract(html.match(/"changePercent":"([^"]+)"/g) || [], 'changePercent');
    const symbols = extract(html.match(/"symbol":"([^"]+)"/g) || [], 'symbol');

    if (period === 'day') {
      const stocks = names.slice(0, 30).map((name, i) => ({
        name, code: (symbols[i] || '').replace(/\.(TW|TWO)$/, ''),
        price: prices[i] || '', change: changes[i] || '', changePercent: pcts[i] || '',
      }));
      return new Response(JSON.stringify({ stocks }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 's-maxage=60' } });
    }

    const range = period === 'week' ? '5d' : '1mo';
    const results = [];
    for (const sym of symbols.slice(0, 20)) {
      try {
        const cr = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${sym}?range=${range}&interval=1d`, { headers: { 'User-Agent': UA } });
        const cd = await cr.json();
        const meta = cd?.chart?.result?.[0]?.meta;
        if (meta) {
          const p = meta.regularMarketPrice || 0;
          const pc = meta.chartPreviousClose || p;
          const pct = pc > 0 ? ((p - pc) / pc * 100) : 0;
          const idx = symbols.indexOf(sym);
          results.push({ name: names[idx] || sym, code: sym.replace(/\.(TW|TWO)$/, ''), price: p.toString(), changePercent: `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%` });
        }
      } catch {}
    }
    const dir = type.includes('down') ? 1 : -1;
    results.sort((a, b) => dir * (parseFloat(a.changePercent) - parseFloat(b.changePercent)));
    return new Response(JSON.stringify({ stocks: results.slice(0, 10) }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 's-maxage=300' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}
