export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: {
    imageGens: number | 'unlimited';
    videoGens?: number | 'unlimited';
    advancedPresets: boolean;
    priorityProcessing: boolean;
    earlyAccess: boolean;
    customTools: boolean;
  };
  stripePriceId: string;
}

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    features: {
      imageGens: 5,
      advancedPresets: false,
      priorityProcessing: false,
      earlyAccess: false,
      customTools: false,
    },
    stripePriceId: '', // No Stripe price ID for free tier
  },
  {
    id: 'starter',
    name: 'Starter Plan',
    price: 10,
    features: {
      imageGens: 300,
      advancedPresets: true,
      priorityProcessing: false,
      earlyAccess: false,
      customTools: false,
    },
    stripePriceId: 'price_1RG7LtPTbrpTcDlKVHq9QDtP',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 20,
    features: {
      imageGens: 1000,
      videoGens: 100,
      advancedPresets: true,
      priorityProcessing: true,
      earlyAccess: false,
      customTools: false,
    },
    stripePriceId: 'price_1RG7VFPTbrpTcDlKBwswH3D3',
  },
  {
    id: 'wizard',
    name: 'Wizard+',
    price: 50,
    features: {
      imageGens: 'unlimited',
      videoGens: 'unlimited',
      advancedPresets: true,
      priorityProcessing: true,
      earlyAccess: true,
      customTools: true,
    },
    stripePriceId: 'price_1RG7a2PTbrpTcDlKGMMvfUyU',
  },
]; 