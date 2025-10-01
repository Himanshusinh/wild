function CurrentPlan() {
  return (
    <div className="relative current-plan min-h-[350px] text-white rounded-[3rem] backdrop-blur-sm shadow-sm z-30 border border-white/10 bg-white/5 p-10 w-full md:w-[60%] lg:w-[60%] max-w-7xl">
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