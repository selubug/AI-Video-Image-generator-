import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-server';
import { supabase } from '@/lib/supabase';
import { subscriptionPlans } from '@/lib/subscription-plans';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('Stripe-Signature') as string;

  let event: any;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  const session = event.data.object;

  if (event.type === 'checkout.session.completed') {
    // Get the subscription details
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    // Get the price ID from the subscription
    const priceId = subscription.items.data[0].price.id;

    // Find the corresponding plan
    const plan = subscriptionPlans.find(p => p.stripePriceId === priceId);
    if (!plan) {
      console.error('No matching plan found for price ID:', priceId);
      return new NextResponse('No matching plan found', { status: 400 });
    }

    // Update user_subscriptions table
    const { error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: session.metadata.userId,
        subscription_id: subscription.id,
        plan_id: priceId,
        status: subscription.status,
        updated_at: new Date().toISOString(),
      });

    if (subscriptionError) {
      console.error('Error updating subscription:', subscriptionError);
      return new NextResponse('Error updating subscription', { status: 500 });
    }

    // Update users table with new daily limit
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: session.metadata.userId,
        daily_image_gens: typeof plan.features.imageGens === 'number' 
          ? plan.features.imageGens 
          : 999999, // For unlimited plans
        last_reset_date: new Date().toISOString(),
      });

    if (userError) {
      console.error('Error updating user limits:', userError);
      return new NextResponse('Error updating user limits', { status: 500 });
    }
  }

  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    // Get the subscription details
    const subscription = event.data.object;
    const priceId = subscription.items.data[0].price.id;

    // Find the corresponding plan
    const plan = subscriptionPlans.find(p => p.stripePriceId === priceId);
    if (!plan) {
      console.error('No matching plan found for price ID:', priceId);
      return new NextResponse('No matching plan found', { status: 400 });
    }

    // Update user_subscriptions table
    const { error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: subscription.metadata.userId,
        subscription_id: subscription.id,
        plan_id: priceId,
        status: subscription.status,
        updated_at: new Date().toISOString(),
      });

    if (subscriptionError) {
      console.error('Error updating subscription:', subscriptionError);
      return new NextResponse('Error updating subscription', { status: 500 });
    }

    // If subscription is cancelled or past due, reset to free plan limits
    if (subscription.status === 'canceled' || subscription.status === 'past_due') {
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: subscription.metadata.userId,
          daily_image_gens: 5, // Free plan limit
          last_reset_date: new Date().toISOString(),
        });

      if (userError) {
        console.error('Error resetting user limits:', userError);
        return new NextResponse('Error resetting user limits', { status: 500 });
      }
    } else {
      // Update users table with new daily limit
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: subscription.metadata.userId,
          daily_image_gens: typeof plan.features.imageGens === 'number' 
            ? plan.features.imageGens 
            : 999999, // For unlimited plans
          last_reset_date: new Date().toISOString(),
        });

      if (userError) {
        console.error('Error updating user limits:', userError);
        return new NextResponse('Error updating user limits', { status: 500 });
      }
    }
  }

  return new NextResponse(null, { status: 200 });
} 