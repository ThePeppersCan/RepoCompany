import { parseSunoLink } from '../../reparty/core.mjs';

// Metadata only. Playback stays inside Suno's official iframe; no media is
// downloaded, decrypted, proxied, or reconstructed from undocumented CDN paths.
const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
function failure(message, status) { return Object.assign(new Error(message), { status }); }

export function extractSong(html, id) {
  let flight = '';
  for (const match of html.matchAll(/self\.__next_f\.push\((\[[\s\S]*?\])\)\s*;?<\/script>/g)) {
    try { const packet = JSON.parse(match[1]); if (typeof packet[1] === 'string') flight += packet[1]; } catch {}
  }
  for (const line of flight.split('\n')) {
    let value;
    try { value = JSON.parse(line.slice(line.indexOf(':') + 1)); } catch { continue; }
    const stack = [value];
    while (stack.length) {
      const item = stack.pop();
      if (!item || typeof item !== 'object') continue;
      if (item.id === id && item.metadata && ('audio_url' in item || 'media_urls' in item)) {
        if (item.is_trashed || item.is_hidden) throw failure('This Suno song is unavailable.', 404);
        const duration = Number(item.metadata.duration);
        if (!Number.isFinite(duration) || duration < 1 || duration > 86400) throw failure('This song has no finished duration yet. Try again when Suno has finished it.', 422);
        return { id, title: String(item.title || 'Suno song').slice(0, 160), duration };
      }
      stack.push(...Object.values(item));
    }
  }
  throw failure('Suno did not provide song details. Check that the song link opens for other people.', 422);
}

async function boundedText(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = '', size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 4 * 1024 * 1024) throw failure('Suno returned too much data. Please try again later.', 502);
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally { await reader.cancel().catch(() => {}); }
}

export async function resolveSuno(input, fetcher = fetch) {
  const parsed = parseSunoLink(input);
  if (!parsed) throw failure('Paste a Suno song or share link.', 400);
  let url = parsed.id ? `https://suno.com/embed/${parsed.id}` : `https://suno.com/s/${parsed.share}`;
  const signal = AbortSignal.timeout(12000);
  for (let hop = 0; hop < 5; hop++) {
    const response = await fetcher(url, { redirect: 'manual', signal, headers: { Accept: 'text/html' } });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      await response.body?.cancel();
      if (!location) throw failure('Suno returned an incomplete share link.', 502);
      const target = new URL(location, url);
      if (target.protocol !== 'https:' || !parseSunoLink(target.href)) throw failure('This link does not lead to a Suno song.', 422);
      url = target.href;
      continue;
    }
    if (!response.ok) {
      await response.body?.cancel();
      throw failure(response.status === 404 ? 'This Suno song was not found.' : 'Suno could not be reached. Please try again shortly.', response.status === 404 ? 404 : 502);
    }
    const id = parseSunoLink(url)?.id;
    if (!id) { await response.body?.cancel(); throw failure('Suno could not resolve this share link.', 422); }
    return extractSong(await boundedText(response), id);
  }
  throw failure('Suno redirected this link too many times.', 422);
}

export async function onRequestGet({ request }) {
  try {
    const data = await resolveSuno(new URL(request.url).searchParams.get('url'));
    return new Response(JSON.stringify(data), { headers });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.status ? error.message : 'Suno could not be reached. Please try again shortly.' }), { status: error.status || 502, headers });
  }
}
