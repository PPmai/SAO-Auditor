import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('admin_session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const session = JSON.parse(
      Buffer.from(sessionCookie.value, 'base64').toString()
    );
    
    // Check if session is expired
    if (session.exp < Date.now()) {
      cookieStore.delete('admin_session');
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      user: {
        email: session.email,
        role: session.role,
        name: session.name,
      },
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid session' },
      { status: 401 }
    );
  }
}




