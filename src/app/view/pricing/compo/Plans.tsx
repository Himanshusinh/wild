'use client';

import React from 'react';

interface Plan {
  name: string;
  subtitle?: string;
  features: string[];
  buttonText: string;
  monthlyPrice?: number | string;
  annualPrice?: number;
  glow: string; // gradient color class
}

const plans: Plan[] = [
  {
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    subtitle: "Best for beginners exploring our platform",
    features: ["4120 Credits", "Generate up to 82 images (model-dependent)", "Generate up to 18 Videos (model-dependent)"],
    buttonText: "Activate",
    glow: "from-slate-400 via-slate-600 to-slate-900", // Elegant slate gray
  },
  {
    name: "Hobbyist",
    monthlyPrice: 8.55,
    annualPrice: 6.84,
    subtitle: "Best for casual users, students and hobby creators",
    features: ["12,360 Credits", "Generate up to 247 images (model-dependent)", "Generate up to 56 Videos (model-dependent)", "10 GB Library Storage"],
    buttonText: "Activate",
    glow: "from-cyan-400 via-blue-600 to-slate-900", // Cool cyan to blue
  },
  {
    name: "Creator",
    monthlyPrice: 17.55,
    annualPrice: 14.04,
    subtitle: "Best for creative professionals and small student teams",
    features: ["24,720 Credits", "Generate up to 494 images (model-dependent)", "Generate up to 112 Videos (model-dependent)", "30 GB Library Storage"],
    buttonText: "Activate",
    glow: "from-violet-400 via-purple-600 to-slate-900", // Rich violet to purple
  },
  {
    name: "Professional",
    monthlyPrice: 40.55,
    annualPrice: 32.44,
    subtitle: "Best for advanced creators and businesses",
    features: ["61,800 Credits", "Generate up to 1236 images (model-dependent)", "Generate up to 280 Videos (model-dependent)", "50 GB Library Storage"],
    buttonText: "Activate",
    glow: "from-emerald-400 via-teal-600 to-slate-900", // Professional emerald to teal
  },
  {
    name: "Collective",
    monthlyPrice: 128.55,
    annualPrice: 102.84,
    subtitle: "Best for agencies and creative collectives",
    features: ["1,97,760 Credits", "Generate Unlimited images (model-dependent)", "Generate up to 900 Videos (model-dependent)", "150 GB Library Storage"],
    buttonText: "Activate",
    glow: "from-indigo-400 via-blue-600 to-slate-900", // Deep indigo to blue
  },
  {
    name: "Enterprise",
    subtitle: "Tailored for Large Organizations and Enterprises",
    features: [
      "Unlimited Scaling – No caps on generation volumes; ",
      "Custom Credit Purchase @ USD 0.0005/credit ",
      "Dedicated Onboarding & Team Training – Smooth setup, platform training sessions for your team, and tailored resource access.",
      "Priority Support with SLAs – Fast, guaranteed response times and resolution windows.",
      "Dedicated Account Manager – Single point of contact for personalized support, queries, and optimization guidance.",
      "Custom Workflows & Feature Requests – Work with us to develop features and workflow customizations aligned with your use cases."
    ],
    buttonText: "Contact Sales",
    glow: "from-amber-400 via-orange-600 to-slate-900", // Premium amber to orange
  }
];

interface PlansProps {
  isAnnual: boolean;
}

