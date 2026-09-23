// Cloudflare Pages function. No YouTube API key required for video titles.
// Only an eleven-character video ID is accepted; no arbitrary upstream URLs.
export async function onRequestGet({ request }) {
  const id = new URL(request.url).searchParams.get('id') || '';
  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=3600' };
  if (!/^[a-zA-Z0-9_-]{11}$/.test(id)) return new Response(JSON.stringify({ error: 'Invalid video ID' }), { status: 400, headers });
  try {
    const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`;
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return new Response(JSON.stringify({ title: `YouTube · ${id}`, unavailable: true }), { headers });
    const data = await response.json();
    return new Response(JSON.stringify({ title: String(data.title || 'YouTube video').slice(0, 160) }), { headers });
  } catch {
    return new Response(JSON.stringify({ title: `YouTube · ${id}` }), { headers });
  }
}
