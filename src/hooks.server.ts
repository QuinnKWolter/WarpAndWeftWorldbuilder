import { json } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';
export const handle: Handle = async ({ event, resolve }) => {
  if (event.url.pathname.startsWith('/api/') && !['GET', 'HEAD'].includes(event.request.method)) {
    const origin = event.request.headers.get('origin');
    if (origin && origin !== event.url.origin)
      return json({ message: 'Cross-origin writes are not allowed.' }, { status: 403 });
    const size = Number(event.request.headers.get('content-length') ?? 0);
    if (size > 20 * 1024 * 1024)
      return json({ message: 'Project exceeds the 20 MB request limit.' }, { status: 413 });
  }
  const response = await resolve(event);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'same-origin');
  response.headers.set('X-Frame-Options', 'DENY');
  if (event.url.pathname.startsWith('/api/')) response.headers.set('Cache-Control', 'no-store');
  return response;
};
