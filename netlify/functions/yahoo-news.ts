import type { Context } from '@netlify/functions';

export default async (_req: Request, _context: Context) => {
  try {
    // 同時抓 Yahoo RSS、Google News (中央社)、鉅亨網
    const [yahooRes, cnaRes, cnyesRes] = await Promise.all([
      fetch('https://tw.stock.yahoo.com/rss', { headers: { 'User-Agent': 'Mozilla/5.0' } }),
      fetch('https://news.google.com/rss/search?q=%E5%8F%B0%E8%82%A1+site:cna.com.tw&hl=zh-TW&gl=TW&ceid=TW:zh-Hant', { headers: { 'User-Agent': 'Mozilla/5.0' } }),
      fetch('https://news.cnyes.com/rss/v1/news/category/tw_stock', { headers: { 'User-Agent': 'Mozilla/5.0' } }),
    ]);

    const yahooXml = await yahooRes.text();
    const cnaXml = await cnaRes.text();
    const cnyesXml = await cnyesRes.text();

    const items: Array<{ title: string; description: string; pubDate: string; link: string; source: string }> = [];

    // Parse Yahoo RSS
    const yahooItems = yahooXml.match(/<item>([\s\S]*?)<\/item>/g) ?? [];
    for (const itemXml of yahooItems.slice(0, 6)) {
      const title = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ?? '';
      const desc = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ?? '';
      const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] ?? '';
      const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? '';
      if (link.includes('stock.yahoo.com') || title.includes('股') || title.includes('ETF') || title.includes('台積') || title.includes('AI')) {
        items.push({ title, description: desc.slice(0, 100), pubDate, link, source: 'Yahoo' });
      }
    }

    // Parse Google News (CNA)
    const cnaItems = cnaXml.match(/<item>([\s\S]*?)<\/item>/g) ?? [];
    for (const itemXml of cnaItems.slice(0, 4)) {
      const title = itemXml.match(/<title>(.*?)<\/title>/)?.[1] ?? '';
      const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] ?? '';
      const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? '';
      items.push({ title, description: '', pubDate, link, source: '中央社' });
    }

    // Parse 鉅亨網
    const cnyesItems = cnyesXml.match(/<item>([\s\S]*?)<\/item>/g) ?? [];
    for (const itemXml of cnyesItems.slice(0, 4)) {
      const titleRaw = itemXml.match(/<title>(.*?)<\/title>/)?.[1] ?? '';
      const title = titleRaw.replace(/<!\[CDATA\[|\]\]>/g, '');
      const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] ?? '';
      const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? '';
      const descRaw = itemXml.match(/<description>(.*?)<\/description>/)?.[1] ?? '';
      const desc = descRaw.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').slice(0, 100);
      items.push({ title, description: desc, pubDate, link, source: '鉅亨網' });
    }

    // Sort by date (newest first) and take top 8
    items.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    return new Response(JSON.stringify({ items: items.slice(0, 8) }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
};
