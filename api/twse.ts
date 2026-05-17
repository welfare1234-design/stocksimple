/**
 * Vercel Serverless Function: TWSE API proxy with rate limiting
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import https from 'https';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)';

let lastRequest = 0;

function httpsGet(url: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': UA } }, (res) => {
      let body = '';
      res.on('data', (chunk: string) => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body }));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Rate limit: 3 seconds between requests
    const now = Date.now();
    const wait = Math.max(0, 3000 - (now - lastRequest));
    if (wait > 0) await delay(wait);
    lastRequest = Date.now();

    // Forward path: /api/twse/rwd/zh/fund/T86?... → https://www.twse.com.tw/rwd/...
    const url = req.url ?? '';
    const path = url.replace(/^\/api\/twse/, '');
    const apiUrl = `https://www.twse.com.tw${path}`;

    const apiRes = await httpsGet(apiUrl);

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.setHeader('Content-Type', 'application/json');
    res.status(apiRes.status).send(apiRes.body);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
