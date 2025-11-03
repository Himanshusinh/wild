import React from 'react'
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
  const mobileScrollRef = React.useRef<HTMLDivElement | null>(null) as any
  const [mobileIndex, setMobileIndex] = React.useState(0)
  const scrollToIndex = (nextIdx: number) => {
    const container = mobileScrollRef.current as HTMLDivElement | null
    if (!container) return
    const cards = Array.from(container.querySelectorAll('.plan-card')) as HTMLElement[]
    if (!cards.length) return
    const clamped = Math.max(0, Math.min(nextIdx, cards.length - 1))
    setMobileIndex(clamped)
    try { cards[clamped].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }) } catch {}
  }
  const goPrev = () => scrollToIndex(mobileIndex - 1)
  const goNext = () => scrollToIndex(mobileIndex + 1)
  return (  
    <div className="py-2 w-full">
      <div className="w-full">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h1 className="text-white text-2xl sm:text-4xl font-semibold text-left">Plans</h1>
          {/* Mobile arrows - aligned with Plans heading */}
          <div className="flex items-center gap-2 sm:hidden">
            <button aria-label="Prev" onClick={goPrev} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border-2 border-white text-black text-2xl font-bold hover:bg-white/90 transition-colors">
              ‹
            </button>
            <button aria-label="Next" onClick={goNext} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border-2 border-white text-black text-2xl font-bold hover:bg-white/90 transition-colors">
              ›
            </button>
          </div>
        </div>
        {(() => {
          const nonEnterprise = plans.filter((p) => p.name !== 'Enterprise');
          const enterprise = plans.find((p) => p.name === 'Enterprise');

          return (
            <>
              {/* Mobile: horizontal scroll with 5% peek when centered | Desktop: grid */}
              <div className="sm:hidden">
                <div ref={mobileScrollRef} className="overflow-x-auto scrollbar-hide px-[5vw] snap-x snap-mandatory scroll-smooth">
                <div className="flex gap-4 min-w-max">
                  {nonEnterprise.map((plan) => (
                    <div 
                      key={plan.name} 
                      className={`relative text-white rounded-lg
                      bg-white/5 backdrop-blur-2xl backdrop-saturate-150 bg-clip-padding
                      border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.35)]
                      ring-1 ring-white/10
                      p-4 py-5
                      w-[90vw] min-w-[90vw] max-w-[90vw] flex-shrink-0 overflow-hidden isolate flex flex-col
                      transition-all duration-300 snap-center plan-card`}
                    >
                    {/* Glass highlight and edge lighting */}
                    <div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-b from-white/5 via-transparent to-transparent opacity-20" aria-hidden />
                    <div className="pointer-events-none absolute inset-0 rounded-lg shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]" aria-hidden />
                    <div className={`min-h-[120px]`}>
                      <h2 className={`text-2xl font-medium leading-tight mx-3 mt-2 mb-1`}>{plan.name}</h2>
                      <div className={`mx-3 ${typeof plan.monthlyPrice !== 'undefined' ? 'min-h-[70px]' : 'min-h-0'}`}>
                        {typeof plan.monthlyPrice !== 'undefined' && (
                          <div>
                            <div className={`flex items-baseline gap-1.5 mt-3`}>
                              <div className={`text-2xl font-bold tracking-tight`}>
                                {typeof plan.monthlyPrice === 'string' ? plan.monthlyPrice : 
                                  `$${isAnnual && typeof plan.annualPrice !== 'undefined' ? plan.annualPrice : plan.monthlyPrice}`}
                              </div>
                              <div className={`text-sm text-white/80`}>
                                / month
                              </div>
                            </div>
                            {isAnnual && typeof plan.monthlyPrice === 'number' && typeof plan.annualPrice === 'number' && (
                              <span className={`block text-[#ADD8E6] text-xs mt-1`}>
                                Save ${(plan.monthlyPrice - plan.annualPrice).toFixed(2)}/month
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {plan.subtitle && (
                        <p className={`text-sm text-white/70 mx-3 leading-snug break-words text-center mt-2`}>{plan.subtitle}</p>
                      )}
                    </div>

                    <div className={`mt-4 mb-3 mx-3`}>
                      <button className={`bg-[#1C303D] hover:bg-[#1c3c52] text-white rounded-full px-5 py-2.5 text-sm font-medium ring-1 ring-white/15 transition-colors w-full`}>
                        {plan.buttonText}
                      </button>
                    </div>

                    <ul className={`mt-2.5 space-y-2 mx-3 text-white/90`}>
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className={`mt-1.5 h-1.5 w-1.5 rounded-full bg-white/70 flex-shrink-0`} />
                          <span className={`text-sm leading-snug break-words`}>{f}</span>
                        </li>
                      ))}
                    </ul>
                    </div>
                  ))}
                </div>
                </div>
              </div>
              
              {/* Desktop: responsive grid */}
              <div className="hidden sm:grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {nonEnterprise.map((plan) => (
                  <div 
                    key={plan.name} 
                    className={`relative text-white rounded-lg
                    bg-white/5 backdrop-blur-2xl backdrop-saturate-150 bg-clip-padding
                    border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.35)]
                    ring-1 ring-white/10
                    p-5 py-6
                    w-full overflow-hidden isolate flex flex-col
                    transition-all duration-300 hover:bg-white/10 hover:backdrop-saturate-200 hover:shadow-[0_12px_40px_rgba(0,0,0,0.45)] hover:border-white/15`}
                  >
                    {/* Glass highlight and edge lighting */}
                    <div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-b from-white/5 via-transparent to-transparent opacity-20" aria-hidden />
                    <div className="pointer-events-none absolute inset-0 rounded-lg shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]" aria-hidden />
                    <div className={`min-h-[120px]`}>
                      <h2 className={`text-2xl sm:text-3xl font-medium leading-tight mx-4 mt-3 mb-1`}>{plan.name}</h2>
                      <div className={`mx-4 ${typeof plan.monthlyPrice !== 'undefined' ? 'min-h-[70px]' : 'min-h-0'}`}>
                        {typeof plan.monthlyPrice !== 'undefined' && (
                          <div>
                            <div className={`flex items-baseline gap-2 mt-4`}>
                              <div className={`text-xl sm:text-2xl md:text-3xl font-bold tracking-tight`}>
                                {typeof plan.monthlyPrice === 'string' ? plan.monthlyPrice : 
                                  `$${isAnnual && typeof plan.annualPrice !== 'undefined' ? plan.annualPrice : plan.monthlyPrice}`}
                              </div>
                              <div className={`text-xs sm:text-sm md:text-base text-white/80`}>
                                / month
                              </div>
                            </div>
                            {isAnnual && typeof plan.monthlyPrice === 'number' && typeof plan.annualPrice === 'number' && (
                              <span className={`block text-[#ADD8E6] text-[11px] sm:text-xs mt-1`}>
                                Save ${(plan.monthlyPrice - plan.annualPrice).toFixed(2)}/month
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {plan.subtitle && (
                        <p className={`text-xs sm:text-sm text-white/70 mx-3 leading-snug break-words text-center`}>{plan.subtitle}</p>
                      )}
                    </div>

                    <div className={`mt-4 mb-3 mx-3`}>
                      <button className={`bg-[#1C303D] hover:bg-[#1c3c52] text-white rounded-full px-4 sm:px-5 py-2 text-sm font-medium ring-1 ring-white/15 transition-colors w-full`}>
                        {plan.buttonText}
                      </button>
                    </div>

                    <ul className={`mt-2.5 space-y-1.5 sm:space-y-2 mx-3 text-white/90`}>
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className={`mt-1.5 h-1.5 w-1.5 rounded-full bg-white/70 flex-shrink-0`} />
                          <span className={`text-xs sm:text-sm leading-snug break-words`}>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Enterprise row: single, full-width card */}
              {enterprise && (
                <div className="mt-3">
                  <div 
                    className={`relative text-white rounded-lg
                    bg-white/5 backdrop-blur-2xl backdrop-saturate-150 bg-clip-padding
                    border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.35)]
                    ring-1 ring-white/10
                    px-4 pt-6 pb-6 w-full overflow-hidden isolate flex flex-col
                    transition-all duration-300 hover:bg-white/10 hover:backdrop-saturate-200 hover:shadow-[0_12px_40px_rgba(0,0,0,0.45)] hover:border-white/15`}
                  >
                    {/* Glass highlight and edge lighting */}
                    <div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-b from-white/5 via-transparent to-transparent opacity-20" aria-hidden />
                    <div className="pointer-events-none absolute inset-0 rounded-lg shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]" aria-hidden />
                    <div className={`min-h-[60px] ml-2`}>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mx-3 mt-2 mb-0.5">
                        <h3 className={`text-2xl sm:text-3xl font-medium leading-tight`}>{enterprise.name}</h3>
                        <button className={`bg-[#1C303D] hover:bg-[#1c3c52] text-white rounded-full px-5 sm:px-6 py-2.5 text-sm font-medium ring-1 ring-white/15 transition-colors sm:min-w-[180px]`}>
                          {enterprise.buttonText}
                        </button>
                      </div>
                      <div className={`mx-4 min-h-0`}>
                        {/* Enterprise has no fixed price */}
                      </div>
                      {enterprise.subtitle && (
                        <p className={`text-xs sm:text-sm text-white/70 mt-2 mx-3 leading-snug break-words`}>{enterprise.subtitle}</p>
                      )}
                    </div>

                    <div className={`mt-4 mx-3 text-white/90 grid grid-cols-1 sm:grid-cols-2 gap-x-6 pb-4`}>
                      {[enterprise.features.slice(0, 3), enterprise.features.slice(3, 6)].map((col, colIdx) => (
                        <ul key={colIdx} className={`space-y-2`}>
                          {col.map((f, i) => (
                            <li key={`${colIdx}-${i}`} className="flex items-start gap-3">
                              <span className={`mt-4 h-1.5 w-1.5 rounded-full bg-white/70 flex-shrink-0`} />
                              <span className={`text-xs sm:text-sm mt-2.5 leading-snug break-words`}>{f}</span>
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
