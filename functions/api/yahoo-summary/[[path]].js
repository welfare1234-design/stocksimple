const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
let cachedCrumb = null, cachedCookie = '', crumbExpiry = 0;

async function ensureCrumb() {
  if (cachedCrumb && Date.now() < crumbExpiry) return { crumb: cachedCrumb, cookie: cachedCookie };
  const fc = await fetch('https://fc.yahoo.com/curveball', { headers: { 'User-Agent': UA }, redirect: 'manual' });
  const cookie = (fc.headers.get('set-cookie') || '').split(';')[0];
  const cr = await fetch('https://query2.finance.yahoo.com/v1/test/getcrumb', { headers: { 'User-Agent': UA, 'Cookie': cookie } });
  if (!cr.ok) throw new Error('crumb failed');
  cachedCrumb = (await cr.text()).trim();
  cachedCookie = cookie;
  crumbExpiry = Date.now() + 300000;
  return { crumb: cachedCrumb, cookie: cachedCookie };
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const symbol = url.pathname.replace('/api/yahoo-summary/', '');
  const modules = url.searchParams.get('modules') || 'defaultKeyStatistics,financialData';
  if (!symbol) return new Response('{"error":"no symbol"}', { status: 400 });
  const { crumb, cookie } = await ensureCrumb();
  let r = await fetch(`https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${modules}&crumb=${encodeURIComponent(crumb)}`, { headers: { 'User-Agent': UA, 'Cookie': cookie } });
  if (r.status === 401) { cachedCrumb = null; crumbExpiry = 0; const f = await ensureCrumb(); r = await fetch(`https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${modules}&crumb=${encodeURIComponent(f.crumb)}`, { headers: { 'User-Agent': UA, 'Cookie': f.cookie } }); }
  return new Response(await r.text(), { status: r.status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 's-maxage=60' } });
}
