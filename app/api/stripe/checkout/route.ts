import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCheckoutSession, PRICE_IDS } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { plan } = await request.json();
    
    const priceId = plan === 'agency' ? PRICE_IDS.AGENCY_MONTHLY : PRICE_IDS.PRO_MONTHLY;
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    
    const session = await createCheckoutSession(
      user.id,
      user.email!,
      priceId,
      `${origin}/dashboard?success=true`,
      `${origin}/pricing?canceled=true`
    );
    
    return NextResponse.json({ url: session.url });
    
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

