import { type NextRequest, NextResponse } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/settings', '/history'];

// Routes that should redirect to dashboard if already logged in
const authRoutes = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if Supabase is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // If Supabase is not configured, allow all routes (dev mode)
  if (!supabaseUrl || !supabaseKey) {
    // In dev mode without Supabase, redirect protected routes to home
    const isProtectedRoute = protectedRoutes.some(route => 
      pathname.startsWith(route)
    );
    
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    return NextResponse.next();
  }
  
  // Supabase is configured - basic auth check using cookies
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Simple session check based on cookies
  const hasSession = request.cookies.getAll().some(c => 
    c.name.includes('sb-') && c.name.includes('-auth-token')
  );

  // Redirect logic
  if (isProtectedRoute && !hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (allow API to work without auth for testing)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
