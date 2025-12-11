import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Simple authentication - username/password from env or defaults
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    // Simple username/password check
    // You can use email as username or check both
    const isValid = 
      (email === ADMIN_USERNAME || email === `${ADMIN_USERNAME}@admin.local`) &&
      password === ADMIN_PASSWORD;
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Create simple session token
    const sessionToken = Buffer.from(`${email}:${Date.now()}`).toString('base64');
    const cookieStore = await cookies();
    
    // Set session cookie (expires in 7 days)
    cookieStore.set('auth_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    
    return NextResponse.json({
      success: true,
      user: {
        email: email,
        id: 'admin',
        name: 'Admin User',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}


