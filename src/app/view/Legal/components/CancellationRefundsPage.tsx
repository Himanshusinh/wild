'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getImageUrl } from '@/routes/imageroute';

const CancellationRefundsPage: React.FC = () => {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Cancellation & Refunds</h1>
          <p className="text-xl text-gray-400">Our cancellation and refund policy</p>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-4xl space-y-8">
          <section>
            <h2 className="text-3xl font-semibold mb-4">Cancellation Policy</h2>
            <p className="text-gray-300 mb-4">
              You may cancel your subscription at any time. Cancellation will take effect at the end of your current 
              billing period. You will continue to have access to all features until the end of your paid period.
            </p>
            <p className="text-gray-300">
              To cancel your subscription, please visit your account settings or contact our support team.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-4">Refund Policy</h2>
            <p className="text-gray-300 mb-4">
              <strong>Digital Credits:</strong> All purchases of digital credits are final and non-refundable. 
              Credits cannot be returned or refunded once purchased.
            </p>
            <p className="text-gray-300 mb-4">
              <strong>Subscriptions:</strong> Subscription fees are generally non-refundable. However, we may consider 
              refunds on a case-by-case basis for exceptional circumstances, such as:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Technical issues preventing service access</li>
              <li>Duplicate charges or billing errors</li>
              <li>Service unavailability for extended periods</li>
            </ul>
            <p className="text-gray-300 mt-4">
              Refund requests must be submitted within 14 days of the charge date. All refund decisions are at our 
              sole discretion.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-4">Processing Refunds</h2>
            <p className="text-gray-300 mb-4">
              If a refund is approved, it will be processed to the original payment method within 5-10 business days. 
              The refunded amount will appear on your statement according to your bank or payment provider's processing time.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-4">Contact Us</h2>
            <p className="text-gray-300 mb-4">
              For questions about cancellations or refunds, please contact our support team. We're here to help 
              resolve any issues you may have.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
};

export default CancellationRefundsPage;

