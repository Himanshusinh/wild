'use client';

import { StudentDiscount } from "@/app/view/pricing/compo";
import AdditionalCredits from "@/app/view/pricing/compo/AdditionalCredits";
import CompareTable from "@/app/view/pricing/compo/CompareTable";
import CurrentPlan from "@/app/view/pricing/compo/currentPlan";
import FAQs from "@/app/view/pricing/compo/FAQs";
import Plans from "@/app/view/pricing/compo/Plans";
import SidePannelFeatures from "../Generation/Core/SidePannelFeatures";
import Nav from "../Generation/Core/Nav";
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
    <div className="min-h-screen bg-black">
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

              {/* Toggle Switch */}
              <div className="flex items-center justify-center mt-10 ">
                <div className="relative">
                  {/* Toggle Container */}
                  <div className="relative bg-[#1C303D] rounded-full p-1 w-52 h-12 ring-1 ring-white/15 overflow-visible">
                    {/* Ambient gradient glow */}
                    <div className={`pointer-events-none absolute -inset-6 rounded-full blur-2xl transition-opacity duration-500 ${isAnnual ? 'opacity-60 bg-gradient-to-r from-blue-500/20 via-cyan-400/20 to-teal-400/20' : 'opacity-40 bg-gradient-to-r from-indigo-400/20 via-purple-400/20 to-pink-400/20'}`} />
                    {/* Sliding Background */}
                    <div
                      className={`absolute top-1 bottom-1 w-22 rounded-full bg-white shadow-[0_8px_20px_rgba(0,0,0,0.15)] transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] transform-gpu ${isAnnual
                          ? 'translate-x-28 scale-105'
                          : 'translate-x-0 scale-105'
                        }`}
                    />

                    {/* Monthly Option */}
                    <button
                      onClick={() => setIsAnnual(false)}
                      className={`absolute left-1 top-1 bottom-1 w-22 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out focus:outline-none ${!isAnnual ? 'text-[#1C303D] translate-y-[-1px]' : 'text-white opacity-80'
                        }`}
                    >
                      <span className="text-sm font-medium ">Monthly</span>
                    </button>

                    {/* Annually Option with anchored badge */}
                    <div className="absolute right-1 top-1 bottom-1 w-22 flex items-center justify-center">
                      <div className={`absolute -top-6 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-semibold px-3 py-1 ml-10 rounded-3xl whitespace-nowrap shadow-md ${isAnnual ? 'opacity-100' : 'opacity-100'}`}>
                        Save 20% on everything
                      </div>
                      <button
                        onClick={() => setIsAnnual(true)}
                        className={`w-full rounded-full flex items-center justify-center transition-all duration-300 ease-in-out focus:outline-none ${isAnnual ? 'text-[#1C303D] translate-y-[-1px]' : 'text-white opacity-80'}`}
                      >
                        <span className="text-sm font-medium">Annually</span>
                      </button>
                    </div>
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

            <FooterNew />
          </main>
        </div>
      </div>
    </div>
  );
}
