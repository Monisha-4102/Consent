// middleware.js
// Simple Vercel Edge-compatible middleware (no next/server)
//
// Behavior:
// - Allows common static asset paths to pass through
// - Checks Authorization header for Basic <base64>
// - Compares to process.env.BASIC_AUTH
// - If match -> forwards the original request (fetch(request))
// - If no match -> returns 401 + WWW-Authenticate header

const ASSET_EXT = /\.(js|css|png|jpg|jpeg|svg|ico|webmanifest|json|map|woff2?)$/i;

export default async function middleware(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // let static assets pass through immediately
  if (pathname.startsWith('/_next') || pathname.startsWith('/static') || ASSET_EXT.test(pathname)) {
    return fetch(request);
  }

  const authHeader = request.headers.get('authorization') || '';
  const expected = process.env.BASIC_AUTH || '';

  if (!expected) {
    return new Response('Server misconfigured (BASIC_AUTH missing)', { status: 500 });
  }

  // Expect header in form "Basic <base64>"
  if (authHeader.startsWith('Basic ')) {
    const provided = authHeader.split(' ')[1];
    if (provided === expected) {
      // authenticated — forward request to origin / next handler
      return fetch(request);
    }
  }

  // Not authenticated — ask for credentials
  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Protected"',
      'Content-Type': 'text/plain; charset=utf-8'
    }
  });
}
