/**
 * Vercel Serverless Function: Yahoo Finance quoteSummary proxy
 * Handles crumb/cookie authentication server-side
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
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
      res.on('data', (chunk: string) => { body += chunk; });
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
  const fcRes = await httpsGet('https://fc.yahoo.com/curveball');
  const allCookies = [...fcRes.setCookies];
  const crumbRes = await httpsGet('https://query2.finance.yahoo.com/v1/test/getcrumb', allCookies);
  if (crumbRes.status !== 200) throw new Error(`Failed to get crumb: ${crumbRes.status}`);
  cachedCrumb = crumbRes.body.trim();
  cachedCookies = allCookies;
  crumbExpiry = Date.now() + 5 * 60 * 1000;
  return { crumb: cachedCrumb, cookies: cachedCookies };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Parse symbol from URL: /api/yahoo-summary/2330.TW?modules=topHoldings
    const url = req.url ?? '';
    const match = url.match(/\/api\/yahoo-summary\/([^?]+)(\?.*)?$/);
    if (!match) {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    const symbol = decodeURIComponent(match[1]);
    const params = new URLSearchParams(match[2] ?? '');
    const modules = params.get('modules') ?? 'defaultKeyStatistics,financialData';

    const { crumb, cookies } = await ensureCrumb();
    const apiUrl = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${modules}&crumb=${encodeURIComponent(crumb)}`;

    let apiRes = await httpsGet(apiUrl, cookies);

    // Retry with fresh crumb on 401
    if (apiRes.status === 401) {
      cachedCrumb = null;
      crumbExpiry = 0;
      const fresh = await ensureCrumb();
      const retryUrl = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${modules}&crumb=${encodeURIComponent(fresh.crumb)}`;
      apiRes = await httpsGet(retryUrl, fresh.cookies);
    }

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.status(apiRes.status).send(apiRes.body);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
