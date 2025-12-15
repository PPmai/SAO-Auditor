import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('auth_session');
  
  if (!sessionToken) {
    return NextResponse.json(
      { user: null },
      { status: 401 }
    );
  }
  
  // Simple validation - in production, you'd verify the token properly
  try {
    const decoded = Buffer.from(sessionToken.value, 'base64').toString('utf-8');
    const [email] = decoded.split(':');
    
    return NextResponse.json({
      user: {
        email: email,
        id: 'admin',
        name: 'Admin User',
      },
    });
  } catch {
    return NextResponse.json(
      { user: null },
      { status: 401 }
    );
  }
}





