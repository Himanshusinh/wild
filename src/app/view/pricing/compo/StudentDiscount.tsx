export default function StudentDiscount() {
  return (
    <div className="relative text-white rounded-lg
      bg-white/5 backdrop-blur-2xl backdrop-saturate-150 bg-clip-padding
      border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.35)] ring-1 ring-white/10
      md:p-5 p-0 py-2 w-full md:w-[39%] isolate md:flex-shrink-0">
      {/* Glass highlight */}
      <div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-b from-white/5 via-transparent to-transparent opacity-20" aria-hidden />
      <div className="pointer-events-none absolute inset-0 rounded-lg shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]" aria-hidden />

      <div className="md:min-h-[92px] min-h-[60px]">
        <h4 className="md:text-2xl text-xl font-semibold mx-2 text-center">Student Discount</h4>
        <div className=" md:w-16 w-10  my-2 mx-2" />
        <p className="md:text-md text-[10px] text-white/70 mx-0 justify-center text-center px-2">
          Unlock premium features at an exclusive student price. Affordable, accessible, and
          designed to support your learning journey.
        </p>
      </div>

      <div className="md:mt-4 mt-2 mx-0 justify-center text-center">
        <button className="mt-0 bg-[#1C303D] hover:bg-[#1c3c52] text-white rounded-lg md:px-5 px-3 md:py-2 py-1 md:text-medium text-sm font-regular ring-1 ring-white/15 transition-colors justify-center">
          Validate Student ID
        </button>
      </div>
    </div>
  );
}


