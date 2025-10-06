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
    features: ["4120 Credits", "Generate up to 110 images", "Generate up to 13 Videos", "500 MB Library Storage"],
    buttonText: "Activate",
    glow: "from-slate-400 via-slate-600 to-slate-900", // Elegant slate gray
  },
  {
    name: "Hobbyist",
    monthlyPrice: 8.55,
    annualPrice: 6.84,
    subtitle: "Best for casual users, students and hobby creators",
    features: ["12,360 Credits", "Generate up to 330 images", "Generate up to 40 Videos", "10 GB Library Storage"],
    buttonText: "Activate",
    glow: "from-cyan-400 via-blue-600 to-slate-900", // Cool cyan to blue
  },
  {
    name: "Creator",
    monthlyPrice: 17.55,
    annualPrice: 14.04,
    subtitle: "Best for creative professionals and small student teams",
    features: ["24,720 Credits", "Generate up to 670 images", "Generate up to 78 Videos", "30 GB Library Storage"],
    buttonText: "Activate",
    glow: "from-violet-400 via-purple-600 to-slate-900", // Rich violet to purple
  },
  {
    name: "Professional",
    monthlyPrice: 40.55,
    annualPrice: 32.44,
    subtitle: "Best for advanced creators and businesses",
    features: ["61,800 Credits", "Generate up to 1670 images", "Generate up to 193 Videos", "50 GB Library Storage"],
    buttonText: "Activate",
    glow: "from-emerald-400 via-teal-600 to-slate-900", // Professional emerald to teal
  },
  {
    name: "Collective",
    monthlyPrice: 128.55,
    annualPrice: 102.84,
    subtitle: "Best for agencies and creative collectives",
    features: ["1,97,760 Credits", "Generate Unlimited images", "Generate up to 620 Videos", "150 GB Library Storage"],
    buttonText: "Activate",
    glow: "from-indigo-400 via-blue-600 to-slate-900", // Deep indigo to blue
  },
  {
    name: "Enterprise",
    subtitle: "Tailored for large organizations and enterprises",
    features: ["10,000 + 200 Credits", "Generate up to 510 images", "Generate up to 25 Videos", "10 GB Library Storage"],
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
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5">
          {plans.map((plan) => (
            <div 
              key={plan.name} 
              className={`relative text-white rounded-[2rem]
              bg-white/5 backdrop-blur-2xl backdrop-saturate-150 bg-clip-padding
              border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.35)]
              ring-1 ring-white/10
              ${plan.name === 'Enterprise' ? 'lg:col-span-5 xl:col-span-5 p-4 py-5 mx-auto max-w-4xl' : 'p-5 py-6 h-[420px] md:h-[460px]'}
              w-full overflow-hidden isolate flex flex-col
              transition-all duration-300 hover:bg-white/10 hover:backdrop-saturate-200 hover:shadow-[0_12px_40px_rgba(0,0,0,0.45)] hover:border-white/15`}
            >
              {/* Glass highlight and edge lighting */}
              <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-b from-white/5 via-transparent to-transparent opacity-20" aria-hidden />
              <div className="pointer-events-none absolute inset-0 rounded-[2rem] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]" aria-hidden />
              <div className={`${plan.name === 'Enterprise' ? 'min-h-[60px]' : 'min-h-[120px]'}`}>
                <h3 className={`text-lg font-semibold mx-4 ${plan.name === 'Enterprise' ? 'mt-2 mb-0.5' : 'mt-3 mb-1'}`}>{plan.name}</h3>
                <div className={`mx-4 ${typeof plan.monthlyPrice !== 'undefined' ? 'min-h-[70px]' : 'min-h-0'}`}>
                {typeof plan.monthlyPrice !== 'undefined' && (
                  <div>
                    <div className={`text-xl font-bold tracking-tight`}>
                      {typeof plan.monthlyPrice === 'string' ? plan.monthlyPrice : 
                       `$${isAnnual && typeof plan.annualPrice !== 'undefined' ? plan.annualPrice : plan.monthlyPrice}`}
                    </div>
                    <div className={`text-xs text-white/80 mt-0`}>
                      {isAnnual ? '/ Year' : '/ Month'}
                      {isAnnual && typeof plan.monthlyPrice === 'number' && typeof plan.annualPrice === 'number' && (
                        <span className={`block text-green-400 text-[10px] mt-1`}>
                          Save ${((plan.monthlyPrice - plan.annualPrice) * 12).toFixed(2)}/year
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {plan.subtitle && (
                <p className={`text-xs text-white/70 ${plan.name === 'Enterprise' ? 'mt-1' : 'mt-2'} mx-3 leading-snug break-words`}>{plan.subtitle}</p>
              )}
              </div>

              <div className={`my-4 mx-3 mt-auto` }>
                <button className={`mt-2 bg-[#1C303D] hover:bg-[#1c3c52] text-white rounded-full ${plan.name === 'Enterprise' ? 'px-4 py-1.5 text-[11px] max-w-[180px] mx-auto' : 'px-5 py-2 text-xs'} font-medium ring-1 ring-white/15 transition-colors w-full`}>
                  {plan.buttonText}
                </button>
              </div>

              <ul className={`mt-2.5 space-y-2 mx-3 text-white/90`}>
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className={`mt-1.5 h-1.5 w-1.5 rounded-full bg-white/70 flex-shrink-0`} />
                    <span className={`text-xs leading-snug break-words`}>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
};

export default Plans;
