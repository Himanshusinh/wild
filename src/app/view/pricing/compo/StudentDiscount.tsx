export default function StudentDiscount() {
  return (
    <div className="relative w-full md:w-[38%] lg:w-[38%] max-w-7xl min-h-[350px] text-white rounded-[3rem] border border-white/10 bg-white/5 p-10">
      <h4 className="text-xl font-semibold">Student Discount</h4>
      <div className="h-px w-20 bg-white/20 my-4" />
      <p className="text-sm text-white/70 leading-relaxed">
        Unlock premium features at an exclusive student price. Affordable, accessible, and
        designed to support your learning journey.
      </p>
      <button className="absolute bottom-8 left-10 bg-[#1C303D] hover:bg-[#1c3c52] text-white rounded-full px-6 py-3 text-base font-medium">
        Validate Student ID
      </button>
    </div>
  );
}


