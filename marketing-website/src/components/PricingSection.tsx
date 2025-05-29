import React from 'react';
import { FaCheck } from 'react-icons/fa';

type PricingTier = {
  name: string;
  price: number;
  description: string;
  features: string[];
  highlighted?: boolean;
};

const pricingTiers: PricingTier[] = [
  {
    name: 'Starter',
    price: 49,
    description: 'Perfect for small churches just getting started',
    features: [
      'Up to 100 members',
      'Basic member management',
      'Event scheduling',
      'Email support',
      'Basic reporting',
    ],
  },
  {
    name: 'Growth',
    price: 99,
    description: 'Ideal for growing churches with more needs',
    features: [
      'Up to 500 members',
      'Advanced member management',
      'Volunteer scheduling',
      'Giving tracking',
      'Priority support',
      'Advanced reporting',
      'Custom branding',
    ],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 199,
    description: 'For large churches with complex requirements',
    features: [
      'Unlimited members',
      'Multi-campus support',
      'API access',
      'Custom integrations',
      '24/7 support',
      'Advanced analytics',
      'White-label solution',
      'Dedicated account manager',
    ],
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Choose the plan that's right for your church
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl shadow-lg overflow-hidden ${
                tier.highlighted
                  ? 'ring-2 ring-blue-600 transform scale-105'
                  : 'bg-white'
              }`}
            >
              {tier.highlighted && (
                <div className="absolute top-0 right-0 -mt-4 -mr-4 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
              )}
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900">{tier.name}</h3>
                <p className="mt-4 text-gray-600">{tier.description}</p>
                <p className="mt-8">
                  <span className="text-4xl font-extrabold text-gray-900">
                    ${tier.price}
                  </span>
                  <span className="text-base font-medium text-gray-500">
                    /month
                  </span>
                </p>
                <ul className="mt-8 space-y-4">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <div className="flex-shrink-0">
                        <FaCheck
                          className="h-5 w-5 text-green-500"
                          aria-hidden="true"
                        />
                      </div>
                      <p className="ml-3 text-base text-gray-700">{feature}</p>
                    </li>
                  ))}
                </ul>
                <button
                  className={`mt-8 w-full py-3 px-4 rounded-lg font-semibold ${
                    tier.highlighted
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  } transition-colors`}
                >
                  Get Started
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-600">
            Need a custom solution?{' '}
            <a href="#contact" className="text-blue-600 hover:text-blue-700">
              Contact us
            </a>{' '}
            for a tailored plan.
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection; 