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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {plans.map((plan) => (
            <div 
              key={plan.name} 
              className={`relative text-white rounded-[2rem] 
              bg-gradient-to-br ${plan.glow} 
              backdrop-blur-md 
              shadow-[0_0_25px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.1)_inset] 
              p-8 py-10 w-full overflow-hidden isolate`}
            >
              <h3 className="text-2xl font-semibold m-4 mb-2">{plan.name}</h3>
              <div className="mx-4 min-h-[100px]">
                {typeof plan.monthlyPrice !== 'undefined' && (
                  <div>
                    <div className="text-3xl font-bold tracking-tight">
                      {typeof plan.monthlyPrice === 'string' ? plan.monthlyPrice : 
                       `$${isAnnual && typeof plan.annualPrice !== 'undefined' ? plan.annualPrice : plan.monthlyPrice}`}
                    </div>
                    <div className="text-sm text-white/80 mt-0">
                      {isAnnual ? '/ Year' : '/ Month'}
                      {isAnnual && typeof plan.monthlyPrice === 'number' && typeof plan.annualPrice === 'number' && (
                        <span className="block text-green-400 text-xs mt-1">
                          Save ${((plan.monthlyPrice - plan.annualPrice) * 12).toFixed(2)}/year
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {plan.subtitle && (
                <p className="text-base text-white/70 mt-4 mx-4 leading-relaxed">{plan.subtitle}</p>
              )}

              <div className="my-6 mx-4">
                <button className="w-full bg-[#1C303D] hover:bg-[#1c3c52] text-white rounded-full px-8 py-3 text-base font-medium">{plan.buttonText}</button>
              </div>

              <ul className="mt-4 space-y-3 text-white/90 mx-4">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-2 h-2 w-2 rounded-full bg-white/70 flex-shrink-0" />
                    <span className="text-base leading-relaxed">{f}</span>
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
