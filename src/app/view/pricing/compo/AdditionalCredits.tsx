import React from 'react'
 const creditPackages = [
   {
     id: 1,
     title: "Explorer",
     price: "$0.7",
     credits: "1000",
     eligibility: "Eligible for Creators, Professional and Collective",
   },
   {
     id: 2,
     title: "Essential",
     price: "$1.3",
     credits: "2000",
     eligibility: "Eligible for Creators, Professional and Collective",
   },
   {
     id: 3,
     title: "Enthusiast",
     price: "$3",
    credits: "5000",
     eligibility: "Eligible for Professional and Collective",
     gradient: "from-green-500 to-green-700"
   },
   {
    id: 4,
    title: "Studio",
    price: "$5.5",
   credits: "10,000",
    eligibility: "Eligible for Professional and Collective",
    gradient: "from-green-500 to-green-700"
  },
  {
    id: 5,
    title: "Custom Credits",
    eligibility: "Eligible for Enterprise",
    gradient: "from-green-500 to-green-700"
  }
 ];

  function AdditionalCredits(){
  const mobileScrollRef = React.useRef<HTMLDivElement | null>(null) as any;
  const [mobileIndex, setMobileIndex] = React.useState(0);
  const scrollToIndex = (idx: number) => {
    const c = mobileScrollRef.current as HTMLDivElement | null;
    if (!c) return;
    const cards = Array.from(c.querySelectorAll('.credits-card')) as HTMLElement[];
    if (!cards.length) return;
    const clamped = Math.max(0, Math.min(idx, cards.length - 1));
    setMobileIndex(clamped);
    try { cards[clamped].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); } catch {}
  };
  const prev = () => scrollToIndex(mobileIndex - 1);
  const next = () => scrollToIndex(mobileIndex + 1);
  return(
    <div className="w-full">
      <div className="w-full">
        <div className="flex items-center justify-between mb-5 sm:mb-7 mt-5">
          <h1 className="text-white text-2xl sm:text-4xl font-semibold text-left">Additional Credits</h1>
          {/* Mobile arrows - aligned with Additional Credits heading */}
          <div className="flex items-center gap-2 sm:hidden">
            <button aria-label="Prev" onClick={prev} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border-2 border-white text-black text-2xl font-bold hover:bg-white/90 transition-colors">‹</button>
            <button aria-label="Next" onClick={next} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border-2 border-white text-black text-2xl font-bold hover:bg-white/90 transition-colors">›</button>
          </div>
        </div>
        
        {/* Mobile: horizontal scroll with 5% peek when centered | Desktop: grid */}
        <div className="sm:hidden">
          <div ref={mobileScrollRef} className="overflow-x-auto scrollbar-hide px-[5vw] snap-x snap-mandatory scroll-smooth">
          <div className="flex gap-4 min-w-max">
            {creditPackages.map((pkg) => (
              <div 
                key={pkg.id}
                className={`relative text-white rounded-lg
                bg-white/5 backdrop-blur-2xl backdrop-saturate-150 bg-clip-padding
                border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.35)] ring-1 ring-white/10
                p-4 py-5 w-[90vw] min-w-[90vw] max-w-[90vw] flex-shrink-0 overflow-hidden isolate flex flex-col
                snap-center credits-card`}
              >
              {/* Glass highlight */}
              <div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-b from-white/5 via-transparent to-transparent opacity-20" aria-hidden />
              <div className="pointer-events-none absolute inset-0 rounded-lg shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]" aria-hidden />

              <div className="relative z-10 min-h-[120px]">
                <div className="flex justify-between items-start mb-3 mx-3">
                  <h3 className="text-lg font-semibold">{pkg.title}</h3>
                  {pkg.credits && (
                    <div className="text-right">
                      <p className="text-xl font-bold leading-none">{pkg.credits}</p>
                      <p className="text-xs text-white/70 mt-1">Credits</p>
                    </div>
                  )}
                </div>

                <div className="mx-3">
                  <p className="text-xl font-bold mt-1">{pkg.price}</p>
                </div>

                <p className="text-sm text-white/70 mt-2 mx-3 leading-snug break-words">{pkg.eligibility}</p>
              </div>

              <div className="my-4 mx-3 mt-auto">
                <button className="mt-4 bg-[#1C303D] hover:bg-[#1c3c52] text-white rounded-full px-5 py-2.5 text-sm font-medium ring-1 ring-white/15 transition-colors w-full">
                  Purchase
                </button>
              </div>
            </div>
          ))}
          </div>
          </div>
        </div>
        
        {/* Desktop: responsive grid */}
        <div className="hidden sm:grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5">
          {creditPackages.map((pkg) => (
            <div 
              key={pkg.id}
              className={`relative text-white rounded-lg
              bg-white/5 backdrop-blur-2xl backdrop-saturate-150 bg-clip-padding
              border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.35)] ring-1 ring-white/10
              p-5 py-6 w-full overflow-hidden isolate flex flex-col`}
            >
              {/* Glass highlight */}
              <div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-b from-white/5 via-transparent to-transparent opacity-20" aria-hidden />
              <div className="pointer-events-none absolute inset-0 rounded-lg shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]" aria-hidden />

              <div className="relative z-10 min-h-[120px]">
                <div className="flex justify-between items-start mb-3 mx-4">
                  <h3 className="text-lg font-semibold">{pkg.title}</h3>
                  {pkg.credits && (
                    <div className="text-right">
                      <p className="text-xl font-bold leading-none">{pkg.credits}</p>
                      <p className="text-xs text-white/70 mt-1">Credits</p>
                    </div>
                  )}
                </div>

                <div className="mx-4">
                  <p className="text-xl font-bold mt-1">{pkg.price}</p>
                </div>

                <p className="text-xs text-white/70 mt-2 mx-3 leading-snug break-words">{pkg.eligibility}</p>
              </div>

              <div className="my-4 mx-3 mt-auto">
                <button className="mt-4 bg-[#1C303D] hover:bg-[#1c3c52] text-white rounded-full px-5 py-2 text-xs font-medium ring-1 ring-white/15 transition-colors w-full">
                  Purchase
                </button>
              </div>
            </div>
          ))}
          </div>
      </div>
    </div>
  )
};

export default AdditionalCredits;