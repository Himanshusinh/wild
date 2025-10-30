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
  return (  
    <div className="py-2 w-full">
      <div className="w-full">
        <h1 className="text-white text-4xl font-semibold text-left mb-6">Plans</h1>
        {(() => {
          const nonEnterprise = plans.filter((p) => p.name !== 'Enterprise');
          const enterprise = plans.find((p) => p.name === 'Enterprise');

          return (
            <>
              {/* Single row: all non-enterprise plans */}
              <div className="grid gap-4 grid-cols-5">
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
                      <h2 className={`text-3xl font-medium leading-tight mx-4 mt-3 mb-1`}>{plan.name}</h2>
                      <div className={`mx-4 ${typeof plan.monthlyPrice !== 'undefined' ? 'min-h-[70px]' : 'min-h-0'}`}>
                        {typeof plan.monthlyPrice !== 'undefined' && (
                          <div>
                            <div className={`flex items-baseline gap-2 mt-4`}>
                              <div className={`text-2xl md:text-3xl font-bold tracking-tight`}>
                                {typeof plan.monthlyPrice === 'string' ? plan.monthlyPrice : 
                                  `$${isAnnual && typeof plan.annualPrice !== 'undefined' ? plan.annualPrice : plan.monthlyPrice}`}
                              </div>
                              <div className={`text-sm md:text-base text-white/80`}>
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
                        <p className={`text-sm text-white/70 mx-3 leading-snug break-words text-center`}>{plan.subtitle}</p>
                      )}
                    </div>

                    <div className={`mt-4 mb-3 mx-3`}>
                      <button className={`bg-[#1C303D] hover:bg-[#1c3c52] text-white rounded-full px-5 py-2 text-sm font-medium ring-1 ring-white/15 transition-colors w-full`}>
                        {plan.buttonText}
                      </button>
                    </div>

                    <ul className={`mt-2.5 space-y-2 mx-3 text-white/90`}>
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className={`mt-1.5 h-1.5 w-1.5 rounded-full bg-white/70 flex-shrink-0`} />
                          <span className={`text-sm leading-snug break-words`}>{f}</span>
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
                      <div className="flex items-center justify-between gap-3 mx-3 mt-2 mb-0.5">
                        <h3 className={`text-3xl font-medium leading-tight`}>{enterprise.name}</h3>
                        <button className={`bg-[#1C303D] hover:bg-[#1c3c52] text-white rounded-full px-6 py-2.5 text-sm font-medium ring-1 ring-white/15 transition-colors min-w-[180px]`}>
                          {enterprise.buttonText}
                        </button>
                      </div>
                      <div className={`mx-4 min-h-0`}>
                        {/* Enterprise has no fixed price */}
                      </div>
                      {enterprise.subtitle && (
                        <p className={`text-sm text-white/70 mt-2 mx-3 leading-snug break-words`}>{enterprise.subtitle}</p>
                      )}
                    </div>

                    <div className={`mt-4 mx-3 text-white/90 grid grid-cols-1 sm:grid-cols-2 gap-x-6 pb-4`}>
                      {[enterprise.features.slice(0, 3), enterprise.features.slice(3, 6)].map((col, colIdx) => (
                        <ul key={colIdx} className={`space-y-2`}>
                          {col.map((f, i) => (
                            <li key={`${colIdx}-${i}`} className="flex items-start gap-3">
                              <span className={`mt-4 h-1.5 w-1.5 rounded-full bg-white/70 flex-shrink-0`} />
                              <span className={`text-sm mt-2.5 leading-snug break-words`}>{f}</span>
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
