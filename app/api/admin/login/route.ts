import { NextRequest, NextResponse } from 'next/server';
import { validateAdmin } from '@/lib/admin-config';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    const admin = validateAdmin(email, password);
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Create a simple session token (in production, use JWT or proper session management)
    const sessionToken = Buffer.from(JSON.stringify({
      email: admin.email,
      role: admin.role,
      name: admin.name,
      exp: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
    })).toString('base64');
    
    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });
    
    return NextResponse.json({
      success: true,
      user: admin,
    });
    
  } catch (error: any) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}




