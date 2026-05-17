const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

export async function onRequest() {
  const [y, c, n] = await Promise.all([
    fetch('https://tw.stock.yahoo.com/rss', { headers: { 'User-Agent': UA } }),
    fetch('https://news.google.com/rss/search?q=%E5%8F%B0%E8%82%A1+site:cna.com.tw&hl=zh-TW&gl=TW&ceid=TW:zh-Hant', { headers: { 'User-Agent': UA } }),
    fetch('https://news.cnyes.com/rss/v1/news/category/tw_stock', { headers: { 'User-Agent': UA } }),
  ]);
  const [yx, cx, nx] = await Promise.all([y.text(), c.text(), n.text()]);
  const items = [];
  (yx.match(/<item>([\s\S]*?)<\/item>/g) || []).slice(0, 4).forEach(x => {
    const t = (x.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || [])[1] || '';
    const d = ((x.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || [])[1] || '').slice(0, 100);
    const l = (x.match(/<link>(.*?)<\/link>/) || [])[1] || '';
    const p = (x.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1] || '';
    if (l.includes('stock.yahoo.com') || t.includes('股') || t.includes('ETF') || t.includes('AI')) items.push({ title: t, description: d, pubDate: p, link: l, source: 'Yahoo' });
  });
  (cx.match(/<item>([\s\S]*?)<\/item>/g) || []).slice(0, 4).forEach(x => {
    items.push({ title: (x.match(/<title>(.*?)<\/title>/) || [])[1] || '', description: '', pubDate: (x.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1] || '', link: (x.match(/<link>(.*?)<\/link>/) || [])[1] || '', source: '中央社' });
  });
  (nx.match(/<item>([\s\S]*?)<\/item>/g) || []).slice(0, 4).forEach(x => {
    items.push({ title: ((x.match(/<title>(.*?)<\/title>/) || [])[1] || '').replace(/<!\[CDATA\[|\]\]>/g, ''), description: '', pubDate: (x.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1] || '', link: (x.match(/<link>(.*?)<\/link>/) || [])[1] || '', source: '鉅亨網' });
  });
  items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  return new Response(JSON.stringify({ items: items.slice(0, 6) }), { headers: { 'Content-Type': 'application/json' } });
}
