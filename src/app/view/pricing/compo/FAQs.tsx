  const faqData = [
    {
      id: 1,
      question: "Which plan is best for me?",
      answer: "Choose the Free plan if you're just getting started. The Hobbyist plan is perfect for casual users and students. Creator is ideal for creative professionals, while Professional suits advanced creators and businesses. Collective is designed for agencies and creative teams."
    },
    {
      id: 2,
      question: "Can I change my plan anytime?",
      answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing differences."
    },
    {
      id: 3,
      question: "What happens to my credits when I change plans?",
      answer: "Your existing credits remain valid. When you upgrade, you'll receive additional credits based on your new plan. Downgrades don't affect your current credit balance."
    },
    {
      id: 4,
      question: "Do you offer student discounts?",
      answer: "Yes! We have special student pricing available. Click on the 'Validate Student ID' button to verify your student status and unlock exclusive pricing."
    }
  ];

  function FAQs() {
  return (
    <div className="w-full">
      <div className="w-full">
        <h1 className="text-gray-900 dark:text-white text-4xl font-semibold text-left mb-7 mt-5">FAQs</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-2 sm:gap-3">
          {faqData.map((faq) => (
            <div 
              key={faq.id}
              className="relative text-gray-900 dark:text-white rounded-[2rem]
              p-4 py-6 w-full min-h-[160px] isolate border border-gray-200 dark:border-white/10 ring-1 ring-gray-200 dark:ring-white/10
               bg-white dark:bg-white/10 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_8px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
            >
              {/* Subtle glass highlight for consistency */}
              <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-b from-gray-100/50 dark:from-white/5 via-transparent to-transparent opacity-20" aria-hidden />
              <div className="pointer-events-none absolute inset-0 rounded-[2rem] shadow-[inset_0_1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]" aria-hidden />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 relative z-10 mx-1">{faq.question}</h3>
              <p className="text-gray-900 dark:text-gray-600 dark:text-white/70 leading-snug text-sm relative z-10 mx-1">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FAQs;
