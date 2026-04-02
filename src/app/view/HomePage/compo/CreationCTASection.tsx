"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { NAV_ROUTES } from "@/routes/routes";

type PlanCard = {
  name: string;
  icon: "star" | "lock";
  muted?: boolean;
  highlighted?: boolean;
  badge?: string;
};

const planCards: PlanCard[] = [
  { name: "Free", icon: "star", muted: true },
  { name: "Pro", icon: "star", highlighted: true, badge: "Popular" },
  { name: "Enterprise", icon: "lock", muted: true },
];

function PlanIcon({ icon, highlighted }: { icon: "star" | "lock"; highlighted?: boolean }) {
  if (icon === "lock") {
    return (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="3" y="8" width="14" height="10" rx="2" stroke="rgba(255,255,255,0.5)" strokeWidth="1.4" />
        <path d="M7 8V6a3 3 0 0 1 6 0v2" stroke="rgba(255,255,255,0.5)" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }

  return highlighted ? (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 2l2 6h6l-5 3.5 2 6L10 14l-5 3.5 2-6L2 8h6z"
        fill="rgba(59,130,246,0.3)"
        stroke="#3B82F6"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 2l2 6h6l-5 3.5 2 6L10 14l-5 3.5 2-6L2 8h6z"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrustBadge({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-white/35">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function ArrowBetween() {
  return (
    <div className="hidden items-center px-1 lg:flex" aria-hidden="true">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M4 10h12M12 6l4 4-4 4"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default function CreationCTASection() {
  return (
    <section className="bg-[#0E0E12] px-4 pb-4 sm:px-6 md:px-0">
      <div className="relative overflow-hidden  bg-[#0E0E12]">
        {/* <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(59,130,246,0.08)_0%,transparent_52%,rgba(99,102,241,0.05)_100%)]" />
        <div className="pointer-events-none absolute left-[20%] top-[-80px] h-[300px] w-[400px] bg-[radial-gradient(ellipse,rgba(59,130,246,0.18)_0%,transparent_65%)]" />
        <div className="pointer-events-none absolute bottom-[-60px] right-[15%] h-[250px] w-[300px] bg-[radial-gradient(ellipse,rgba(99,102,241,0.15)_0%,transparent_65%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:28px_28px]" /> */}

        <div className="relative flex flex-col xl:flex-row xl:items-center">
          <div className="flex-1 px-4 py-2 sm:px-8 sm:py-10 lg:px-10 xl:py-12">
            <div className="mb-0 inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-[#3B82F6]">
              <span className="inline-block h-[1.5px] w-[18px] bg-[#3B82F6]" />
              Pricing
            </div>

            <h2
              className="mb-4 text-[40px] uppercase leading-[0.95] tracking-[0.01em] text-[#F0EFE9] sm:text-[52px]"
              style={{ fontFamily: "var(--font-bebas-neue), 'Bebas Neue', sans-serif" }}
            >
              Start free.
              <br />
              <span style={{ color: "#3B82F6" }}>
                Scale as you grow.
              </span>
            </h2>

            <p className="mb-6 max-w-[360px] text-[13.5px] leading-[1.7] text-white/45">
              Simple plans for every creator - pricing details dropping soon.
            </p>

            {/* <div className="flex flex-wrap items-center gap-4">
              <TrustBadge
                label="No credit card"
                icon={
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="M8 1l1.6 3.3 3.6.5-2.6 2.5.6 3.6L8 9.3 4.8 11l.6-3.6L2.8 4.8l3.6-.5L8 1z"
                      stroke="#3B82F6"
                      strokeWidth="1.3"
                      strokeLinejoin="round"
                    />
                  </svg>
                }
              />
              <span className="h-[3px] w-[3px] rounded-full bg-white/20" />
              <TrustBadge
                label="Cancel anytime"
                icon={
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="M3 8.5l3.5 3.5 6.5-7"
                      stroke="#3B82F6"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                }
              />
              <span className="h-[3px] w-[3px] rounded-full bg-white/20" />
              <TrustBadge
                label="Always free tier"
                icon={
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <circle cx="8" cy="8" r="6" stroke="#3B82F6" strokeWidth="1.3" />
                    <path d="M8 5v3l2 2" stroke="#3B82F6" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                }
              />
            </div> */}
          </div>

          <div className="px-4 py-0 sm:px-8 sm:py-8 lg:px-12 xl:border-b-0 xl:py-12">
            <div className="no-scrollbar -mx-1 flex snap-x snap-mandatory items-stretch gap-2 overflow-x-auto px-1 pb-2 lg:justify-center lg:overflow-visible">
              {planCards.map((plan, index) => (
                <div key={plan.name} className="flex snap-start items-stretch">
                  {index > 0 ? <ArrowBetween /> : null}

                  <div
                    className={`relative flex w-[108px] flex-col items-center gap-2.5 rounded-2xl px-3 py-4 transition-all duration-200 sm:w-[124px] sm:px-4 sm:py-5 lg:w-[130px] ${
                      plan.highlighted
                        ? "border border-[#3B82F6]/35 bg-[#3B82F6]/10 shadow-[0_0_30px_rgba(59,130,246,0.12)] hover:shadow-[0_0_40px_rgba(59,130,246,0.22)]"
                        : "border border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                    }`}
                  >
                    {plan.badge ? (
                      <div className="absolute left-1/2 top-[-11px] -translate-x-1/2 rounded-full bg-[#3B82F6] px-3 py-[3px] text-[8px] font-bold uppercase tracking-[0.1em] text-white shadow-[0_2px_8px_rgba(59,130,246,0.4)]">
                        {plan.badge}
                      </div>
                    ) : null}

                    <div
                      className={`flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border ${
                        plan.highlighted
                          ? "border-[#3B82F6]/40 bg-[#3B82F6]/20"
                          : "border-white/10 bg-white/[0.06]"
                      }`}
                    >
                      <PlanIcon icon={plan.icon} highlighted={plan.highlighted} />
                    </div>

                    <div
                      className={`text-[10px] font-bold uppercase tracking-[0.12em] ${
                        plan.highlighted ? "text-[#3B82F6]" : "text-white/40"
                      }`}
                    >
                      {plan.name}
                    </div>

                    <div
                      className={`rounded-lg border px-2 py-[5px] text-[10px] font-semibold tracking-[0.04em] ${
                        plan.highlighted
                          ? "border-[#3B82F6]/25 bg-[#3B82F6]/12 text-[#3B82F6]"
                          : "border-white/10 bg-white/[0.06] text-white/30"
                      }`}
                    >
                      Coming Soon
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="min-w-0 px-4 py-8 sm:px-8 lg:px-12 xl:min-w-[220px] xl:py-12">
            <div className="mb-4">
              <div className="mb-1 text-[13px] font-semibold text-white/65">Get early access</div>
              <div className="text-[11px] text-white/35">Be first to know when pricing goes live.</div>
            </div>

            <button
              type="button"
              className="mb-3 w-full rounded-xl bg-[#3B82F6] px-6 py-3 text-[14px] font-bold text-white shadow-[0_6px_20px_rgba(59,130,246,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(59,130,246,0.5)]"
            >
              Get Notified
            </button>

            <Link
              href={NAV_ROUTES.PRICING}
              className="block w-full rounded-xl border border-white/10 px-6 py-[11px] text-center text-[13px] font-medium text-white/45 transition-all duration-200 hover:border-white/25 hover:text-white"
            >
              Learn More -&gt;
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
