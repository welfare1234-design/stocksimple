const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
let cachedCrumb = null;
let cachedCookie = '';
let crumbExpiry = 0;

async function ensureCrumb() {
  if (cachedCrumb && Date.now() < crumbExpiry) return { crumb: cachedCrumb, cookie: cachedCookie };
  const fcRes = await fetch('https://fc.yahoo.com/curveball', { headers: { 'User-Agent': UA }, redirect: 'manual' });
  const setCookie = fcRes.headers.get('set-cookie') || '';
  const cookie = setCookie.split(';')[0];
  const crumbRes = await fetch('https://query2.finance.yahoo.com/v1/test/getcrumb', { headers: { 'User-Agent': UA, 'Cookie': cookie } });
  if (!crumbRes.ok) throw new Error('Failed to get crumb: ' + crumbRes.status);
  cachedCrumb = (await crumbRes.text()).trim();
  cachedCookie = cookie;
  crumbExpiry = Date.now() + 300000;
  return { crumb: cachedCrumb, cookie: cachedCookie };
}

export async function onRequest(context) {
  try {
    const url = new URL(context.request.url);
    const symbol = url.pathname.replace('/api/yahoo-summary/', '');
    const modules = url.searchParams.get('modules') || 'defaultKeyStatistics,financialData';
    if (!symbol) return new Response(JSON.stringify({ error: 'Missing symbol' }), { status: 400 });
    const { crumb, cookie } = await ensureCrumb();
    const apiUrl = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${modules}&crumb=${encodeURIComponent(crumb)}`;
    let apiRes = await fetch(apiUrl, { headers: { 'User-Agent': UA, 'Cookie': cookie } });
    if (apiRes.status === 401) {
      cachedCrumb = null; crumbExpiry = 0;
      const fresh = await ensureCrumb();
      apiRes = await fetch(`https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${modules}&crumb=${encodeURIComponent(fresh.crumb)}`, { headers: { 'User-Agent': UA, 'Cookie': fresh.cookie } });
    }
    return new Response(await apiRes.text(), { status: apiRes.status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 's-maxage=60' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}
