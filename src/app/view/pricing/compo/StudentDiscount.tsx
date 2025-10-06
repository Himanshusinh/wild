export default function StudentDiscount() {
  return (
    <div className="relative text-white rounded-[2rem]
      bg-white/5 backdrop-blur-2xl backdrop-saturate-150 bg-clip-padding
      border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.35)] ring-1 ring-white/10
      p-5 py-6 w-full md:w-[38%] lg:w-[38%] max-w-7xl min-h-[260px] isolate">
      {/* Glass highlight */}
      <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-b from-white/5 via-transparent to-transparent opacity-20" aria-hidden />
      <div className="pointer-events-none absolute inset-0 rounded-[2rem] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]" aria-hidden />

      <div className="min-h-[92px]">
        <h4 className="text-lg font-semibold mx-2">Student Discount</h4>
        <div className="h-px w-16 bg-white/20 my-2 mx-2" />
        <p className="text-xs text-white/70 leading-snug mx-2">
          Unlock premium features at an exclusive student price. Affordable, accessible, and
          designed to support your learning journey.
        </p>
      </div>

      <div className="mt-4 mx-2">
        <button className="mt-2 bg-[#1C303D] hover:bg-[#1c3c52] text-white rounded-full px-5 py-2 text-xs font-medium ring-1 ring-white/15 transition-colors">
          Validate Student ID
        </button>
      </div>
    </div>
  );
}


