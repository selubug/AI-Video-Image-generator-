import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-server';
import { supabase } from '@/utils/supabase';
import { subscriptionPlans } from '@/lib/subscription-plans';

export async function POST(req: Request) {
  console.log('Webhook received');
  
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('Stripe-Signature') as string;

  console.log('Webhook signature:', signature);
  console.log('Webhook body:', body);

  let event: any;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    console.log('Webhook event constructed successfully:', event.type);
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  const session = event.data.object;
  console.log('Event data object:', session);

  if (event.type === 'checkout.session.completed') {
    console.log('Processing checkout.session.completed event');
    
    // Get the subscription details
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );
    console.log('Retrieved subscription:', subscription);

    // Get the price ID from the subscription
    const priceId = subscription.items.data[0].price.id;
    console.log('Price ID:', priceId);

    // Find the corresponding plan
    const plan = subscriptionPlans.find(p => p.stripePriceId === priceId);
    if (!plan) {
      console.error('No matching plan found for price ID:', priceId);
      return new NextResponse('No matching plan found', { status: 400 });
    }
    console.log('Found matching plan:', plan.id);

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
    console.log('Updated user_subscriptions table');

    // Update users table with new daily limit and subscription_plan
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: session.metadata.userId,
        daily_image_gens: typeof plan.features.imageGens === 'number' 
          ? plan.features.imageGens 
          : 999999, // For unlimited plans
        last_reset_date: new Date().toISOString(),
        subscription_plan: plan.id,
      });

    if (userError) {
      console.error('Error updating user limits:', userError);
      return new NextResponse('Error updating user limits', { status: 500 });
    }
    console.log('Updated users table');
  }

  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    console.log(`Processing ${event.type} event`);
    
    // Get the subscription details
    const subscription = event.data.object;
    console.log('Subscription data:', subscription);

    const priceId = subscription.items.data[0].price.id;
    console.log('Price ID:', priceId);

    // Find the corresponding plan
    const plan = subscriptionPlans.find(p => p.stripePriceId === priceId);
    if (!plan) {
      console.error('No matching plan found for price ID:', priceId);
      return new NextResponse('No matching plan found', { status: 400 });
    }
    console.log('Found matching plan:', plan.id);

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
    console.log('Updated user_subscriptions table');

    // If subscription is cancelled or past due, reset to free plan limits
    if (subscription.status === 'canceled' || subscription.status === 'past_due') {
      console.log('Subscription cancelled or past due, resetting to free plan');
      
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: subscription.metadata.userId,
          daily_image_gens: 5, // Free plan limit
          last_reset_date: new Date().toISOString(),
          subscription_plan: 'free',
        });

      if (userError) {
        console.error('Error resetting user limits:', userError);
        return new NextResponse('Error resetting user limits', { status: 500 });
      }
      console.log('Reset user to free plan');
    } else {
      // Update users table with new daily limit and subscription_plan
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: subscription.metadata.userId,
          daily_image_gens: typeof plan.features.imageGens === 'number' 
            ? plan.features.imageGens 
            : 999999, // For unlimited plans
          last_reset_date: new Date().toISOString(),
          subscription_plan: plan.id,
        });

      if (userError) {
        console.error('Error updating user limits:', userError);
        return new NextResponse('Error updating user limits', { status: 500 });
      }
      console.log('Updated user limits');
    }
  }

  console.log('Webhook processed successfully');
  return new NextResponse(null, { status: 200 });
} 