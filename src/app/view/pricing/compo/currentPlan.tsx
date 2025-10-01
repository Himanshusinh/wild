function CurrentPlan() {
  return (
    <div className="relative current-plan min-h-[300px] text-white rounded-[3rem] border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-md shadow-[0_0_1px_#fff_inset,0_10px_30px_rgba(0,0,0,0.4)] p-10 w-full md:w-[60%] lg:w-[65%] max-w-[900px]">
        <h1 className="text-xl font-semibold">Current Plan</h1>
        <p className="text-sm text-white/80 mt-1">Active Since : 01/01/2026</p>

        <div className="absolute top-8 right-10 text-right">
          <p className="text-4xl font-bold leading-none">4120</p>
          <p className="text-sm text-white/70 mt-2">Credits</p>
        </div>

        <button className="absolute bottom-8 right-10 bg-[#1C303D] hover:bg-[#1c3c52] text-white rounded-full px-6 py-3 text-base font-medium">Change Plan</button>
    </div>
  );

    
}

export default CurrentPlan;
