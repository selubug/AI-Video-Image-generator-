import { supabase } from './supabase';
import { subscriptionPlans } from './subscription-plans';

// Helper function to validate userId
function isValidUserId(userId: string | undefined | null): userId is string {
  return Boolean(userId && typeof userId === 'string' && userId.trim() !== '');
}

async function getUserSubscriptionPlan(userId: string | undefined | null) {
  // Guard clause for userId
  if (!isValidUserId(userId)) {
    console.warn("getUserSubscriptionPlan called without a valid userId");
    return 'free';
  }

  try {
    // Get user's subscription from user_subscriptions table
    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    console.log('Subscription query result:', { subscription, error });

    if (error) {
      console.error('Error fetching subscription:', error);
      return 'free';
    }

    if (!subscription) {
      return 'free';
    }

    // Only consider active subscriptions
    if (subscription.status !== 'active') {
      return 'free';
    }

    // Find the plan that matches the price_id
    const plan = subscriptionPlans.find(p => p.stripePriceId === subscription.plan_id);
    return plan ? plan.id : 'free';
  } catch (error) {
    console.error('Error in getUserSubscriptionPlan:', error);
    return 'free';
  }
}

export async function checkAndResetDailyLimit(userId: string | undefined | null): Promise<number> {
  // Guard clause for userId
  if (!isValidUserId(userId)) {
    console.warn("checkAndResetDailyLimit called without a valid userId");
    return 5; // Return default free tier limit
  }

  try {
    // Get user's subscription plan
    const planId = await getUserSubscriptionPlan(userId);
    const plan = subscriptionPlans.find(p => p.id === planId);

    // If user has unlimited generations, return a high number
    if (plan && typeof plan.features.imageGens === 'string' && plan.features.imageGens === 'unlimited') {
      return 999999;
    }

    // Get user's current daily limit and last reset date
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    console.log('User query result:', { user, error });

    if (error) {
      console.error('Error fetching user data:', error);
      return 5; // Return default free tier limit on error
    }

    // If no user record exists, create one with default values
    if (!user) {
      const defaultLimit = plan ? (typeof plan.features.imageGens === 'number' ? plan.features.imageGens : 5) : 5;
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          daily_image_gens: defaultLimit,
          last_reset_date: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error creating user record:', insertError);
        return 5; // Return default free tier limit on error
      }

      return defaultLimit;
    }

    const today = new Date();
    const lastReset = user.last_reset_date ? new Date(user.last_reset_date) : new Date(0);
    
    // Get the daily limit based on the subscription plan
    const dailyLimit = plan ? (typeof plan.features.imageGens === 'number' ? plan.features.imageGens : 5) : 5;

    // Check if it's a new day
    if (
      !user.last_reset_date ||
      today.getDate() !== lastReset.getDate() ||
      today.getMonth() !== lastReset.getMonth() ||
      today.getFullYear() !== lastReset.getFullYear()
    ) {
      // Reset the daily limit to the plan's limit
      const { error: updateError } = await supabase
        .from('users')
        .update({
          daily_image_gens: dailyLimit,
          last_reset_date: today.toISOString(),
        })
        .eq('id', userId);
      
      if (updateError) {
        console.error('Error resetting daily limit:', updateError);
        return user.daily_image_gens || 5; // Return current limit or default on error
      }
      
      return dailyLimit;
    }

    return user.daily_image_gens || dailyLimit;
  } catch (error) {
    console.error('Error in checkAndResetDailyLimit:', error);
    return 5; // Return default free tier limit on error
  }
}

export async function decrementDailyLimit(userId: string | undefined | null): Promise<number> {
  // Guard clause for userId
  if (!isValidUserId(userId)) {
    console.warn("decrementDailyLimit called without a valid userId");
    return 0;
  }

  try {
    // Get user's subscription plan
    const planId = await getUserSubscriptionPlan(userId);
    const plan = subscriptionPlans.find(p => p.id === planId);

    // If user has unlimited generations, return a high number
    if (plan && typeof plan.features.imageGens === 'string' && plan.features.imageGens === 'unlimited') {
      return 999999;
    }

    // Get current daily limit
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    console.log('User query result in decrement:', { user, error });

    if (error) {
      console.error('Error fetching user data:', error);
      return 0;
    }

    if (!user) {
      console.error('No user record found');
      return 0;
    }

    const currentGens = user.daily_image_gens || 5;
    const remainingGens = Math.max(0, currentGens - 1);
    
    // Update the daily limit
    const { error: updateError } = await supabase
      .from('users')
      .update({
        daily_image_gens: remainingGens,
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating daily limit:', updateError);
      return currentGens; // Return current limit on error
    }

    return remainingGens;
  } catch (error) {
    console.error('Error in decrementDailyLimit:', error);
    return 0;
  }
} 