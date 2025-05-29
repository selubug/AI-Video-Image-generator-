import React, { useState } from 'react';
import { subscriptionPlans, SubscriptionPlan } from '../lib/subscription-plans';
import { formatPrice } from '../lib/stripe';
import { PaymentModal } from './PaymentModal';

interface SubscriptionPlansProps {
  currentPlan: string;
  onPlanChange: (planId: string) => void;
}

export const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({
  currentPlan,
  onPlanChange,
}) => {
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    if (plan.id === 'free') {
      onPlanChange(plan.id);
      return;
    }
    setSelectedPlan(plan);
    setShowPayment(true);
  };

  const handlePaymentSuccess = () => {
    if (selectedPlan) {
      onPlanChange(selectedPlan.id);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {subscriptionPlans.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-lg p-6 ${
              currentPlan === plan.id
                ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white'
                : 'bg-white border border-gray-200'
            }`}
          >
            {currentPlan === plan.id && (
              <div className="absolute top-0 right-0 bg-yellow-400 text-purple-900 px-3 py-1 rounded-bl-lg text-sm font-semibold">
                Current Plan
              </div>
            )}
            
            <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
            <div className="text-3xl font-bold mb-4">
              {plan.price === 0 ? 'Free' : formatPrice(plan.price * 100)}
              <span className="text-sm font-normal">/month</span>
            </div>
            
            <ul className="space-y-3 mb-6">
              <li className="flex items-center">
                {plan.features.imageGens === 'unlimited' ? (
                  <span>🔓 Unlimited image generations</span>
                ) : (
                  <span>🔓 {plan.features.imageGens} image generations/month</span>
                )}
              </li>
              {plan.features.videoGens && (
                <li className="flex items-center">
                  {plan.features.videoGens === 'unlimited' ? (
                    <span>🎥 Unlimited video generations</span>
                  ) : (
                    <span>🎥 {plan.features.videoGens} video generations</span>
                  )}
                </li>
              )}
              {plan.features.advancedPresets && (
                <li className="flex items-center">✨ Advanced presets</li>
              )}
              {plan.features.priorityProcessing && (
                <li className="flex items-center">⚡ Priority processing</li>
              )}
              {plan.features.earlyAccess && (
                <li className="flex items-center">🚀 Early feature access</li>
              )}
              {plan.features.customTools && (
                <li className="flex items-center">🔧 Custom styles & tools</li>
              )}
            </ul>

            <button
              onClick={() => handlePlanSelect(plan)}
              className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                currentPlan === plan.id
                  ? 'bg-white text-purple-600 hover:bg-purple-50'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {currentPlan === plan.id ? 'Current Plan' : 'Select Plan'}
            </button>
          </div>
        ))}
      </div>

      {selectedPlan && (
        <PaymentModal
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          amount={selectedPlan.price * 100}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}; 