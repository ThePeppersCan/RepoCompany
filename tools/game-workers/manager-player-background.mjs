// A bounded response correction around the captured live Worker. Every other
// request, export and binding remains with that Worker. Unexpected newer CSS is
// forwarded unchanged, so this fix cannot hide a later published game update.
export function withManagerPlayerBackground(original, correction) {
  if (!/^[a-f0-9]{64}$/.test(correction.originalSha256) || typeof correction.css !== 'string' || correction.css.length > 512 * 1024) throw new Error('Invalid Manager CSS correction.');
  const hex = buffer => Array.from(new Uint8Array(buffer), value => value.toString(16).padStart(2, '0')).join('');
  return {
    ...original,
    async fetch(request, env, context) {
      const url = new URL(request.url);
      if (url.origin !== 'https://manager.repocompany.uk' || url.pathname !== '/player-career.css' || !['GET', 'HEAD'].includes(request.method)) return original.fetch(request, env, context);
      // Read the actual stylesheet even when the browser has cached its old ETag.
      const headers = new Headers(request.headers);
      for (const name of ['if-none-match', 'if-modified-since', 'range', 'if-range']) headers.delete(name);
      const response = await original.fetch(new Request(request, { method: 'GET', headers }), env, context);
      const head = result => request.method === 'HEAD' ? new Response(null, { status: result.status, statusText: result.statusText, headers: result.headers }) : result;
      if (response.status !== 200 || !response.headers.get('content-type')?.includes('text/css') || Number(response.headers.get('content-length')) > 512 * 1024) return head(response);
      const bytes = await response.clone().arrayBuffer();
      if (bytes.byteLength > 512 * 1024 || hex(await crypto.subtle.digest('SHA-256', bytes)) !== correction.originalSha256) return head(response);
      const correctedHeaders = new Headers(response.headers);
      for (const name of ['content-length', 'content-encoding', 'etag', 'last-modified']) correctedHeaders.delete(name);
      correctedHeaders.set('cache-control', 'no-cache');
      correctedHeaders.set('x-repo-manager-background', '1');
      return head(new Response(correction.css, { status: 200, headers: correctedHeaders }));
    }
  };
}
