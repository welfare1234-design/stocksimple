import type { Context } from '@netlify/functions';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)';

export default async (req: Request, _context: Context) => {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type') ?? 'change-up';
    const period = url.searchParams.get('period') ?? 'day'; // day, week, month
    const apiUrl = `https://tw.stock.yahoo.com/rank/${type}`;

    const res = await fetch(apiUrl, { headers: { 'User-Agent': UA } });
    const html = await res.text();

    // Extract stock data from HTML
    const nameMatches = html.match(/"symbolName":"([^"]+)"/g) ?? [];
    const priceMatches = html.match(/"price":"([^"]+)"/g) ?? [];
    const changeMatches = html.match(/"change":"([^"]+)"/g) ?? [];
    const pctMatches = html.match(/"changePercent":"([^"]+)"/g) ?? [];
    const symbolMatches = html.match(/"symbol":"([^"]+)"/g) ?? [];

    const extract = (matches: string[], key: string) =>
      matches.map(m => m.replace(`"${key}":"`, '').replace('"', ''));

    const names = extract(nameMatches, 'symbolName');
    const prices = extract(priceMatches, 'price');
    const changes = extract(changeMatches, 'change');
    const pcts = extract(pctMatches, 'changePercent');
    const symbols = extract(symbolMatches, 'symbol');

    // For day, return directly
    if (period === 'day') {
      const stocks = names.slice(0, 30).map((name, i) => ({
        name,
        code: (symbols[i] ?? '').replace(/\.(TW|TWO)$/, ''),
        price: prices[i] ?? '',
        change: changes[i] ?? '',
        changePercent: pcts[i] ?? '',
      }));
      return new Response(JSON.stringify({ stocks }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 's-maxage=60' },
      });
    }

    // For week/month, calculate from chart API
    const range = period === 'week' ? '5d' : '1mo';
    const topSymbols = symbols.slice(0, 50);
    const results: Array<{ name: string; code: string; price: string; changePercent: string }> = [];

    // Batch fetch (5 at a time)
    for (let i = 0; i < topSymbols.length; i += 5) {
      const batch = topSymbols.slice(i, i + 5);
      const fetches = batch.map(async (sym) => {
        try {
          const chartRes = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?range=${range}&interval=1d`,
            { headers: { 'User-Agent': UA } }
          );
          const chartData = await chartRes.json();
          const meta = chartData?.chart?.result?.[0]?.meta;
          if (!meta) return null;
          const currentPrice = meta.regularMarketPrice ?? 0;
          const prevClose = meta.chartPreviousClose ?? currentPrice;
          const pctChange = prevClose > 0 ? ((currentPrice - prevClose) / prevClose * 100) : 0;
          const idx = topSymbols.indexOf(sym);
          return {
            name: names[idx] ?? sym,
            code: sym.replace(/\.(TW|TWO)$/, ''),
            price: currentPrice.toString(),
            changePercent: `${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(2)}%`,
          };
        } catch { return null; }
      });
      const batchResults = await Promise.all(fetches);
      results.push(...batchResults.filter((r): r is NonNullable<typeof r> => r !== null));
    }

    // Sort by changePercent descending
    const direction = type.includes('down') ? 1 : -1;
    results.sort((a, b) => {
      const aVal = parseFloat(a.changePercent);
      const bVal = parseFloat(b.changePercent);
      return direction * (aVal - bVal);
    });

    return new Response(JSON.stringify({ stocks: results.slice(0, 30) }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 's-maxage=300' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
};
