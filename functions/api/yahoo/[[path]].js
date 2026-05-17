const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname.replace('/api/yahoo', '') + url.search;
  const r = await fetch('https://query1.finance.yahoo.com' + path, { headers: { 'User-Agent': UA } });
  return new Response(await r.text(), { status: r.status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 's-maxage=30' } });
}
