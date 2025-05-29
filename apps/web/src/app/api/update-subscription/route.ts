import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { userId, subscriptionId, priceId } = await request.json();

    // Update user's subscription in Supabase
    const { error } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        subscription_id: subscriptionId,
        plan_id: priceId,
        status: 'active',
        updated_at: new Date().toISOString(),
      });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Error updating subscription' },
      { status: 500 }
    );
  }
} 