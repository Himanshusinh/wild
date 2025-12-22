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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Shipping and Delivery Policy</h1>
          <p className="text-xl text-gray-400">Digital service delivery for Wild Mind AI</p>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-4xl space-y-8">
          <section>
            <h2 className="text-3xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-gray-300 mb-4">
              This Shipping and Delivery Policy describes how digital products and services offered by Wild Mind AI, a
              product developed by Wild Child Studios, are delivered to users. As Wild Mind AI operates exclusively in
              the digital domain, all services are provided electronically and become accessible immediately upon
              successful authentication, payment confirmation, or credit allocation.
            </p>
            <p className="text-gray-300">
              By creating an account or making any purchase on the platform, you acknowledge and agree to the terms
              outlined in this Policy.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-4">2. Digital Service Delivery</h2>
            <p className="text-gray-300 mb-4">
              Wild Mind AI provides no physical goods, shipments, or tangible products of any kind. All services,
              including AI model access, generation capabilities, API usage, subscriptions, and credit purchases, are
              delivered digitally through the platform or its associated systems.
            </p>
            <p className="text-gray-300">
              Delivery is considered complete when:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Your account is successfully created and activated;</li>
              <li>Your purchased credits are added to your account;</li>
              <li>Your subscription plan becomes active; or</li>
              <li>You receive access to the platform’s AI tools, APIs, and generation features.</li>
            </ul>
            <p className="text-gray-300 mt-4">
              All digital services are accessible immediately unless an isolated system delay occurs due to maintenance
              or provider-side issues.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-4">3. Delivery Timeframes</h2>
            <p className="text-gray-300 mb-4">
              Access to Wild Mind AI’s services is generally instantaneous. Typical delivery conditions include:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>
                <strong>Account Creation:</strong> Available immediately after registration.
              </li>
              <li>
                <strong>Credit Purchases:</strong> Credits are allocated instantly upon payment confirmation.
              </li>
              <li>
                <strong>Subscription Activation:</strong> Subscriptions become active immediately after the transaction
                is successfully completed.
              </li>
              <li>
                <strong>API Access:</strong> API keys and model endpoints become available upon activation of the
                account or subscription.
              </li>
            </ul>
            <p className="text-gray-300 mt-4">
              In rare cases where technical delays occur, users are encouraged to contact support for assistance.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-4">4. Delivery Confirmation</h2>
            <p className="text-gray-300 mb-4">
              Delivery confirmation is established through one or more of the following:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>System logs showing credit allocation or activation;</li>
              <li>Automated emails confirming payment or subscription activation (where applicable);</li>
              <li>Successful login and access to platform features; and</li>
              <li>Dashboard visibility of purchased balances or API keys.</li>
            </ul>
            <p className="text-gray-300 mt-4">
              These confirmations collectively serve as proof of digital delivery.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-4">5. Failure of Delivery</h2>
            <p className="text-gray-300 mb-4">
              If a user does not receive credits, subscription access, or platform availability following a successful
              transaction, the issue may be caused by temporary system errors or connectivity issues. In such cases,
              users should immediately contact support at
              {' '}
              <a href="mailto:connect@wildmindai.com">connect@wildmindai.com</a>
              {' '}
              with transaction details.
            </p>
            <p className="text-gray-300">
              Wild Mind AI will investigate the issue, and if the failure is confirmed to be caused by a system error,
              the Company will either deliver the missing services or process a refund in accordance with the Refund
              and Cancellation Policy.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-4">6. No Physical Shipping Obligations</h2>
            <p className="text-gray-300 mb-4">
              Because all services are fully digital:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>No shipping charges apply;</li>
              <li>No physical delivery timelines apply;</li>
              <li>No courier services are involved; and</li>
              <li>No tracking numbers or physical delivery confirmations are issued.</li>
            </ul>
            <p className="text-gray-300 mt-4">
              Any references to “delivery,” “service activation,” or “receipt of service” in this Policy refer
              exclusively to digital access.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-4">7. Contact for Delivery Assistance</h2>
            <p className="text-gray-300 mb-4">
              For issues related to delivery, activation, or access, users may contact:
            </p>
            <p className="text-gray-300">
              Wild Mind AI — Support Team
              <br />
              Email:
              {' '}
              <a href="mailto:connect@wildmindai.com">connect@wildmindai.com</a>
              <br />
              The support team operates 24 hours a day, 7 days a week.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
};

export default ShippingPage;

