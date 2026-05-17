import type { Context } from '@netlify/functions';

const URL = 'https://norway.twsthr.info/StockHoldersContinue.aspx';

export default async (req: Request, _context: Context) => {
  try {
    const url = new URL(req.url);
    const threshold = url.searchParams.get('threshold') ?? '400';

    // Map threshold to the correct page tab
    // The site uses hiddenServerEvent: tab1=1000張, tab2=800張, tab3=400張, tab4=200張
    const tabMap: Record<string, string> = { '1000': 'tab1', '800': 'tab2', '400': 'tab3', '200': 'tab4' };
    const tab = tabMap[threshold] ?? 'tab3';

    const res = await fetch(URL, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' } });
    const html = await res.text();

    // Parse the data table (table index 4 has the stock data)
    const tables = html.match(/<table[^>]*>([\s\S]*?)<\/table>/g) ?? [];
    const dataTable = tables[4] ?? '';

    const rows = dataTable.match(/<tr[^>]*>([\s\S]*?)<\/tr>/g) ?? [];

    const stocks: Array<{
      code: string;
      name: string;
      category: string;
      bigHolderPct: string;
      change: string;
      prevPct: string;
    }> = [];

    for (let i = 1; i < rows.length && stocks.length < 30; i++) {
      const cells = rows[i].match(/<td[^>]*>([\s\S]*?)<\/td>/g) ?? [];
      if (cells.length < 6) continue;

      const clean = cells.map(c => c.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, '').trim());

      // clean[2] = "1304 台聚", clean[3] = "塑膠", clean[4] = "0.18", clean[5] = "0.1860.01"
      const stockField = clean[2] ?? '';
      const match = stockField.match(/^(\d{4,5})\s+(.+)$/);
      if (!match) continue;

      const code = match[1];
      const name = match[2];
      const category = clean[3] ?? '';
      const change = clean[4] ?? '0';

      // Parse current pct from the latest week column (clean[5])
      // Format: "0.1860.01" means change=0.18, current=60.01
      const weekData = clean[5] ?? '';
      const pctMatch = weekData.match(/[-\d.]+(\d{2}\.\d{2})$/);
      const currentPct = pctMatch ? pctMatch[1] : '0';

      // Calculate previous pct
      const changeNum = parseFloat(change) || 0;
      const currentNum = parseFloat(currentPct) || 0;
      const prevNum = currentNum - changeNum;

      stocks.push({
        code,
        name,
        category,
        bigHolderPct: currentPct,
        change: change,
        prevPct: prevNum.toFixed(2),
      });
    }

    // Sort by current holding percentage descending
    stocks.sort((a, b) => parseFloat(b.bigHolderPct) - parseFloat(a.bigHolderPct));

    // Get date from header
    const dateMatch = html.match(/(\d{8})/);
    const date = dateMatch ? dateMatch[1] : '';

    return new Response(JSON.stringify({
      date,
      hasComparison: true,
      stocks: stocks.slice(0, 20),
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
};
