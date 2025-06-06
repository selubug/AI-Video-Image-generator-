import { NextResponse } from 'next/server';
import { createSubscription } from '@/lib/stripe-server';
import { supabase } from '@/utils/supabase';
import Stripe from 'stripe';
import type { Stripe as StripeType } from 'stripe';

export async function POST(request: Request) {
  try {
    const { priceId, userId } = await request.json();

    // Get user's email from Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, stripe_customer_id')
      .eq('id', userId)
      .single();

    if (userError) {
      throw new Error('User not found');
    }

    let customerId = user.stripe_customer_id;

    // If user doesn't have a Stripe customer ID, create one
    if (!customerId) {
      const { data: customer, error: customerError } = await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)
        .select()
        .single();

      if (customerError) {
        throw new Error('Error creating Stripe customer');
      }

      customerId = customer.stripe_customer_id;
    }

    // Create the subscription
    const subscription = await createSubscription(customerId, priceId);

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: (subscription.latest_invoice as StripeType.Invoice & { payment_intent?: { client_secret: string } })?.payment_intent?.client_secret,
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Error creating subscription' },
      { status: 500 }
    );
  }
} 