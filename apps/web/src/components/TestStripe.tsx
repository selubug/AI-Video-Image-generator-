import React, { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '../lib/stripe';
import { CheckoutForm } from './CheckoutForm';
import { supabase } from '@/utils/supabase';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { subscriptionPlans } from '@/lib/subscription-plans';

interface TestStripeProps {
  userId: string;
  planId: string; // 'starter', 'pro', or 'wizard'
}

export const TestStripe: React.FC<TestStripeProps> = ({ userId, planId }) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleTestSubscription = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Find the selected plan
      const plan = subscriptionPlans.find(p => p.id === planId);
      if (!plan) {
        throw new Error('Invalid plan selected');
      }

      // Create a payment intent
      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan.stripePriceId,
          userId: userId,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.clientSecret) {
        throw new Error('No client secret received');
      }

      // Set the client secret for the payment form
      setClientSecret(data.clientSecret);
    } catch (error) {
      console.error('Error creating subscription:', error);
      setError(error instanceof Error ? error.message : 'Failed to create subscription');
      toast.error('Failed to create subscription');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscriptionSuccess = async (subscriptionId: string) => {
    try {
      console.log('Subscription successful, updating database...');
      
      // Find the selected plan
      const plan = subscriptionPlans.find(p => p.id === planId);
      if (!plan) {
        throw new Error('Invalid plan selected');
      }

      console.log('Updating subscription status...');
      // Update subscription status first
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: userId,
          subscription_id: subscriptionId,
          plan_id: plan.stripePriceId,
          status: 'active',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (subscriptionError) {
        console.error('Error updating subscription:', subscriptionError);
        toast.error('Failed to update subscription status');
        return;
      }

      console.log('Subscription updated:', subscriptionData);

      console.log('Updating user limits...');
      // Then update user's daily limits
      const { data: userData, error: updateError } = await supabase
        .from('users')
        .upsert({
          id: userId,
          daily_image_gens: typeof plan.features.imageGens === 'number' 
            ? plan.features.imageGens 
            : 999999, // For unlimited plans
          daily_video_gens: typeof plan.features.videoGens === 'number'
            ? plan.features.videoGens
            : 999999, // For unlimited plans
          last_reset_date: new Date().toISOString(),
        }, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (updateError) {
        console.error('Error updating user limits:', updateError);
        toast.error('Failed to update user limits');
        return;
      }

      console.log('User limits updated:', userData);

      // Verify the updates
      const { data: finalUserData, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError || !finalUserData) {
        console.error('Error verifying updates:', fetchError);
        toast.error('Failed to verify updates');
        return;
      }

      console.log('Final user data:', finalUserData);

      toast.success('Subscription created and limits updated successfully!');
      
      // Force a hard refresh of the page
      window.location.reload();
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast.error('Failed to update subscription');
    }
  };

  return (
    <div className="p-4">
      {error && (
        <div className="text-red-500 mb-4">{error}</div>
      )}
      
      {!clientSecret ? (
        <button
          onClick={handleTestSubscription}
          disabled={isLoading}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : `Subscribe to ${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`}
        </button>
      ) : (
        <div className="mt-4">
          {clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm onSuccess={handleSubscriptionSuccess} />
            </Elements>
          )}
        </div>
      )}
    </div>
  );
}; 