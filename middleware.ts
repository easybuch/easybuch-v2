import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Just refresh the session, don't do any redirects
  // Let the client-side handle all auth logic
  await supabase.auth.getSession();

  return res;
}

export const config = {
  matcher: ['/', '/upload', '/belege', '/login', '/register'],
};
