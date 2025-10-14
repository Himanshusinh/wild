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
      hobbyist: "12360",
      creator: "24720",
      professional: "61800",
      collective: "197760",
      enterprise: "Unlimited"
    },
    {
      name: "Generate images up to",
      hobbyist: "247",
      creator: "494",
      professional: "1236",
      collective: "Unlimited",
      enterprise: "Custom"
    },
    {
      name: "Generate Video up to",
      hobbyist: "56",
      creator: "112",
      professional: "280",
      collective: "900",
      enterprise: "Custom"
    },
    {
      name: "Library Storage (GB)",
      hobbyist: "10",
      creator: "30",
      professional: "50",
      collective: "150",
      enterprise: "Custom"
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
      enterprise: "Custom"
    },
    {
      name: "Generation Quality up to",
      hobbyist: "1080p HD",
      creator: "2K",
      professional: "4K",
      collective: "4K",
      enterprise: "4K"
    },
    {
      name: "Concurrent Image Generations",
      hobbyist: "2",
      creator: "3",
      professional: "5",
      collective: "10",
      enterprise: "10"
    },
    {
      name: "Concurrent Video Generations",
      hobbyist: "1",
      creator: "2",
      professional: "3",
      collective: "5",
      enterprise: "5"
    },
    {
      name: "Watermark (Videos)",
      hobbyist: "Not Removable",
      creator: "Removable",
      professional: "Removable",
      collective: "Removable",
      enterprise: "Removable"
    },
    {
      name: "Access to all AI models",
      hobbyist: "Yes",
      creator: "Yes",
      professional: "Yes",
      collective: "Yes",
      enterprise: "Yes"
    },
    {
      name: "Additional Token Purchases",
      hobbyist: "No Access",
      creator: "Limited Access",
      professional: "Limited Access",
      collective: "Unlimited Access",
      enterprise: "Custom"
    },
    {
      name: "Purchases Additional Storage",
      hobbyist: "Limited Access",
      creator: "Limited Access",
      professional: "Limited Access",
      collective: "Limited Access",
      enterprise: "Custom"
    }
  ];

  function CompareTable() {
  return (
    <div className="py-10 w-full">
      <div className="w-full">
        <div className="text-left">
          <h1 className="text-gray-900 dark:text-white text-4xl font-semibold mb-7 mt-5">Compare Plans</h1>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>  
                <th className="text-left p-4 border-b border-gray-200 dark:border-white/10 text-gray-900 dark:text-white/80 font-semibold min-w-[160px] text-sm">
                  Features
                </th>
                {plans.map((plan) => (
                  <th 
                    key={plan.key}
                    className="text-center p-4 border-b border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-semibold text-base min-w-[160px]"
                  >
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((feature, index) => (
                <tr key={index} className="border-b border-gray-200 dark:border-white/10">
                  <td className="p-4 text-gray-900 dark:text-white/80 font-medium min-w-[180px] text-sm">
                    {feature.name}
                  </td>
                  <td className="p-4 text-center text-gray-900 dark:text-white min-w-[160px] text-sm">
                    {feature.hobbyist}
                  </td>
                  <td className="p-4 text-center text-gray-900 dark:text-white min-w-[160px] text-sm">
                    {feature.creator}
                  </td>
                  <td className="p-4 text-center text-gray-900 dark:text-white min-w-[160px] text-sm">
                    {feature.professional}
                  </td>
                  <td className="p-4 text-center text-gray-900 dark:text-white min-w-[160px] text-sm">
                    {feature.collective}
                  </td>
                  <td className="p-4 text-center text-gray-900 dark:text-white min-w-[160px] text-sm">
                    {feature.enterprise}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="p-4"></td>
                <td className="p-4 text-center">
                  <button className="bg-blue-600 hover:bg-blue-700 dark:bg-[#1C303D] dark:hover:bg-[#1c3c52] text-white font-medium px-4 py-2 rounded-full text-sm ring-1 ring-gray-300 dark:ring-white/15 transition-colors whitespace-nowrap">
                    Get Started
                  </button>
                </td>
                <td className="p-4 text-center">
                  <button className="bg-blue-600 hover:bg-blue-700 dark:bg-[#1C303D] dark:hover:bg-[#1c3c52] text-white font-medium px-4 py-2 rounded-full text-sm ring-1 ring-gray-300 dark:ring-white/15 transition-colors whitespace-nowrap">
                    Get Started
                  </button>
                </td>
                <td className="p-4 text-center">
                  <button className="bg-blue-600 hover:bg-blue-700 dark:bg-[#1C303D] dark:hover:bg-[#1c3c52] text-white font-medium px-4 py-2 rounded-full text-sm ring-1 ring-gray-300 dark:ring-white/15 transition-colors whitespace-nowrap">
                    Get Started
                  </button>
                </td>
                <td className="p-4 text-center">
                  <button className="bg-blue-600 hover:bg-blue-700 dark:bg-[#1C303D] dark:hover:bg-[#1c3c52] text-white font-medium px-4 py-2 rounded-full text-sm ring-1 ring-gray-300 dark:ring-white/15 transition-colors whitespace-nowrap">
                    Get Started
                  </button>
                </td>
                <td className="p-4 text-center">
                  <button className="bg-blue-600 hover:bg-blue-700 dark:bg-[#1C303D] dark:hover:bg-[#1c3c52] text-white font-medium px-4 py-2 rounded-full text-sm ring-1 ring-gray-300 dark:ring-white/15 transition-colors whitespace-nowrap">
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
