const BARRY_VOICE_ID = 'goT3UYdM9bhm0n2lmKQx';
const BARRY_MODEL_ID = 'eleven_flash_v2_5';
const MAX_TEXT_LENGTH = 220;

const DELIVERY = {
  calm:       { stability: 0.56, similarity_boost: 0.84, style: 0.16, speed: 1.02 },
  interested: { stability: 0.49, similarity_boost: 0.84, style: 0.28, speed: 1.06 },
  excited:    { stability: 0.39, similarity_boost: 0.85, style: 0.44, speed: 1.10 },
  explosive:  { stability: 0.31, similarity_boost: 0.86, style: 0.58, speed: 1.14 }
};

function json(message, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.ELEVENLABS_API_KEY) {
    return json('Barry neural voice is not configured on this deployment.', 503);
  }

  // The browser game should call this from the same Pages origin.
  const requestUrl = new URL(request.url);
  const origin = request.headers.get('Origin');
  if (origin && origin !== requestUrl.origin) {
    return json('Cross-origin TTS requests are not allowed.', 403);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json('Invalid JSON body.');
  }

  const text = String(payload?.text || '').replace(/\s+/g, ' ').trim();
  const intensity = Object.prototype.hasOwnProperty.call(DELIVERY, payload?.intensity)
    ? payload.intensity
    : 'calm';

  if (!text) return json('No commentary text supplied.');
  if (text.length > MAX_TEXT_LENGTH) return json(`Commentary is limited to ${MAX_TEXT_LENGTH} characters.`);

  // Cache by the exact spoken line + delivery style. This avoids paying to regenerate
  // the same Barry call every time a future match happens in the same edge location.
  const hash = await sha256(`${BARRY_VOICE_ID}|${BARRY_MODEL_ID}|${intensity}|${text}`);
  const cacheKey = new Request(`${requestUrl.origin}/__barry_tts_cache/${hash}.mp3`, { method: 'GET' });
  const cache = caches.default;
  const cached = await cache.match(cacheKey);
  if (cached) {
    const hit = new Response(cached.body, cached);
    hit.headers.set('X-Barry-TTS-Cache', 'HIT');
    return hit;
  }

  const voice = DELIVERY[intensity];
  const elevenUrl = `https://api.elevenlabs.io/v1/text-to-speech/${BARRY_VOICE_ID}/stream?output_format=mp3_44100_128`;

  let upstream;
  try {
    upstream = await fetch(elevenUrl, {
      method: 'POST',
      headers: {
        'xi-api-key': env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text,
        model_id: BARRY_MODEL_ID,
        voice_settings: {
          ...voice,
          use_speaker_boost: true
        }
      })
    });
  } catch {
    return json('Unable to reach the neural voice service.', 502);
  }

  if (!upstream.ok || !upstream.body) {
    let detail = '';
    try { detail = (await upstream.text()).slice(0, 180); } catch {}
    console.error('ElevenLabs TTS error', upstream.status, detail);
    return json('Barry neural voice request failed.', 502);
  }

  const headers = new Headers({
    'Content-Type': 'audio/mpeg',
    'Cache-Control': 'public, max-age=2592000',
    'X-Barry-TTS-Cache': 'MISS'
  });
  const response = new Response(upstream.body, { status: 200, headers });

  // Store a clone in Cloudflare's Cache API without delaying playback.
  context.waitUntil(cache.put(cacheKey, response.clone()).catch(() => {}));
  return response;
}

export function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
}
