import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createPortalSession } from '@/lib/stripe';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });
    
    if (!dbUser?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No active subscription' },
        { status: 400 }
      );
    }
    
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    
    const session = await createPortalSession(
      dbUser.stripeCustomerId,
      `${origin}/dashboard`
    );
    
    return NextResponse.json({ url: session.url });
    
  } catch (error: any) {
    console.error('Portal error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

