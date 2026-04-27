'use client';

import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { buildMainPlanConfig, STARTER_MONTHLY_INR, YEARLY_PRIMARY_DISCOUNT, type MainPlanConfig, type MainPlanId } from './pricingConfig';
import { BillingPeriodToggle, type BillingPeriod } from './BillingPeriodToggle';
import { StarterCapsule } from './StarterCapsule';
import { MainPlanCard } from './MainPlanCard';
import { CurrencySwitcher } from './CurrencySwitcher';
import { MainPlanCardSkeleton, StarterCapsuleSkeleton } from './PricingSkeletons';
import {
  fetchSubscriptionCatalog,
  peekCachedSubscriptionCatalog,
  type SubscriptionCatalog,
} from '@/lib/subscriptionCatalog';
import { getApiClient, isUserAuthenticated } from '@/lib/axiosInstance';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';

const scrollStyles =
  'overflow-x-auto pb-2 snap-x snap-mandatory [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/15';

interface PricingPlansProps {
  isAuthenticated: boolean;
}

export default function PricingPlans({ isAuthenticated }: PricingPlansProps) {
  const router = useRouter();
  const { displayCurrency, formatMoney, fxLoading, hasFxRates } = useDisplayCurrency();
  const needsForeignFx = displayCurrency !== 'INR';
  const isPriceFxPending = needsForeignFx && (!hasFxRates || fxLoading);
  const foreignCardProps =
    displayCurrency !== 'INR' && !isPriceFxPending
      ? { displayCurrency, formatDisplayMoney: formatMoney }
      : {};
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('yearly');
  const [catalog, setCatalog] = useState<SubscriptionCatalog | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [currentPlanCode, setCurrentPlanCode] = useState<string | null>(null);

  useLayoutEffect(() => {
    const c = peekCachedSubscriptionCatalog();
    if (c) {
      setCatalog(c);
      setCatalogLoading(false);
    }
  }, []);

  const currentMainPlanId: MainPlanId | null = useMemo(() => {
    const code = String(currentPlanCode || '').toUpperCase();
    if (!code) return null;
    if (code.includes('SPARK')) return 'spark';
    if (code.includes('CREATOR')) return 'creator';
    if (code.includes('STUDIO')) return 'studio';
    if (code.includes('AGENCY')) return 'agency';
    return null;
  }, [currentPlanCode]);

  const goSubscribe = () => {
    if (isAuthenticated || isUserAuthenticated()) {
      router.push('/account/billing');
    } else {
      router.push('/view/signup');
    }
  };

  const yearlyPrimaryDiscountPercent = useMemo(() => {
    const plans = catalog?.plans || [];
    const planWithYearly = plans.find(
      (plan) => plan.monthly && plan.yearly && plan.monthly.priceInPaise > 0,
    );
    if (!planWithYearly?.monthly || !planWithYearly.yearly) {
      return Math.round(YEARLY_PRIMARY_DISCOUNT * 100);
    }
    const grossAnnual = planWithYearly.monthly.priceInPaise * 12;
    if (grossAnnual <= 0) {
      return Math.round(YEARLY_PRIMARY_DISCOUNT * 100);
    }
    return Math.round((1 - planWithYearly.yearly.priceInPaise / grossAnnual) * 100);
  }, [catalog]);
  const gutter = 'px-4 sm:px-6 md:pl-4 md:pr-6 lg:px-8';
  const checkoutGstRatePercent =
    catalog?.plans.find((plan) => plan.monthly?.gstRatePercent != null)?.monthly
      ?.gstRatePercent ?? 18;
  const mainPlans = useMemo(
    () =>
      (catalog?.plans || [])
        .map((plan) => {
          if (!plan.monthly) return null;
          const family = String(plan.family || '').toLowerCase();
          // Only process IDs that we actually have UI config for (spark, creator, studio, agency)
          if (!['spark', 'creator', 'studio', 'agency'].includes(family)) return null;

          return buildMainPlanConfig({
            id: family as MainPlanId,
            name: plan.name,
            monthlyINR: plan.monthly.priceInPaise / 100,
            yearlyINR: plan.yearly ? plan.yearly.priceInPaise / 100 : null,
            monthlyCredits: plan.monthly.credits,
          });
        })
        .filter((plan): plan is MainPlanConfig => plan !== null),
    [catalog],
  );

  useEffect(() => {
    let cancelled = false;
    fetchSubscriptionCatalog()
      .then((data) => {
        if (!cancelled) setCatalog(data);
      })
      .catch((error) => {
        console.error('Failed to fetch subscription catalog for pricing page', error);
      })
      .finally(() => {
        if (!cancelled) setCatalogLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!(isAuthenticated || isUserAuthenticated())) return;
    const api = getApiClient();
    api
      .get('/api/credits/me')
      .then((res) => {
        const payload = res?.data?.data || res?.data;
        const code = payload?.planCode;
        if (typeof code === 'string' && code.trim()) {
          setCurrentPlanCode(code.trim());
        }
      })
      .catch(() => {});
  }, [isAuthenticated]);

  const showCatalogSkeleton = catalogLoading && !catalog;

  return (
    <div className={`relative z-10 w-full min-w-0 max-w-[1540px] mx-auto ${gutter} pb-24`}>
      <section
        className="min-w-0 pt-8 md:pt-12"
        aria-label="All plans"
        aria-busy={showCatalogSkeleton || isPriceFxPending}
      >
        <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500 mb-5 md:mb-6">Plans</p>

        <div className="flex w-full min-w-0 justify-center px-2 mb-6 md:mb-7">
          {showCatalogSkeleton ? (
            <StarterCapsuleSkeleton />
          ) : (
            <StarterCapsule
              priceINR={STARTER_MONTHLY_INR}
              onCta={goSubscribe}
              isPriceLoading={isPriceFxPending}
              {...foreignCardProps}
            />
          )}
        </div>

        <div className="flex justify-center mb-6 md:mb-8">
          <BillingPeriodToggle
            value={billingPeriod}
            onChange={setBillingPeriod}
            yearlyPrimaryDiscountPercent={yearlyPrimaryDiscountPercent}
          />
        </div>
        {isAuthenticated ? (
          <div className="flex justify-center mb-4">
            <CurrencySwitcher />
          </div>
        ) : null}
        <p className="mb-6 text-center text-xs text-slate-500 max-w-lg mx-auto">
          Displayed prices are base plan prices. +{checkoutGstRatePercent}% GST at checkout.
          {displayCurrency !== 'INR' && !isPriceFxPending
            ? ' Converted amounts are approximate; you are charged in INR.'
            : ''}
        </p>

        {showCatalogSkeleton ? (
          <>
            <div className="xl:hidden space-y-6">
              <div className={`flex flex-nowrap gap-5 ${scrollStyles}`}>
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="snap-center shrink-0 w-[min(88vw,280px)] sm:w-[260px] flex min-h-[500px]"
                  >
                    <MainPlanCardSkeleton compact className="h-full w-full" />
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden xl:grid min-w-0 grid-cols-4 gap-x-5 gap-y-4 items-stretch">
              {[0, 1, 2, 3].map((i) => (
                <MainPlanCardSkeleton key={i} className="h-full" />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="xl:hidden space-y-6">
              <div className={`flex flex-nowrap gap-5 ${scrollStyles}`}>
                {mainPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="snap-center shrink-0 w-[min(88vw,280px)] sm:w-[260px] flex min-h-[500px]"
                  >
                    <MainPlanCard
                      plan={plan}
                      billingPeriod={billingPeriod}
                      onCta={goSubscribe}
                      isCurrent={currentMainPlanId === plan.id}
                      gstRatePercent={checkoutGstRatePercent}
                      compact
                      className="h-full w-full"
                      isPriceLoading={isPriceFxPending}
                      {...foreignCardProps}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden xl:grid min-w-0 grid-cols-4 gap-x-5 gap-y-4 items-stretch">
              {mainPlans.map((plan) => (
                <MainPlanCard
                  key={plan.id}
                  plan={plan}
                  billingPeriod={billingPeriod}
                  onCta={goSubscribe}
                  isCurrent={currentMainPlanId === plan.id}
                  gstRatePercent={checkoutGstRatePercent}
                  className="h-full"
                  isPriceLoading={isPriceFxPending}
                  {...foreignCardProps}
                />
              ))}
            </div>
          </>
        )}
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
          onClick={goSubscribe}
          className="text-sm font-medium text-[#60a5fa] hover:text-[#93c5fd] transition-colors underline-offset-4 hover:underline"
        >
          Open billing &amp; plans
        </button>
      </div>

      <div className="mt-10 md:mt-12 flex justify-center">
        <div className="max-w-xl w-full rounded-2xl border border-white/10 bg-white/5 p-5 md:p-6 text-center">
          <div className="text-sm font-semibold text-white">Enterprise</div>
          <div className="mt-1 text-xs text-slate-400">
            Need custom credits, storage, or invoicing? Talk to us.
          </div>
          <div className="mt-4 flex justify-center">
            <a
              href="/company/contact-us"
              className="inline-flex items-center justify-center rounded-lg bg-white text-black px-4 py-2 text-sm font-medium hover:bg-slate-100 transition-colors"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
