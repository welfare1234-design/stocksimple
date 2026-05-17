const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

export async function onRequest() {
  try {
    const res = await fetch('https://norway.twsthr.info/StockHoldersContinue.aspx', { headers: { 'User-Agent': UA } });
    const html = await res.text();

    const tables = html.match(/<table[^>]*>([\s\S]*?)<\/table>/g) || [];
    const dataTable = tables[4] || '';
    const rows = dataTable.match(/<tr[^>]*>([\s\S]*?)<\/tr>/g) || [];
    const stocks = [];

    for (let i = 1; i < rows.length && stocks.length < 30; i++) {
      const cells = rows[i].match(/<td[^>]*>([\s\S]*?)<\/td>/g) || [];
      if (cells.length < 6) continue;
      const clean = cells.map(c => c.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, '').trim());
      const stockField = clean[2] || '';
      const match = stockField.match(/^(\d{4,5})\s+(.+)$/);
      if (!match) continue;
      const code = match[1];
      const name = match[2];
      const change = clean[4] || '0';
      const weekData = clean[5] || '';
      const pctMatch = weekData.match(/[-\d.]+(\d{2}\.\d{2})$/);
      const currentPct = pctMatch ? pctMatch[1] : '0';
      const changeNum = parseFloat(change) || 0;
      const currentNum = parseFloat(currentPct) || 0;
      stocks.push({ code, name, bigHolderPct: currentPct, change, prevPct: (currentNum - changeNum).toFixed(2) });
    }

    stocks.sort((a, b) => parseFloat(b.bigHolderPct) - parseFloat(a.bigHolderPct));
    const dateMatch = html.match(/(\d{8})/);

    return new Response(JSON.stringify({ date: (dateMatch || [])[1] || '', hasComparison: true, stocks: stocks.slice(0, 20) }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 's-maxage=3600' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}
