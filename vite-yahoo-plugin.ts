/**
 * Vite plugin: Yahoo Finance server-side proxy
 *
 * 在 dev server 端處理 crumb/cookie 認證，前端只需呼叫:
 *   /api/yahoo-summary/{symbol}?modules=topHoldings,defaultKeyStatistics,financialData
 *
 * 這樣可以避免瀏覽器端 cookie domain 不匹配的問題。
 */
import type { Plugin } from 'vite';
import https from 'https';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)';

let cachedCrumb: string | null = null;
let cachedCookies: string[] = [];
let crumbExpiry = 0;

function httpsGet(url: string, cookies: string[] = []): Promise<{ status: number; body: string; setCookies: string[] }> {
  return new Promise((resolve, reject) => {
    const headers: Record<string, string> = { 'User-Agent': UA };
    if (cookies.length > 0) {
      headers['Cookie'] = cookies.map(c => c.split(';')[0]).join('; ');
    }
    const req = https.get(url, { headers }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        const setCookies = (res.headers['set-cookie'] ?? []) as string[];
        resolve({ status: res.statusCode ?? 0, body, setCookies });
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function ensureCrumb(): Promise<{ crumb: string; cookies: string[] }> {
  if (cachedCrumb && Date.now() < crumbExpiry) {
    return { crumb: cachedCrumb, cookies: cachedCookies };
  }

  // Step 1: get cookies from fc.yahoo.com
  const fcRes = await httpsGet('https://fc.yahoo.com/curveball');
  const allCookies = [...fcRes.setCookies];

  // Step 2: get crumb
  const crumbRes = await httpsGet('https://query2.finance.yahoo.com/v1/test/getcrumb', allCookies);
  if (crumbRes.status !== 200) {
    throw new Error(`Failed to get crumb: ${crumbRes.status}`);
  }

  cachedCrumb = crumbRes.body.trim();
  cachedCookies = allCookies;
  crumbExpiry = Date.now() + 5 * 60 * 1000; // cache 5 min

  return { crumb: cachedCrumb, cookies: cachedCookies };
}

export function yahooFinancePlugin(): Plugin {
  // TWSE rate limiter: max 1 request per 3 seconds
  let lastTwseRequest = 0;

  return {
    name: 'yahoo-finance-proxy',
    configureServer(server) {
      // --- TWSE proxy (server-side to handle rate limit & cookies) ---
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? '';
        if (!url.startsWith('/api/twse/')) {
          return next();
        }

        try {
          // Rate limit: wait if needed
          const now = Date.now();
          const wait = Math.max(0, 3000 - (now - lastTwseRequest));
          if (wait > 0) {
            await new Promise((resolve) => setTimeout(resolve, wait));
          }
          lastTwseRequest = Date.now();

          const path = url.replace(/^\/api\/twse/, '');
          const twseUrl = `https://www.twse.com.tw${path}`;
          console.log(`[twse-proxy] ${twseUrl}`);

          const twseRes = await httpsGet(twseUrl);
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = twseRes.status;
          res.end(twseRes.body);
        } catch (err) {
          console.error(`[twse-proxy] Error:`, err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: String(err) }));
        }
      });

      // --- TDCC big holders proxy ---
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? '';
        if (!url.startsWith('/api/tdcc-big-holders')) return next();

        try {
          const norwayRes = await httpsGet('https://norway.twsthr.info/StockHoldersContinue.aspx');
          const html = norwayRes.body;

          // Parse table 4
          const tables = html.match(/<table[^>]*>([\s\S]*?)<\/table>/g) ?? [];
          const dataTable = tables[4] ?? '';
          const rows = dataTable.match(/<tr[^>]*>([\s\S]*?)<\/tr>/g) ?? [];

          const stocks: Array<{ code: string; name: string; bigHolderPct: string; change: string; prevPct: string; bigHolderShares: number }> = [];

          for (let i = 1; i < rows.length && stocks.length < 30; i++) {
            const cells = rows[i].match(/<td[^>]*>([\s\S]*?)<\/td>/g) ?? [];
            if (cells.length < 6) continue;
            const clean = cells.map(c => c.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, '').trim());

            const stockField = clean[2] ?? '';
            const match = stockField.match(/^(\d{4,5})\s+(.+)$/);
            if (!match) continue;

            const code = match[1];
            const name = match[2];
            const change = clean[4] ?? '0';
            const weekData = clean[5] ?? '';
            const pctMatch = weekData.match(/[-\d.]+(\d{2}\.\d{2})$/);
            const currentPct = pctMatch ? pctMatch[1] : '0';
            const changeNum = parseFloat(change) || 0;
            const currentNum = parseFloat(currentPct) || 0;
            const prevNum = currentNum - changeNum;

            stocks.push({ code, name, bigHolderPct: currentPct, change, prevPct: prevNum.toFixed(2), bigHolderShares: 0 });
          }

          stocks.sort((a, b) => parseFloat(b.bigHolderPct) - parseFloat(a.bigHolderPct));

          const dateMatch = html.match(/(\d{8})/);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ date: dateMatch?.[1] ?? '', hasComparison: true, stocks: stocks.slice(0, 20) }));
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: String(err) }));
        }
      });

      // --- Yahoo TW news proxy ---
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? '';
        if (!url.startsWith('/api/yahoo-news')) return next();

        try {
          // 同時抓 Yahoo RSS、Google News (中央社)、鉅亨網
          const [rssRes, cnaRes, cnyesRes] = await Promise.all([
            httpsGet('https://tw.stock.yahoo.com/rss'),
            httpsGet('https://news.google.com/rss/search?q=%E5%8F%B0%E8%82%A1+site:cna.com.tw&hl=zh-TW&gl=TW&ceid=TW:zh-Hant'),
            httpsGet('https://news.cnyes.com/rss/v1/news/category/tw_stock'),
          ]);

          const items: Array<{ title: string; description: string; pubDate: string; link: string; source: string }> = [];

          // Parse Yahoo RSS
          const yahooMatches = rssRes.body.match(/<item>([\s\S]*?)<\/item>/g) ?? [];
          for (const itemXml of yahooMatches.slice(0, 4)) {
            const title = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ?? '';
            const desc = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ?? '';
            const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] ?? '';
            const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? '';
            if (link.includes('stock.yahoo.com') || title.includes('股') || title.includes('ETF') || title.includes('台積') || title.includes('AI')) {
              items.push({ title, description: desc.slice(0, 100), pubDate, link, source: 'Yahoo' });
            }
          }

          // Parse Google News (CNA)
          const cnaMatches = cnaRes.body.match(/<item>([\s\S]*?)<\/item>/g) ?? [];
          for (const itemXml of cnaMatches.slice(0, 4)) {
            const title = itemXml.match(/<title>(.*?)<\/title>/)?.[1] ?? '';
            const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] ?? '';
            const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? '';
            items.push({ title, description: '', pubDate, link, source: '中央社' });
          }

          // Parse 鉅亨網
          const cnyesMatches = cnyesRes.body.match(/<item>([\s\S]*?)<\/item>/g) ?? [];
          for (const itemXml of cnyesMatches.slice(0, 4)) {
            const titleRaw = itemXml.match(/<title>(.*?)<\/title>/)?.[1] ?? '';
            const title = titleRaw.replace(/<!\[CDATA\[|\]\]>/g, '');
            const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] ?? '';
            const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? '';
            const descRaw = itemXml.match(/<description>(.*?)<\/description>/)?.[1] ?? '';
            const desc = descRaw.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').slice(0, 100);
            items.push({ title, description: desc, pubDate, link, source: '鉅亨網' });
          }

          // Sort by date and take 6
          items.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ items: items.slice(0, 6) }));
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: String(err) }));
        }
      });

      // --- Yahoo TW ranking proxy ---
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? '';
        if (!url.startsWith('/api/yahoo-rank')) return next();

        try {
          const params = new URLSearchParams(url.split('?')[1] ?? '');
          const type = params.get('type') ?? 'change-up';
          const period = params.get('period') ?? 'day';
          const rankUrl = `https://tw.stock.yahoo.com/rank/${type}`;
          const rankRes = await httpsGet(rankUrl);

          const nameMatches = rankRes.body.match(/"symbolName":"([^"]+)"/g) ?? [];
          const priceMatches = rankRes.body.match(/"price":"([^"]+)"/g) ?? [];
          const changeMatches = rankRes.body.match(/"change":"([^"]+)"/g) ?? [];
          const pctMatches = rankRes.body.match(/"changePercent":"([^"]+)"/g) ?? [];
          const symbolMatches = rankRes.body.match(/"symbol":"([^"]+)"/g) ?? [];

          const extract = (matches: string[], key: string) =>
            matches.map(m => m.replace(`"${key}":"`, '').replace('"', ''));

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
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ stocks }));
            return;
          }

          // Week/Month: use chart API to calculate period change
          const range = period === 'week' ? '5d' : '1mo';
          const topSymbols = symbols.slice(0, 30);
          const results: Array<{ name: string; code: string; price: string; changePercent: string }> = [];

          for (const sym of topSymbols) {
            try {
              const chartRes = await httpsGet(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=${range}&interval=1d`);
              const chartData = JSON.parse(chartRes.body);
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

          // Sort
          const dir = type.includes('down') ? 1 : -1;
          results.sort((a, b) => dir * (parseFloat(a.changePercent) - parseFloat(b.changePercent)));

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ stocks: results.slice(0, 10) }));
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: String(err) }));
        }
      });

      // --- Yahoo Finance summary proxy ---
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? '';

        if (!url.startsWith('/api/yahoo-summary/')) {
          return next();
        }

        try {
          // Parse: /api/yahoo-summary/2330.TW?modules=topHoldings
          const match = url.match(/^\/api\/yahoo-summary\/([^?]+)(\?.*)?$/);
          if (!match) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Invalid URL' }));
            return;
          }

          const symbol = decodeURIComponent(match[1]);
          const queryString = match[2] ?? '';
          const params = new URLSearchParams(queryString);
          const modules = params.get('modules') ?? 'defaultKeyStatistics,financialData';

          console.log(`[yahoo-plugin] ${symbol} modules=${modules}`);

          const { crumb, cookies } = await ensureCrumb();
          console.log(`[yahoo-plugin] crumb OK (${crumb.length} chars)`);
          const apiUrl = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${modules}&crumb=${encodeURIComponent(crumb)}`;

          const apiRes = await httpsGet(apiUrl, cookies);

          // If 401, retry with fresh crumb
          if (apiRes.status === 401) {
            cachedCrumb = null;
            crumbExpiry = 0;
            const fresh = await ensureCrumb();
            const retryUrl = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${modules}&crumb=${encodeURIComponent(fresh.crumb)}`;
            const retryRes = await httpsGet(retryUrl, fresh.cookies);
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = retryRes.status;
            res.end(retryRes.body);
            return;
          }

          res.setHeader('Content-Type', 'application/json');
          res.statusCode = apiRes.status;
          res.end(apiRes.body);
        } catch (err) {
          console.error(`[yahoo-plugin] Error:`, err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: String(err) }));
        }
      });
    },
  };
}
