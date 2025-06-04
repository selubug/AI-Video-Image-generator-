import React, { useState } from 'react';
import { subscriptionPlans } from '../lib/subscription-plans';
import { SubscriptionPlans } from './SubscriptionPlans';

interface UpgradeButtonProps {
  currentPlan: string;
  onPlanChange: (planId: string) => void;
}

export const UpgradeButton: React.FC<UpgradeButtonProps> = ({
  currentPlan,
  onPlanChange,
}) => {
  const [showSubscriptionPlans, setShowSubscriptionPlans] = useState(false);

  const currentPlanName = subscriptionPlans.find(p => p.id === currentPlan)?.name || 'Free';

  return (
    <>
      <button
        onClick={() => setShowSubscriptionPlans(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors"
      >
        <span className="font-medium">{currentPlanName}</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showSubscriptionPlans && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Upgrade Your Plan</h2>
              <button
                onClick={() => setShowSubscriptionPlans(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <SubscriptionPlans
              currentPlan={currentPlan}
              onPlanChange={(newPlan: string) => {
                onPlanChange(newPlan);
                setShowSubscriptionPlans(false);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}; 