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
    price: "$3",
   credits: "5000",
    eligibility: "Eligible for Professional and Collective",
    gradient: "from-green-500 to-green-700"
  }
 ];

  function AdditionalCredits(){
  return(
    <div className="w-full">
      <div className="w-full">
        <h1 className="text-white text-4xl font-semibold text-left mb-7 mt-5">Additional Credits</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-5 gap-6">
          {creditPackages.map((pkg) => (
            <div 
              key={pkg.id}
              className={`rounded-[2rem] p-8 text-white border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-md shadow-[0_0_1px_#fff_inset,0_10px_30px_rgba(0,0,0,0.4)] relative overflow-hidden w-full min-h-[280px]`}
            >
              <div className="relative z-10">
               <div className="flex justify-between items-start mb-6">
                 <h3 className="text-2xl font-semibold">{pkg.title}</h3>
                 <div className="text-right">
                   <p className="text-3xl font-bold leading-none">{pkg.credits}</p>
                   <p className="text-xs text-white/70 mt-1">Credits</p>
                 </div>
               </div>
                
                <div className="mb-6">
                  <p className="text-4xl font-bold mt-3">{pkg.price}</p>
                </div>
                
                <p className="text-base opacity-90 mb-8 leading-relaxed">{pkg.eligibility}</p>
                <button className="w-full bg-[#1C303D] hover:bg-[#1c3c52] text-white rounded-full text-base py-3">
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