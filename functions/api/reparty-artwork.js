// Fixed Wikipedia endpoint; callers cannot supply an upstream URL.
const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' };
const imageHosts = new Set(['upload.wikimedia.org', 'thumb.wikimedia.org']);
export function validArtworkUrl(value) {
  try { const url = new URL(value); return url.protocol === 'https:' && imageHosts.has(url.hostname) && !url.username && !url.password; } catch { return false; }
}
export async function findArtwork(title, category, year, fetcher = fetch) {
  const base = title.replace(/\s*\(\d{4}(?: game| film)?\)\s*$/i, '').trim();
  const kind = category === 'game' ? 'video game' : 'film';
  const candidates = [...new Set([year && `${base} (${year} ${kind})`, `${base} (${kind})`, title, base].filter(Boolean))];
  const url = new URL('https://en.wikipedia.org/w/api.php');
  url.search = new URLSearchParams({ action: 'query', format: 'json', formatversion: '2', prop: 'pageimages|info', inprop: 'url', piprop: 'thumbnail', pithumbsize: '600', pilicense: 'any', redirects: '1', titles: candidates.join('|') });
  const response = await fetcher(url, { signal: AbortSignal.timeout(4000), headers: { 'User-Agent': 'Reparty/1.0 (https://repocompany.uk/reparty/)' } });
  if (!response.ok) return null;
  const data = await response.json();
  const redirects = new Map([...(data.query?.normalized || []), ...(data.query?.redirects || [])].map(r => [r.from, r.to]));
  for (let title of candidates) {
    const visited = new Set();
    while (redirects.has(title) && !visited.has(title)) { visited.add(title); title = redirects.get(title); }
    const page = data.query?.pages?.find(p => p.title === title && !p.missing);
    if (!page?.thumbnail?.source || !validArtworkUrl(page.thumbnail.source)) continue;
    const source = `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replaceAll(' ', '_'))}`;
    return { image: page.thumbnail.source, source, title: page.title, credit: 'Artwork via Wikipedia' };
  }
  return null;
}
export async function onRequestGet({ request }) {
  const params = new URL(request.url).searchParams;
  const title = (params.get('title') || '').trim(), category = params.get('category'), year = params.get('year') || '';
  if (title.length < 1 || title.length > 180 || /[|\u0000-\u001f]/.test(title) || !['game', 'movie', 'disney'].includes(category) || (year && !/^(18|19|20)\d{2}$/.test(year))) {
    return new Response(JSON.stringify({ error: 'Invalid artwork request' }), { status: 400, headers: JSON_HEADERS });
  }
  try {
    const artwork = await findArtwork(title, category, year);
    return new Response(JSON.stringify({ artwork }), { headers: { ...JSON_HEADERS, 'Cache-Control': artwork ? 'public, max-age=86400' : 'public, max-age=300' } });
  } catch {
    return new Response(JSON.stringify({ artwork: null }), { headers: { ...JSON_HEADERS, 'Cache-Control': 'public, max-age=60' } });
  }
}
