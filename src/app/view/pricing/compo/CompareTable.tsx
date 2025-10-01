  const plans = [
    { name: "Hobbyist", key: "hobbyist" },
    { name: "Creator", key: "creator" },
    { name: "Professional", key: "professional" },
    { name: "Collective", key: "collective" },
    { name: "Enterprise", key: "enterprise" }
  ];

  const features = [
    {
      name: "Credits",
      hobbyist: "200",
      creator: "500",
      professional: "1000",
      collective: "4000",
      enterprise: "200"
    },
    {
      name: "Generate images up to",
      hobbyist: "510",
      creator: "1026",
      professional: "2055",
      collective: "Unlimited",
      enterprise: "510"
    },
    {
      name: "Generate Video up to",
      hobbyist: "25",
      creator: "50",
      professional: "100",
      collective: "400",
      enterprise: "25"
    },
    {
      name: "Library Storage (GB)",
      hobbyist: "10",
      creator: "20",
      professional: "50",
      collective: "200",
      enterprise: "10"
    },
    {
      name: "Art Station Access",
      hobbyist: "Unlimited",
      creator: "Unlimited",
      professional: "Unlimited",
      collective: "Unlimited",
      enterprise: "Unlimited"
    },
    {
      name: "Downloads",
      hobbyist: "Unlimited",
      creator: "Unlimited",
      professional: "Unlimited",
      collective: "Unlimited",
      enterprise: "Unlimited"
    },
    {
      name: "Device access",
      hobbyist: "1",
      creator: "3",
      professional: "5",
      collective: "10",
      enterprise: "1"
    },
    {
      name: "Generation Quality up to",
      hobbyist: "1080p",
      creator: "2K",
      professional: "4K",
      collective: "4K",
      enterprise: "1080p"
    },
    {
      name: "Concurrent Image Generations",
      hobbyist: "2",
      creator: "3",
      professional: "5",
      collective: "10",
      enterprise: "2"
    },
    {
      name: "Concurrent Video Generations",
      hobbyist: "1",
      creator: "2",
      professional: "3",
      collective: "5",
      enterprise: "1"
    },
    {
      name: "Watermark (Videos)",
      hobbyist: "",
      creator: "",
      professional: "",
      collective: "•",
      enterprise: ""
    },
    {
      name: "Access to all AI models",
      hobbyist: "1",
      creator: "1",
      professional: "1",
      collective: "All",
      enterprise: "1"
    },
    {
      name: "Additional Token Purchases",
      hobbyist: "",
      creator: "All",
      professional: "",
      collective: "•",
      enterprise: ""
    },
    {
      name: "Purchases Additional Storage",
      hobbyist: "",
      creator: "",
      professional: "",
      collective: "",
      enterprise: ""
    }
  ];

  function CompareTable() {
  return (
    <div className="py-10 w-full">
      <div className="w-full">
        <div className="text-left">
          <h1 className="text-white text-2xl font-semibold mb-2">Compare Plans</h1>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>  
                <th className="text-left p-6 border-b border-gray-700 text-gray-300 font-semibold min-w-[180px] text-base">
                  Features
                </th>
                {plans.map((plan) => (
                  <th 
                    key={plan.key}
                    className="text-center p-6 border-b border-gray-700 text-white font-bold text-xl min-w-[180px]"
                  >
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((feature, index) => (
                <tr key={index} className="border-b border-gray-800">
                  <td className="p-6 text-gray-300 font-medium min-w-[200px] text-base">
                    {feature.name}
                  </td>
                  <td className="p-6 text-center text-white min-w-[180px] text-base">
                    {feature.hobbyist}
                  </td>
                  <td className="p-6 text-center text-white min-w-[180px] text-base">
                    {feature.creator}
                  </td>
                  <td className="p-6 text-center text-white min-w-[180px] text-base">
                    {feature.professional}
                  </td>
                  <td className="p-6 text-center text-white min-w-[180px] text-base">
                    {feature.collective}
                  </td>
                  <td className="p-6 text-center text-white min-w-[180px] text-base">
                    {feature.enterprise}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="p-6"></td>
                <td className="p-6 text-center">
                  <button className="bg-[#1C303D] hover:bg-[#1c3c52] text-white font-medium px-4 py-2 rounded-full text-sm transition-colors duration-300 whitespace-nowrap">
                    Get Started
                  </button>
                </td>
                <td className="p-6 text-center">
                  <button className="bg-[#1C303D] hover:bg-[#1c3c52] text-white font-medium px-4 py-2 rounded-full text-sm transition-colors duration-300 whitespace-nowrap">
                    Get Started
                  </button>
                </td>
                <td className="p-6 text-center">
                  <button className="bg-[#1C303D] hover:bg-[#1c3c52] text-white font-medium px-4 py-2 rounded-full text-sm transition-colors duration-300 whitespace-nowrap">
                    Get Started
                  </button>
                </td>
                <td className="p-6 text-center">
                  <button className="bg-[#1C303D] hover:bg-[#1c3c52] text-white font-medium px-4 py-2 rounded-full text-sm transition-colors duration-300 whitespace-nowrap">
                    Get Started
                  </button>
                </td>
                <td className="p-6 text-center">
                  <button className="bg-[#1C303D] hover:bg-[#1c3c52] text-white font-medium px-4 py-2 rounded-full text-sm transition-colors duration-300 whitespace-nowrap">
                    Contact Sales
                  </button>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CompareTable;
