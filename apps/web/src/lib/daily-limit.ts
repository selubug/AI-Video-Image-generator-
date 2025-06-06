import { supabase } from '@/utils/supabase';
import { subscriptionPlans } from './subscription-plans';

// Add model credit costs at the top of the file
export const MODEL_CREDIT_COSTS: Record<string, number> = {
  // Image models
  'dall-e-3': 4,
  'stable-diffusion-xl': 10,
  'gpt4o': 4,
  'ideogram': 6,
  'recraft': 5,
  'flux': 0.05,
  'imagen-4': 10,
  'midjourney': 5,
  'hidream': 5,
  // Video models
  'veo2': 500,
  'kling': 15,
  'heygen': 1,
  'hunyuan': 60,
  'pika': 70,
  'minimax': 50,
  'stability': 40,
  'luma': 40,
  'runway': 50
};

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

export async function checkAndResetDailyLimit(userId: string | undefined | null, createIfMissing: boolean = false): Promise<number> {
  // Guard clause for userId
  if (!isValidUserId(userId)) {
    console.warn("checkAndResetDailyLimit called without a valid userId");
    return 5; // Return default free tier limit
  }

  try {
    // First, get user's current data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('credits, last_reset_date')
      .eq('id', userId)
      .maybeSingle();

    console.log('User query result:', { user, error: userError });

    if (userError) {
      console.error('Error fetching user data:', userError);
      return 5; // Return default free tier limit on error
    }

    // Then get user's subscription plan
    const planId = await getUserSubscriptionPlan(userId);
    const plan = subscriptionPlans.find(p => p.id === planId);

    // If user has unlimited generations, return a high number
    if (plan && typeof plan.features.imageGens === 'string' && plan.features.imageGens === 'unlimited') {
      return 999999;
    }

    // Get the daily limit based on the subscription plan
    const dailyLimit = plan ? (typeof plan.features.imageGens === 'number' ? plan.features.imageGens : 999999) : 5;

    // If no user record exists, only create if createIfMissing is true
    if (!user && createIfMissing) {
      console.log('Creating or updating user record with limit:', dailyLimit);
      
      const { error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: userId,
          credits: dailyLimit,
          last_reset_date: new Date().toISOString()
        });

      if (upsertError) {
        // Improved error logging for debugging
        console.error('Error upserting user record:', JSON.stringify(upsertError, null, 2));
        if (upsertError.message) {
          alert('User upsert failed: ' + upsertError.message);
        } else {
          alert('User upsert failed: ' + JSON.stringify(upsertError));
        }
        return dailyLimit; // Return plan's limit even if upsert fails
      }

      return dailyLimit;
    } else if (!user) {
      // If user does not exist and we are not creating, return default limit
      return dailyLimit;
    }

    const today = new Date();
    const lastReset = user.last_reset_date ? new Date(user.last_reset_date) : new Date(0);

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
          credits: dailyLimit,
          last_reset_date: today.toISOString(),
        })
        .eq('id', userId);
      
      if (updateError) {
        console.error('Error resetting daily limit:', updateError);
        return user.credits || dailyLimit; // Return current limit or plan's limit on error
      }
      
      return dailyLimit;
    }

    // Return the user's current credits, or the plan's limit if current credits are not set
    return user.credits || dailyLimit;
  } catch (error) {
    console.error('Error in checkAndResetDailyLimit:', error);
    return 5; // Return default free tier limit on error
  }
}

export async function decrementDailyLimit(userId: string | undefined | null, model: string): Promise<number> {
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

    // Get current credits
    const { data: user, error } = await supabase
      .from('users')
      .select('credits')
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

    // Get the credit cost for the model
    const creditCost = MODEL_CREDIT_COSTS[model] || 1;
    console.log(`Credit cost for model ${model}: ${creditCost}`);

    const currentCredits = user.credits || 5;
    const remainingCredits = Math.max(0, currentCredits - creditCost);
    
    // Update the credits
    const { error: updateError } = await supabase
      .from('users')
      .update({
        credits: remainingCredits,
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating credits:', updateError);
      return currentCredits; // Return current credits on error
    }

    console.log(`Credits updated: ${currentCredits} -> ${remainingCredits} (cost: ${creditCost})`);
    return remainingCredits;
  } catch (error) {
    console.error('Error in decrementDailyLimit:', error);
    return 0;
  }
} 