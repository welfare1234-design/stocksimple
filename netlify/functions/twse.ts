import type { Context } from '@netlify/functions';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)';

let lastRequest = 0;

export default async (req: Request, _context: Context) => {
  try {
    const now = Date.now();
    const wait = Math.max(0, 3000 - (now - lastRequest));
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastRequest = Date.now();

    const url = new URL(req.url);
    const path = url.pathname
      .replace('/.netlify/functions/twse', '')
      .replace('/api/twse', '')
      + url.search;
    const apiUrl = `https://www.twse.com.tw${path}`;

    const apiRes = await fetch(apiUrl, {
      headers: { 'User-Agent': UA },
    });

    const body = await apiRes.text();
    return new Response(body, {
      status: apiRes.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
};
