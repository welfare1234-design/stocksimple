// Cloudflare Pages Function: TWSE API proxy
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)';

export const onRequest: PagesFunction = async (context) => {
  try {
    const url = new URL(context.request.url);
    const path = url.pathname.replace('/api/twse', '') + url.search;
    const apiUrl = `https://www.twse.com.tw${path}`;

    const apiRes = await fetch(apiUrl, { headers: { 'User-Agent': UA } });

    return new Response(await apiRes.text(), {
      status: apiRes.status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 's-maxage=300' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
};
