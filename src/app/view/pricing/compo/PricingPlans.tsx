'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MAIN_PLANS, STARTER_MONTHLY_INR, YEARLY_PRIMARY_DISCOUNT } from './pricingConfig';
import { BillingPeriodToggle, type BillingPeriod } from './BillingPeriodToggle';
import { StarterCapsule } from './StarterCapsule';
import { MainPlanCard } from './MainPlanCard';

const scrollStyles =
  'overflow-x-auto pb-2 snap-x snap-mandatory [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/15';

interface PricingPlansProps {
  isAuthenticated: boolean;
}

export default function PricingPlans({ isAuthenticated }: PricingPlansProps) {
  const router = useRouter();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('yearly');

  const goSubscribe = () => {
    if (isAuthenticated) {
      router.push('/account/billing');
    } else {
      router.push('/view/signup');
    }
  };

  const yearlyPrimaryDiscountPercent = Math.round(YEARLY_PRIMARY_DISCOUNT * 100);
  const gutter = 'px-4 sm:px-6 md:pl-4 md:pr-6 lg:px-8';

  return (
    <div className={`relative z-10 w-full min-w-0 max-w-[1540px] mx-auto ${gutter} pb-24`}>
      <section className="min-w-0 pt-8 md:pt-12" aria-label="All plans">
        <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500 mb-5 md:mb-6">Plans</p>

        <div className="flex w-full min-w-0 justify-center px-2 mb-6 md:mb-7">
          <StarterCapsule priceINR={STARTER_MONTHLY_INR} onCta={goSubscribe} />
        </div>

        <div className="flex justify-center mb-6 md:mb-8">
          <BillingPeriodToggle
            value={billingPeriod}
            onChange={setBillingPeriod}
            yearlyPrimaryDiscountPercent={yearlyPrimaryDiscountPercent}
          />
        </div>

        <div className="xl:hidden space-y-6">
          <div className={`flex flex-nowrap gap-5 ${scrollStyles}`}>
            {MAIN_PLANS.map((plan) => (
              <div
                key={plan.id}
                className="snap-center shrink-0 w-[min(88vw,280px)] sm:w-[260px] flex min-h-[500px]"
              >
                <MainPlanCard plan={plan} billingPeriod={billingPeriod} onCta={goSubscribe} compact className="h-full w-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="hidden xl:grid min-w-0 grid-cols-4 gap-x-5 gap-y-4 items-stretch">
          {MAIN_PLANS.map((plan) => (
            <MainPlanCard key={plan.id} plan={plan} billingPeriod={billingPeriod} onCta={goSubscribe} className="h-full" />
          ))}
        </div>
      </section>

      <div className="mt-12 md:mt-16 flex flex-wrap justify-center gap-x-8 gap-y-3 text-xs text-slate-500 text-center">
        <span>Secure checkout</span>
        <span className="hidden sm:inline text-slate-700">·</span>
        <span>Cancel anytime</span>
        <span className="hidden sm:inline text-slate-700">·</span>
        <span>Razorpay</span>
        <span className="hidden sm:inline text-slate-700">·</span>
        <span>Invoices &amp; GST</span>
      </div>

      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={() => router.push('/account/billing')}
          className="text-sm font-medium text-[#60a5fa] hover:text-[#93c5fd] transition-colors underline-offset-4 hover:underline"
        >
          Open billing &amp; plans
        </button>
      </div>
    </div>
  );
}
