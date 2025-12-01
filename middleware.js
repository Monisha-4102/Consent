// middleware.js  — Edge-compatible for static sites on Vercel
const ASSET_EXT = /\.(js|css|png|jpg|jpeg|svg|ico|webmanifest|json|map|woff2?)$/i;

export default async function middleware(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // allow static assets and API routes to pass through
  if (pathname.startsWith('/_next') || pathname.startsWith('/static') || ASSET_EXT.test(pathname) || pathname.startsWith('/api')) {
    return fetch(request);
  }

  const authHeader = request.headers.get('authorization') || '';
  const expected = process.env.BASIC_AUTH || '';

  if (!expected) {
    return new Response('Server misconfigured (BASIC_AUTH missing)', { status: 500 });
  }

  // Expect header "Basic <base64>"
  if (authHeader.startsWith('Basic ')) {
    const provided = authHeader.split(' ')[1];
    if (provided === expected) {
      return fetch(request); // authenticated — forward request to origin
    }
  }

  // Not authenticated — prompt browser for credentials
  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Protected"',
      'Content-Type': 'text/plain; charset=utf-8'
    }
  });
}
