// middleware.js
import { NextResponse } from 'next/server';

const AUTH_HEADER = process.env.BASIC_AUTH; // base64 of "username:password"

export function middleware(request) {
  // Allow health checks or assets if you need - adjust paths as necessary
  const pathname = request.nextUrl.pathname;

  // Skip middleware for static assets (optional)
  if (pathname.startsWith('/_next') || pathname.startsWith('/static') || pathname.includes('.png') || pathname.includes('.svg')) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get('authorization') || '';

  if (!AUTH_HEADER) {
    // If env var missing, reject to avoid accidental open site
    return new Response('Server misconfigured (BASIC_AUTH missing)', { status: 500 });
  }

  if (!authHeader.startsWith('Basic ')) {
    return new Response('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Protected"' }
    });
  }

  const provided = authHeader.split(' ')[1]; // base64 string
  if (provided === AUTH_HEADER) {
    return NextResponse.next(); // authorized
  }

  return new Response('Unauthorized', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Protected"' }
  });
}
