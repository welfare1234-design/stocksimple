const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

export async function onRequest() {
  try {
    const [yahooRes, cnaRes, cnyesRes] = await Promise.all([
      fetch('https://tw.stock.yahoo.com/rss', { headers: { 'User-Agent': UA } }),
      fetch('https://news.google.com/rss/search?q=%E5%8F%B0%E8%82%A1+site:cna.com.tw&hl=zh-TW&gl=TW&ceid=TW:zh-Hant', { headers: { 'User-Agent': UA } }),
      fetch('https://news.cnyes.com/rss/v1/news/category/tw_stock', { headers: { 'User-Agent': UA } }),
    ]);
    const [yahooXml, cnaXml, cnyesXml] = await Promise.all([yahooRes.text(), cnaRes.text(), cnyesRes.text()]);
    const items = [];

    (yahooXml.match(/<item>([\s\S]*?)<\/item>/g) || []).slice(0, 4).forEach(x => {
      const title = (x.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || [])[1] || '';
      const desc = ((x.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || [])[1] || '').slice(0, 100);
      const link = (x.match(/<link>(.*?)<\/link>/) || [])[1] || '';
      const pubDate = (x.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1] || '';
      if (link.includes('stock.yahoo.com') || title.includes('股') || title.includes('ETF') || title.includes('AI'))
        items.push({ title, description: desc, pubDate, link, source: 'Yahoo' });
    });

    (cnaXml.match(/<item>([\s\S]*?)<\/item>/g) || []).slice(0, 4).forEach(x => {
      const title = (x.match(/<title>(.*?)<\/title>/) || [])[1] || '';
      const link = (x.match(/<link>(.*?)<\/link>/) || [])[1] || '';
      const pubDate = (x.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1] || '';
      items.push({ title, description: '', pubDate, link, source: '中央社' });
    });

    (cnyesXml.match(/<item>([\s\S]*?)<\/item>/g) || []).slice(0, 4).forEach(x => {
      const title = ((x.match(/<title>(.*?)<\/title>/) || [])[1] || '').replace(/<!\[CDATA\[|\]\]>/g, '');
      const link = (x.match(/<link>(.*?)<\/link>/) || [])[1] || '';
      const pubDate = (x.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1] || '';
      items.push({ title, description: '', pubDate, link, source: '鉅亨網' });
    });

    items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    return new Response(JSON.stringify({ items: items.slice(0, 6) }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 's-maxage=300' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}
