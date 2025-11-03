  'use client';

import { StudentDiscount } from "@/app/view/pricing/compo";
import AdditionalCredits from "@/app/view/pricing/compo/AdditionalCredits";
import CompareTable from "@/app/view/pricing/compo/CompareTable";
import CurrentPlan from "@/app/view/pricing/compo/currentPlan";
import FAQs from "@/app/view/pricing/compo/FAQs";
import Plans from "@/app/view/pricing/compo/Plans";
import SidePannelFeatures from "../Generation/Core/SidePannelFeatures";
import Nav from "../HomePage/compo/Nav";
import FooterNew from "../core/FooterNew";
import { useState } from "react";
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { setCurrentView, setCurrentGenerationType } from '@/store/slices/uiSlice';

  export default function Home() {
    const [isAnnual, setIsAnnual] = useState(false);
    const router = useRouter();
    const dispatch = useAppDispatch();

    const handleViewChange = (view: string) => {
      try {
        dispatch(setCurrentView(view as any));
        if (view === 'generation') {
          router.push('/');
        }
      } catch (e) {
        console.error('[Pricing] handleViewChange error', e);
      }
    };

    const handleGenerationTypeChange = (type: string) => {
      try {
        dispatch(setCurrentGenerationType(type as any));
        dispatch(setCurrentView('generation' as any));
        router.push('/');
      } catch (e) {
        console.error('[Pricing] handleGenerationTypeChange error', e);
      }
    };

    const toggleBilling = () => {
      setIsAnnual(!isAnnual);
    };

    return (
      <div className="min-h-screen bg-[#07070B]">
        {/* Navigation - fixed at top */}
        <div className="fixed top-0 left-0 right-0 z-50">
          <Nav />
        </div>

        {/* Main layout - side panel + content area */}
        <div className="flex "> {/* pt-[80px] to account for fixed nav */}
          {/* Side Panel - fixed width */}
          <div className="w-[68px] flex-shrink-0">
            <SidePannelFeatures
              onViewChange={handleViewChange}
              onGenerationTypeChange={handleGenerationTypeChange}
            />
          </div>

          {/* Main Content Area - takes remaining width */}
          <div className="flex-1 min-w-0">
            <main className="text-white min-h-screen">
              <section className="header space-y-4 px-6 py-6 w-full">
                <h2 className="head text-4xl font-semibold text-center mt-20">Plans Made for Everyone</h2>
                <p className="line text-center font-xs">Scalable solutions tailored to teams of all sizes.</p>

                {/* Toggle Switch - simplified style like reference */}
                <div className="flex items-center justify-center mt-10 rounded-lg">
                  <div className="flex items-center gap-4 rounded-lg bg-white/10 backdrop-blur-2xl backdrop-saturate-150 border border-white/10 shadow-xl p-2 ring-1 ring-white/10">
                    <button
                      onClick={() => setIsAnnual(false)}
                      aria-pressed={!isAnnual}
                      className={`text-base font-medium transition-colors ${!isAnnual ? 'text-white' : 'text-white/70'}`}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAnnual(!isAnnual)}
                      aria-label="Toggle billing period"
                      className={`relative inline-flex h-6 w-12 items-center rounded-md transition-colors duration-300 ${isAnnual ? 'bg-[#1C303D]' : 'bg-white'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-sm shadow transition-transform duration-300 ${isAnnual ? 'bg-white translate-x-7' : 'bg-[#000000] translate-x-1'}`}
                      />
                    </button>
                    <div className="relative flex items-center justify-center">
                      <div className=" ml-16 absolute -top-6 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-lg whitespace-nowrap shadow-md">
                        Save 20% on everything
                      </div>
                      <button
                        onClick={() => setIsAnnual(true)}
                        aria-pressed={isAnnual}
                        className={`text-base font-medium transition-colors ${isAnnual ? 'text-white' : 'text-white/70'}`}
                      >
                        Annually
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <section className="pricing-packages w-full  pt-8 flex flex-col items-center gap-10 px-14">
                {/* {plans.map((p, i) => (
                <div key={p.packageName} className={i === 0 ? "w-full sm:w-[60%]" : "w-full sm:w-[30%]"}>
                <Package
                  packageName={p.packageName}
                  activeSince={p.activeSince}
                  credits={p.credits}
                  features={p.features}
                  available={p.available}
                  />
                </div>
                  ))} */}
                <div className="flex flex-col md:flex-row flex-wrap gap-6 justify-start w-full">
                  <CurrentPlan />
                  <StudentDiscount />
                </div>
                <Plans isAnnual={isAnnual} />
                <AdditionalCredits />
                <CompareTable />
                <div className="mb-20">
                  <FAQs />
                </div>
              </section>
                  
              <div className="w-full bg-[#0C0C10]">
                <FooterNew />
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
