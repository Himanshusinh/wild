"use client";

interface Plan {
  code: string;
  name: string;
  credits: number;
  storageGB: number;
  priceINR: number;
  features: string[];
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    code: "FREE",
    name: "Free",
    credits: 2000,
    storageGB: 2,
    priceINR: 0,
    features: [
      "2,000 credits (one-time)",
      "2 GB storage",
      "Basic AI models",
      "Community support",
    ],
  },
  {
    code: "PLAN_A",
    name: "Hobbyist",
    credits: 12360,
    storageGB: 10,
    priceINR: 499,
    features: [
      "12,360 credits/month",
      "10 GB storage",
      "All AI models",
      "Priority support",
      "Early access to features",
    ],
  },
  {
    code: "PLAN_B",
    name: "Creator",
    credits: 24720,
    storageGB: 30,
    priceINR: 999,
    popular: true,
    features: [
      "24,720 credits/month",
      "30 GB storage",
      "All AI models",
      "Priority support",
      "Early access to features",
      "Remove watermark",
    ],
  },
  {
    code: "PLAN_C",
    name: "Professional",
    credits: 61800,
    storageGB: 50,
    priceINR: 2499,
    features: [
      "61,800 credits/month",
      "50 GB storage",
      "All AI models",
      "Dedicated support",
      "API access",
      "White-label option",
    ],
  },
  {
    code: "PLAN_D",
    name: "Collective",
    credits: 197760,
    storageGB: 150,
    priceINR: 4999,
    features: [
      "197,760 credits/month",
      "150 GB storage",
      "All AI models",
      "24/7 dedicated support",
      "API access",
      "White-label option",
      "Team collaboration",
    ],
  },
];

interface PlanCardsProps {
  currentPlanCode?: string;
  onSelectPlan: (planCode: string) => void;
}

export default function PlanCards({
  currentPlanCode,
  onSelectPlan,
}: PlanCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {PLANS.map((plan) => {
        const isCurrent = plan.code === currentPlanCode;
        const canUpgrade = !currentPlanCode || plan.priceINR > (PLANS.find(p => p.code === currentPlanCode)?.priceINR || 0);

        return (
          <div
            key={plan.code}
            className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-all hover:shadow-xl ${
              isCurrent ? "ring-2 ring-green-500" : ""
            } ${plan.popular ? "ring-2 ring-blue-500" : ""}`}
          >
            {/* Popular Badge */}
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  MOST POPULAR
                </span>
              </div>
            )}

            {/* Current Plan Badge */}
            {isCurrent && (
              <div className="absolute -top-3 right-4">
                <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  CURRENT PLAN
                </span>
              </div>
            )}

            {/* Plan Header */}
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-extrabold">
                  ₹{plan.priceINR}
                </span>
                {plan.priceINR > 0 && (
                  <span className="text-gray-500 dark:text-gray-400">
                    /month
                  </span>
                )}
              </div>
            </div>

            {/* Credits & Storage */}
            <div className="mb-6 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Credits
                </span>
                <span className="font-semibold">
                  {plan.credits.toLocaleString()}
                  {plan.priceINR > 0 && "/mo"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Storage
                </span>
                <span className="font-semibold">{plan.storageGB} GB</span>
              </div>
            </div>

            {/* Features List */}
            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            {/* CTA Button */}
            <button
              onClick={() => onSelectPlan(plan.code)}
              disabled={isCurrent}
              className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                isCurrent
                  ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                  : plan.popular
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
                  : "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
              }`}
            >
              {isCurrent
                ? "Current Plan"
                : canUpgrade
                ? plan.priceINR === 0
                  ? "Get Started"
                  : "Upgrade"
                : "Downgrade"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export { PLANS };
export type { Plan };
