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
                  {/* Save 20% Badge */}
                  {
                    <div className="absolute -top-6 left-16 bg-green-500 text-white text-xs font-medium px-3 py-1 rounded-3xl whitespace-nowrap">
                      Save 20% on everything
                    </div>
                  }

                  {/* Toggle Container */}
                  <div className="relative bg-gray-700 rounded-full p-1 w-52 h-12">
                    {/* Sliding Background */}
                    <div
                      className={`absolute top-1 bottom-1 w-22 rounded-full transition-all duration-300 ease-in-out ${isAnnual
                          ? 'bg-gray-300 translate-x-28'
                          : 'bg-gray-300 translate-x-0'
                        }`}
                    />

                    {/* Monthly Option */}
                    <button
                      onClick={() => setIsAnnual(false)}
                      className={`absolute left-1 top-1 bottom-1 w-22 rounded-full flex items-center justify-center transition-colors duration-300 ease-in-out focus:outline-none ${!isAnnual ? 'text-gray-700' : 'text-white'
                        }`}
                    >
                      <span className="text-sm font-medium ">Monthly</span>
                    </button>

                    {/* Annually Option */}
                    <button
                      onClick={() => setIsAnnual(true)}
                      className={`absolute right-1 top-1 bottom-1 w-22 rounded-full flex items-center justify-center transition-colors duration-300 ease-in-out focus:outline-none ${isAnnual ? 'text-gray-700' : 'text-white'
                        }`}
                    >
                      <span className="text-sm font-medium">Annually</span>
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

            <FooterNew />
          </main>
        </div>
      </div>
    </div>
  );
}
