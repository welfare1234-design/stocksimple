/**
 * Vercel Serverless Function: Yahoo Finance chart API proxy
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import https from 'https';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)';

function httpsGet(url: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': UA } }, (res) => {
      let body = '';
      res.on('data', (chunk: string) => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body }));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Forward path: /api/yahoo/v8/finance/chart/2330.TW?... → https://query1.finance.yahoo.com/v8/...
    const url = req.url ?? '';
    const path = url.replace(/^\/api\/yahoo/, '');
    const apiUrl = `https://query1.finance.yahoo.com${path}`;

    const apiRes = await httpsGet(apiUrl);

    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    res.setHeader('Content-Type', 'application/json');
    res.status(apiRes.status).send(apiRes.body);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
