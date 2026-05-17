import type { Context } from '@netlify/functions';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)';

let cachedCrumb: string | null = null;
let cachedCookie: string = '';
let crumbExpiry = 0;

async function ensureCrumb(): Promise<{ crumb: string; cookie: string }> {
  if (cachedCrumb && Date.now() < crumbExpiry) {
    return { crumb: cachedCrumb, cookie: cachedCookie };
  }

  // Step 1: get cookie
  const fcRes = await fetch('https://fc.yahoo.com/curveball', {
    headers: { 'User-Agent': UA },
    redirect: 'manual',
  });
  const setCookie = fcRes.headers.get('set-cookie') ?? '';

  // Step 2: get crumb
  const crumbRes = await fetch('https://query2.finance.yahoo.com/v1/test/getcrumb', {
    headers: { 'User-Agent': UA, 'Cookie': setCookie.split(';')[0] },
  });
  if (!crumbRes.ok) throw new Error(`Failed to get crumb: ${crumbRes.status}`);

  cachedCrumb = (await crumbRes.text()).trim();
  cachedCookie = setCookie.split(';')[0];
  crumbExpiry = Date.now() + 5 * 60 * 1000;
  return { crumb: cachedCrumb, cookie: cachedCookie };
}

export default async (req: Request, _context: Context) => {
  try {
    const url = new URL(req.url);
    const pathname = url.pathname
      .replace('/.netlify/functions/yahoo-summary', '')
      .replace('/api/yahoo-summary', '')
      .replace(/^\//, '');
    const symbol = decodeURIComponent(pathname);
    const modules = url.searchParams.get('modules') ?? 'defaultKeyStatistics,financialData';

    if (!symbol) {
      return new Response(JSON.stringify({ error: 'Missing symbol' }), { status: 400 });
    }

    const { crumb, cookie } = await ensureCrumb();
    const apiUrl = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${modules}&crumb=${encodeURIComponent(crumb)}`;

    let apiRes = await fetch(apiUrl, {
      headers: { 'User-Agent': UA, 'Cookie': cookie },
    });

    // Retry with fresh crumb on 401
    if (apiRes.status === 401) {
      cachedCrumb = null;
      crumbExpiry = 0;
      const fresh = await ensureCrumb();
      const retryUrl = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${modules}&crumb=${encodeURIComponent(fresh.crumb)}`;
      apiRes = await fetch(retryUrl, {
        headers: { 'User-Agent': UA, 'Cookie': fresh.cookie },
      });
    }

    const body = await apiRes.text();
    return new Response(body, {
      status: apiRes.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
};
