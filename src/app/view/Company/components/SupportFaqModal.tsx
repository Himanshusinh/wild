"use client";

import { useMemo, useState } from "react";

type SupportFaqModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const FAQS = [
  {
    question: "How do I reset my password?",
    answer:
      "Click the 'Forgot Password' link on the login page. Enter your email and we will send you a reset link. Follow the instructions in the email to create a new password.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, Mastercard, Amex), PayPal, and bank transfers. All payments are secure and encrypted.",
  },
  {
    question: "Is my data safe?",
    answer:
      "Yes. We use industry-standard encryption to protect your data, follow modern security practices, and support additional safeguards such as two-factor authentication.",
  },
  {
    question: "Can I cancel my subscription?",
    answer:
      "Yes, you can cancel anytime from account settings. There are no hidden fees, and cancellation takes effect at the end of your billing cycle.",
  },
  {
    question: "What is your response time?",
    answer:
      "We usually respond within 24-48 hours during business days. Priority requests may receive faster response depending on plan and support load.",
  },
  {
    question: "Do you have API documentation?",
    answer:
      "Yes. API documentation is available with integration guidance and examples.",
  },
];

export default function SupportFaqModal({ isOpen, onClose }: SupportFaqModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [openIndices, setOpenIndices] = useState<number[]>([]);

  const filteredFaqs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return FAQS;
    return FAQS.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  const toggleFaq = (index: number) => {
    setOpenIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[210] flex items-center justify-center bg-black/65 p-3 backdrop-blur-md sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-[#0E0E12] shadow-[0_24px_60px_rgba(0,0,0,0.55)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative border-b border-white/10 bg-gradient-to-br from-[#162846] via-[#12223c] to-[#0E1A2E] px-6 pb-8 pt-10 text-center sm:px-8">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/90 transition hover:bg-white/20"
            aria-label="Close support center"
          >
            ×
          </button>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Support Center</h2>
          <p className="mt-2 text-sm text-white/80 sm:text-base">
            Find answers, track issues, and get help whenever you need it. 
          </p>
          <p className="mt-2 text-sm text-white-500 sm:text-base">Email:
           <a href="mailto:support@wildmindai.com" className="text-blue-500 hover:text-white-300"> support@wildmindai.com
            </a>  
          </p>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-6 sm:px-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for help..."
              className="w-full rounded-lg border border-white/15 bg-[#10182b] px-4 py-3 text-sm text-white outline-none ring-[#3B82F6]/30 placeholder:text-white/45 focus:border-[#3B82F6]/50 focus:ring-2"
            />
            <button
              type="button"
              className="rounded-lg bg-[#3B82F6] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2563EB]"
            >
              Search
            </button>
          </div>

          <h3 className="mb-4 text-xl font-semibold text-white">Frequently Asked</h3>

          <div className="divide-y divide-white/10">
            {filteredFaqs.map((item, index) => {
              const isOpenItem = openIndices.includes(index);
              return (
                <div key={item.question} className="py-4">
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="flex w-full items-center justify-between gap-3 text-left text-sm font-semibold text-white/90 transition hover:text-[#60A5FA]"
                  >
                    <span>{item.question}</span>
                    <span
                      className={`text-[#60A5FA] transition-transform ${
                        isOpenItem ? "rotate-180" : ""
                      }`}
                    >
                      ▼
                    </span>
                  </button>
                  {isOpenItem ? (
                    <p className="mt-3 text-sm leading-relaxed text-white/65">{item.answer}</p>
                  ) : null}
                </div>
              );
            })}
            {!filteredFaqs.length ? (
              <p className="py-5 text-sm text-white/60">No FAQ matched your search.</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
