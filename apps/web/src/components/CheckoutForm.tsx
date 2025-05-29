import React, { useState, useEffect } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { toast } from 'react-hot-toast';

interface CheckoutFormProps {
  onSuccess: (subscriptionId: string) => void;
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({ onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !isMounted) {
      return;
    }

    setIsLoading(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin,
        },
        redirect: 'if_required',
      });

      if (error) {
        // Handle hCaptcha errors specifically
        if (error.type === 'validation_error' && error.code === 'captcha_error') {
          if (retryCount < 3) {
            setRetryCount(prev => prev + 1);
            toast.error('Please complete the security check and try again');
            return;
          } else {
            toast.error('Unable to complete security check. Please try again later.');
            return;
          }
        }
        toast.error(error.message || 'Payment failed');
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        // Get the subscription ID from the payment intent metadata
        const subscriptionId = paymentIntent.metadata?.subscription_id;
        if (subscriptionId) {
          onSuccess(subscriptionId);
        } else {
          toast.error('Subscription ID not found');
        }
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      // Handle hCaptcha CORS errors
      if (error instanceof Error && error.message.includes('hcaptcha')) {
        if (retryCount < 3) {
          setRetryCount(prev => prev + 1);
          toast.error('Security check failed. Please try again.');
          return;
        } else {
          toast.error('Unable to complete security check. Please try again later.');
          return;
        }
      }
      toast.error('Failed to process payment');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="min-h-[200px]">
        <PaymentElement 
          options={{
            layout: 'tabs',
            defaultValues: {
              billingDetails: {
                address: {
                  country: 'US',
                },
              },
            },
          }}
        />
      </div>
      <button
        type="submit"
        disabled={!stripe || isLoading}
        className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
      >
        {isLoading ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
}; 