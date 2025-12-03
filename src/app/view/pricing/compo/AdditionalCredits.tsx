'use client';

import React from 'react';

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
    const [currentCreditIndex, setCurrentCreditIndex] = React.useState(0);
    const creditsScrollRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      const handleScroll = () => {
        if (!creditsScrollRef.current) return;
        const scrollLeft = creditsScrollRef.current.scrollLeft;
        // On mobile, each card is 85vw + gap (1rem = 16px)
        const cardWidth = window.innerWidth * 0.85 + 16; // 85vw + gap
        const newIndex = Math.round(scrollLeft / cardWidth);
        setCurrentCreditIndex(Math.min(newIndex, creditPackages.length - 1));
      };

      const scrollContainer = creditsScrollRef.current;
      if (scrollContainer) {
        scrollContainer.addEventListener('scroll', handleScroll);
        return () => scrollContainer.removeEventListener('scroll', handleScroll);
      }
    }, []);

    const scrollToCredit = (index: number) => {
      if (!creditsScrollRef.current) return;
      // On mobile, each card is 85vw + gap
      const cardWidth = window.innerWidth * 0.85 + 16; // 85vw + gap
      creditsScrollRef.current.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth'
      });
    };

  return(
    <div className="w-full">
      <div className="w-full">
        <h1 className="text-white md:text-4xl text-2xl font-semibold text-left md:mb-7 mb-0 md:mt-5 mt-0">Additional Credits</h1>
        
        {/* Desktop: grid, Mobile: horizontal scroll */}
        <div className="relative">
          <div 
            ref={creditsScrollRef}
            className="md:grid md:grid-cols-1 md:sm:grid-cols-2 md:grid-cols-3 md:lg:grid-cols-5 md:xl:grid-cols-5 md:gap-3 md:sm:gap-4 flex overflow-x-auto md:overflow-visible md:gap-4 gap-2 snap-x snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
          {creditPackages.map((pkg, index) => (
            <div 
              key={pkg.id}
              className={`relative text-white rounded-lg
              bg-white/5 backdrop-blur-2xl backdrop-saturate-150 bg-clip-padding
              border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.35)] ring-1 ring-white/10
              md:p-5 p-0 py-2 md:w-full w-[70vw] flex-shrink-0 snap-center overflow-hidden isolate flex flex-col`}
            >
              {/* Glass highlight */}
              <div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-b from-white/5 via-transparent to-transparent opacity-20" aria-hidden />
              <div className="pointer-events-none absolute inset-0 rounded-lg shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]" aria-hidden />

              <div className="relative z-10 md:min-h-[120px] min-h-[80px]">
                <div className="flex justify-between items-start md:mb-3 mb-0 md:mx-4 mx-2">
                  <h3 className="md:text-lg text-base font-semibold">{pkg.title}</h3>
                  {pkg.credits && (
                    <div className="text-right">
                      <p className="md:text-xl text-base font-bold leading-none">{pkg.credits}</p>
                      <p className="md:text-xs text-[10px] text-white/70 mt-1">Credits</p>
                    </div>
                  )}
                </div>

                <div className="md:mx-4 mx-2">
                  <p className="md:text-xl text-base font-bold mt-1">{pkg.price}</p>
                </div>

                <p className="md:text-xs text-[10px] text-white/70 mt-2 md:mx-3 mx-2 leading-snug break-words">{pkg.eligibility}</p>
              </div>

              <div className="md:my-4 my-2 md:mx-3 mx-2 mt-auto">
                <button className="mt-4 bg-[#1C303D] hover:bg-[#1c3c52] text-white rounded-lg md:px-5 px-3 md:py-2 py-1 md:text-medium text-sm font-medium ring-1 ring-white/15 transition-colors w-full">
                  Purchase
                </button>
              </div>

          
            </div>
          ))}
          </div>
          {/* Navigation dots for mobile */}
          <div className="md:hidden flex justify-center gap-2 mt-4">
            {creditPackages.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollToCredit(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  currentCreditIndex === index ? 'bg-white w-6' : 'bg-white/40'
                }`}
                aria-label={`Go to credit package ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
};

export default AdditionalCredits;