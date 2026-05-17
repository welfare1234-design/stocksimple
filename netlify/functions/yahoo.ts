import type { Context } from '@netlify/functions';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)';

export default async (req: Request, _context: Context) => {
  try {
    const url = new URL(req.url);
    const path = url.pathname
      .replace('/.netlify/functions/yahoo', '')
      .replace('/api/yahoo', '')
      + url.search;
    const apiUrl = `https://query1.finance.yahoo.com${path}`;

    const apiRes = await fetch(apiUrl, {
      headers: { 'User-Agent': UA },
    });

    const body = await apiRes.text();
    return new Response(body, {
      status: apiRes.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
};
