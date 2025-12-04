import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');
  
  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
  
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        
        if (userId && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          
          // Determine tier based on price
          const priceId = subscription.items.data[0]?.price.id;
          const tier = priceId?.includes('agency') ? 'AGENCY' : 'PRO';
          
          await prisma.user.update({
            where: { id: userId },
            data: {
              tier,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
            },
          });
          
          // Create subscription record
          await prisma.subscription.upsert({
            where: { userId },
            create: {
              userId,
              stripeSubscriptionId: session.subscription as string,
              stripePriceId: priceId || '',
              status: 'ACTIVE',
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            },
            update: {
              stripeSubscriptionId: session.subscription as string,
              stripePriceId: priceId || '',
              status: 'ACTIVE',
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            },
          });
          
          console.log(`User ${userId} upgraded to ${tier}`);
        }
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        const user = await prisma.user.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });
        
        if (user) {
          const status = subscription.status === 'active' ? 'ACTIVE' :
                        subscription.status === 'canceled' ? 'CANCELED' :
                        subscription.status === 'past_due' ? 'PAST_DUE' : 'ACTIVE';
          
          await prisma.subscription.update({
            where: { userId: user.id },
            data: {
              status,
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            },
          });
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        const user = await prisma.user.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });
        
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              tier: 'FREE',
              stripeSubscriptionId: null,
            },
          });
          
          await prisma.subscription.update({
            where: { userId: user.id },
            data: { status: 'CANCELED' },
          });
          
          console.log(`User ${user.id} downgraded to FREE`);
        }
        break;
      }
    }
    
    return NextResponse.json({ received: true });
    
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

