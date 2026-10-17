// Keep the retired route explicit so older clients cannot reach a paid service.
export function onRequest() {
  return Response.json({ error: 'This feature has been removed.' }, {
    status: 410,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
  });
}