function Plans({ isAnnual }: PlansProps) {
  const [currentPlanIndex, setCurrentPlanIndex] = React.useState(0);
  const plansScrollRef = React.useRef<HTMLDivElement>(null);
  const nonEnterprise = plans.filter((p) => p.name !== 'Enterprise');

  React.useEffect(() => {
    const handleScroll = () => {
      if (!plansScrollRef.current) return;
      const scrollLeft = plansScrollRef.current.scrollLeft;
      // On mobile, each card is 85vw + gap (1rem = 16px)
      const cardWidth = window.innerWidth * 0.85 + 16; // 85vw + gap
      const newIndex = Math.round(scrollLeft / cardWidth);
      setCurrentPlanIndex(Math.min(newIndex, nonEnterprise.length - 1));
    };

    const scrollContainer = plansScrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const scrollToPlan = (index: number) => {
    if (!plansScrollRef.current) return;
    // On mobile, each card is 85vw + gap
    const cardWidth = window.innerWidth * 0.85 + 16; // 85vw + gap
    plansScrollRef.current.scrollTo({
      left: index * cardWidth,
      behavior: 'smooth'
    });
  };

  return (  
    <div className="py-2 w-full">
      <div className="w-full">
        <h1 className="text-white md:text-3xl text-2xl font-semibold text-left md:mb-4 mb-0">Plans</h1>
        {(() => {
          const enterprise = plans.find((p) => p.name === 'Enterprise');

          return (
            <>
              {/* Desktop: grid, Mobile: horizontal scroll */}
              <div className="relative">
                <div 
                  ref={plansScrollRef}
                  className="md:grid md:grid-cols-5 md:gap-4 flex overflow-x-auto md:overflow-visible md:gap-4 gap-2 snap-x snap-mandatory scrollbar-hide"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                {nonEnterprise.map((plan) => (
                  <div 
                    key={plan.name}
                    className={`relative text-white rounded-lg
                    bg-white/5 backdrop-blur-2xl backdrop-saturate-150 bg-clip-padding
                    border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.35)]
                    ring-1 ring-white/10
                    md:p-2 p-0 py-3
                    md:w-full w-[70vw] flex-shrink-0 snap-center overflow-hidden isolate flex flex-col
                    transition-all duration-300 hover:bg-white/10 hover:backdrop-saturate-200 hover:shadow-[0_12px_40px_rgba(0,0,0,0.45)] hover:border-white/15`}
                  >
                    {/* Glass highlight and edge lighting */}
                    <div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-b from-white/5 via-transparent to-transparent opacity-20" aria-hidden />
                    <div className="pointer-events-none absolute inset-0 rounded-lg shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]" aria-hidden />
                    <div className={`md:min-h-[120px] min-h-[80px]`}>
                      <h2 className={`md:text-3xl text-xl font-medium leading-tight md:mx-4 mx-2 mt-0 mb-0`}>{plan.name}</h2>
                      <div className={`mx-4 ${typeof plan.monthlyPrice !== 'undefined' ? 'min-h-[20px]' : 'min-h-0'}`}>
                        {typeof plan.monthlyPrice !== 'undefined' && (
                          <div>
                            <div className={`flex items-baseline md:gap-2 gap-1 md:mt-4 mt-2`}>
                              <div className={`text-xl md:text-2xl font-bold tracking-tight`}>
                                {typeof plan.monthlyPrice === 'string' ? plan.monthlyPrice : 
                                  `$${isAnnual && typeof plan.annualPrice !== 'undefined' ? plan.annualPrice : plan.monthlyPrice}`}
                              </div>
                              <div className={`text-xs md:text-sm text-white/80`}>
                                / month
                              </div>
                            </div>
                            {isAnnual && typeof plan.monthlyPrice === 'number' && typeof plan.annualPrice === 'number' && (
                              <span className={`block text-[#ADD8E6] md:text-xs text-[8px] mt-0`}>
                                Save ${(plan.monthlyPrice - plan.annualPrice).toFixed(2)}/month
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {plan.subtitle && (
                        <p className={`md:text-xs text-[10px] text-white/90 leading-snug break-words pl-4`}>{plan.subtitle}</p>
                      )}
                    </div>

                    <div className={`mt-1 md:mb-3 mb-2 md:mx-3 mx-2`}>
                      <button className={`bg-[#1C303D] hover:bg-[#1c3c52] text-white rounded-lg md:px-5 px-2 md:py-2 py-1 md:text-medium text-sm font-medium ring-1 ring-white/15 transition-colors w-full`}>
                        {plan.buttonText}
                      </button>
                    </div>

                    <ul className={`mt-1 md:space-y-1 space-y-0.5 md:mx-3 mx-2 text-white/90`}>
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className={`mt-1.5 h-1.5 w-1.5 rounded-lg bg-white/80 flex-shrink-0`} />
                          <span className={`md:text-sm text-[10px] font-thin leading-snug break-words`}>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                </div>
                {/* Navigation dots for mobile */}
                <div className="md:hidden flex justify-center gap-2 mt-4">
                  {nonEnterprise.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => scrollToPlan(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        currentPlanIndex === index ? 'bg-white w-6' : 'bg-white/40'
                      }`}
                      aria-label={`Go to plan ${index + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Enterprise row: single, full-width card */}
              {enterprise && (
                <div className="mt-3">
                  <div 
                    className={`relative text-white rounded-lg
                    bg-white/5 backdrop-blur-2xl backdrop-saturate-150 bg-clip-padding
                    border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.35)]
                    ring-1 ring-white/10
                    md:px-4 px-2 md:pt-6 pt-3 md:pb-6 pb-2 w-full overflow-hidden isolate flex flex-col
                    transition-all duration-300 hover:bg-white/10 hover:backdrop-saturate-200 hover:shadow-[0_12px_40px_rgba(0,0,0,0.45)] hover:border-white/15`}
                  >
                    {/* Glass highlight and edge lighting */}
                    <div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-b from-white/5 via-transparent to-transparent opacity-20" aria-hidden />
                    <div className="pointer-events-none absolute inset-0 rounded-lg shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]" aria-hidden />
                    <div className={`md:min-h-[40px] min-h-[20px] md:ml-2 ml-1 mt-0`}>
                      <div className="flex items-center justify-between md:gap-3 gap-2 md:mx-3 mx-2 mt-0 mb-0">
                        <h3 className={`md:text-3xl text-xl font-medium leading-tight`}>{enterprise.name}</h3>
                        <button className={`bg-[#1C303D] hover:bg-[#1c3c52] text-white rounded-lg md:px-6 px-4 md:py-2.5 py-1.5 md:text-sm text-xs font-medium ring-1 ring-white/15 transition-colors min-w-[180px]`}>
                          {enterprise.buttonText}
                        </button>
                      </div>
                      <div className={`md:mx-4 mx-2 min-h-0 mt-0`}>
                        {/* Enterprise has no fixed price */}
                      </div>
                      {enterprise.subtitle && (
                        <p className={`md:text-xs text-[10px] text-white/90 mt-2 md:mx-3 mx-2 leading-snug break-words`}>{enterprise.subtitle}</p>
                      )}
                    </div>

                    <div className={`mt-1 md:mx-3 mx-2 text-white/90 grid grid-cols-1 sm:grid-cols-2 md:gap-x-6 gap-x-2 pb-4`}>
                      {[enterprise.features.slice(0, 3), enterprise.features.slice(3, 6)].map((col, colIdx) => (
                        <ul key={colIdx} className={`space-y-2`}>
                          {col.map((f, i) => (
                            <li key={`${colIdx}-${i}`} className="flex items-start gap-3">
                              <span className={`mt-2 h-1.5 w-1.5 rounded-lg bg-white/80 flex-shrink-0`} />
                              <span className={`md:text-xs text-[10px] font-thin mt-1 leading-snug break-words`}>{f}</span>
                            </li>
                          ))}
                        </ul>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          );
        })()}
      </div>
    </div>
  )
};

export default Plans;
