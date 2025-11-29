'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getImageUrl } from '@/routes/imageroute';

const ShippingPage: React.FC = () => {
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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Shipping Policy</h1>
          <p className="text-xl text-gray-400">Information about digital product delivery</p>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-4xl space-y-8">
          <section>
            <h2 className="text-3xl font-semibold mb-4">Digital Products</h2>
            <p className="text-gray-300 mb-4">
              WildMind AI is a digital service platform. All products and services are delivered digitally through 
              our online platform. There are no physical products to ship.
            </p>
            <p className="text-gray-300">
              Upon purchase or subscription activation, you will have immediate access to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Digital credits for content generation</li>
              <li>Subscription features and benefits</li>
              <li>Access to AI generation tools</li>
              <li>Download links for generated content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-4">Instant Access</h2>
            <p className="text-gray-300 mb-4">
              All digital products and services are available immediately after purchase. You can start using 
              WildMind AI services right away - no waiting for shipping or delivery.
            </p>
            <p className="text-gray-300">
              Your account will be updated instantly upon successful payment, and you'll receive email confirmation 
              with your purchase details.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-4">Content Delivery</h2>
            <p className="text-gray-300 mb-4">
              Generated content (images, videos, audio) is delivered instantly through our platform. You can:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Download content directly from your account</li>
              <li>Access your generation history at any time</li>
              <li>Share content via secure links</li>
              <li>Export content in various formats</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-4">No Physical Shipping</h2>
            <p className="text-gray-300">
              Since all our products are digital, we do not offer physical shipping. All services are delivered 
              electronically through your WildMind AI account. If you have any questions about accessing your 
              digital products, please contact our support team.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
};

export default ShippingPage;

