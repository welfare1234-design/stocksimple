// Cloudflare Pages Function: Yahoo TW stock ranking proxy
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)';

export const onRequest: PagesFunction = async (context) => {
  try {
    const url = new URL(context.request.url);
    const type = url.searchParams.get('type') ?? 'change-up';
    const period = url.searchParams.get('period') ?? 'day';
    const apiUrl = `https://tw.stock.yahoo.com/rank/${type}`;

    const res = await fetch(apiUrl, { headers: { 'User-Agent': UA } });
    const html = await res.text();

    const extract = (matches: string[], key: string) =>
      matches.map(m => m.replace(`"${key}":"`, '').replace('"', ''));

    const nameMatches = html.match(/"symbolName":"([^"]+)"/g) ?? [];
    const priceMatches = html.match(/"price":"([^"]+)"/g) ?? [];
    const changeMatches = html.match(/"change":"([^"]+)"/g) ?? [];
    const pctMatches = html.match(/"changePercent":"([^"]+)"/g) ?? [];
    const symbolMatches = html.match(/"symbol":"([^"]+)"/g) ?? [];

    const names = extract(nameMatches, 'symbolName');
    const prices = extract(priceMatches, 'price');
    const changes = extract(changeMatches, 'change');
    const pcts = extract(pctMatches, 'changePercent');
    const symbols = extract(symbolMatches, 'symbol');

    if (period === 'day') {
      const stocks = names.slice(0, 30).map((name, i) => ({
        name, code: (symbols[i] ?? '').replace(/\.(TW|TWO)$/, ''),
        price: prices[i] ?? '', change: changes[i] ?? '', changePercent: pcts[i] ?? '',
      }));
      return new Response(JSON.stringify({ stocks }), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 's-maxage=60' },
      });
    }

    // Week/Month: calculate from chart API
    const range = period === 'week' ? '5d' : '1mo';
    const topSymbols = symbols.slice(0, 30);
    const results: Array<{ name: string; code: string; price: string; changePercent: string }> = [];

    for (const sym of topSymbols) {
      try {
        const chartRes = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?range=${range}&interval=1d`,
          { headers: { 'User-Agent': UA } }
        );
        const chartData: any = await chartRes.json();
        const meta = chartData?.chart?.result?.[0]?.meta;
        if (meta) {
          const currentPrice = meta.regularMarketPrice ?? 0;
          const prevClose = meta.chartPreviousClose ?? currentPrice;
          const pctChange = prevClose > 0 ? ((currentPrice - prevClose) / prevClose * 100) : 0;
          const idx = topSymbols.indexOf(sym);
          results.push({
            name: names[idx] ?? sym,
            code: sym.replace(/\.(TW|TWO)$/, ''),
            price: currentPrice.toString(),
            changePercent: `${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(2)}%`,
          });
        }
      } catch { /* skip */ }
    }

    const dir = type.includes('down') ? 1 : -1;
    results.sort((a, b) => dir * (parseFloat(a.changePercent) - parseFloat(b.changePercent)));

    return new Response(JSON.stringify({ stocks: results.slice(0, 10) }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 's-maxage=300' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
};
