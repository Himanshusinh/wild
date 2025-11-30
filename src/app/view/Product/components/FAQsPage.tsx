'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getImageUrl } from '@/routes/imageroute';
import { PRODUCT_ROUTES } from '@/routes/routes';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQsPage: React.FC = () => {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      question: "What is WildMind AI?",
      answer: "WildMind AI is an advanced AI-powered platform that helps you create stunning images, videos, and audio content using cutting-edge generative AI technology. Transform your imagination into reality with our suite of creative tools."
    },
    {
      question: "How do I get started?",
      answer: "Getting started is easy! Simply sign up for an account, choose a plan that suits your needs, and start creating. You can begin generating content immediately after signing up."
    },
    {
      question: "What types of content can I create?",
      answer: "You can create a wide variety of content including AI-generated images, videos, music, logos, product mockups, and more. Our platform supports multiple creative workflows to bring your ideas to life."
    },
    {
      question: "How does the credit system work?",
      answer: "Credits are used to generate content on our platform. Different types of content require different amounts of credits based on complexity and quality. You can purchase credits or subscribe to a plan that includes monthly credits."
    },
    {
      question: "Can I use generated content commercially?",
      answer: "Yes! Subject to your subscription plan and compliance with our Terms of Service, you own the content you generate and can use it for commercial purposes. Please review our Terms of Service for complete details."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept major credit cards, debit cards, and other payment methods through our secure payment gateway. Enterprise customers can also arrange for invoice-based billing."
    },
    {
      question: "Do you offer refunds?",
      answer: "Digital credits and subscriptions are generally non-refundable. However, we may consider refunds on a case-by-case basis for exceptional circumstances. Please contact our support team for assistance."
    },
    {
      question: "Is there an API available?",
      answer: "Yes! We offer API access for enterprise customers and developers. Check out our API documentation or contact our sales team to learn more about API access and custom integrations."
    },
    {
      question: "How do I contact support?",
      answer: "You can reach our support team through the support section on our website, or email us directly. Enterprise customers have access to dedicated support channels and priority assistance."
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Yes, you can cancel your subscription at any time. Your subscription will remain active until the end of your current billing period, and you'll continue to have access to all features until then."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
            aria-label="Go back"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Back</span>
          </button>
          <div className="mb-4">
            <Image
              src={getImageUrl("core", "logo") || "/placeholder.svg"}
              alt="WildMind Logo"
              width={120}
              height={48}
              className="h-8 w-auto"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-gray-400">Find answers to common questions about WildMind AI</p>
        </div>

        {/* FAQs */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className="border border-gray-800 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-900 transition-colors"
              >
                <span className="font-semibold text-lg">{faq.question}</span>
                <svg
                  className={`w-5 h-5 transition-transform ${openIndex === index ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === index && (
                <div className="px-6 py-4 bg-gray-900 text-gray-300">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact Support */}
        <div className="mt-12 p-6 bg-gray-900 rounded-lg border border-gray-800">
          <h2 className="text-2xl font-semibold mb-4">Still have questions?</h2>
          <p className="text-gray-300 mb-4">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <Link 
            href={PRODUCT_ROUTES.DOCUMENTATION}
            className="inline-block px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-semibold"
          >
            View Documentation
          </Link>
        </div>
      </div>
    </main>
  );
};

export default FAQsPage;
