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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Refund and Cancellation Policy</h1>
          <p className="text-xl text-gray-400">How refunds, cancellations, and credits work on Wild Mind AI</p>
        </div>

        <div className="prose prose-invert max-w-4xl space-y-8">
          <section>
            <h2 className="text-3xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-gray-300 mb-4">
              This Refund and Cancellation Policy outlines the conditions under which payments, credits, and
              subscriptions may be refunded or cancelled on the Wild Mind AI platform. Wild Mind AI operates
              exclusively as a digital, instantly delivered service, and as such, traditional refund norms for physical
              goods do not apply. The Company adopts a transparent and fair approach while ensuring protection against
              misuse, fraud, and unauthorized activity.
            </p>
            <p className="text-gray-300">
              By creating an account, purchasing credits, subscribing to a plan, or using the platform, you acknowledge
              and agree to the terms set forth in this Policy.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-4">2. Digital Nature of Services</h2>
            <p className="text-gray-300 mb-4">
              All products and services offered by Wild Mind AI are digital, non-tangible, and delivered instantly upon
              successful payment, account activation, or credit allocation. Due to the immediate availability of
              digital content and API usage, refunds are generally restricted unless specific qualifying conditions are
              met.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-4">3. Refund Eligibility</h2>
            <p className="text-gray-300 mb-4">
              Refunds may be granted exclusively under the following circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>
                <strong>Duplicate Payment:</strong> If a user is charged twice for the same transaction, the duplicate
                amount may be refunded after verification.
              </li>
              <li>
                <strong>Technical Failure:</strong> If a system malfunction prevents the allocation of purchased
                credits, subscription activation, or API availability, a refund may be issued, provided that no credits
                associated with the purchase were consumed.
              </li>
              <li>
                <strong>Fraudulent Transactions:</strong> If a transaction is confirmed to be fraudulent after
                investigation, the payment may be refunded in accordance with applicable payment gateway regulations.
              </li>
              <li>
                <strong>Refund Request Within 24 Hours:</strong> Refunds may be considered if a refund request is
                submitted within twenty-four (24) hours of the original purchase, provided that no credits from the
                purchased package have been used.
              </li>
            </ul>
            <p className="text-gray-300 mt-4">
              The Company reserves the right to request transaction evidence, logs, or identity verification before
              processing refunds.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-4">4. Non-Refundable Situations</h2>
            <p className="text-gray-300 mb-4">
              Refunds will not be granted in the following circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Credits that have already been consumed, regardless of the type or quality of output generated.</li>
              <li>Subscription fees for billing periods that have already commenced.</li>
              <li>
                Situations where the user is dissatisfied with AI-generated output, as AI systems inherently produce
                variable, unpredictable, or subjective results.
              </li>
              <li>Requests submitted after twenty-four (24) hours from the time of purchase.</li>
              <li>Usage-based API calls where credits were deducted successfully.</li>
            </ul>
            <p className="text-gray-300 mt-4">
              These restrictions ensure fairness, prevent exploitation, and maintain platform integrity.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-4">5. Subscription Cancellations</h2>
            <p className="text-gray-300 mb-4">
              Users may cancel subscriptions at any time through one of the following methods:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Accessing the account settings section on the Wild Mind AI website, or</li>
              <li>Submitting a cancellation request via email to connect@wildmindai.com.</li>
            </ul>
            <p className="text-gray-300 mb-4">
              Cancellation stops future billing but does not entitle the user to a refund for charges already incurred.
              Upon cancellation, users will continue to retain access to remaining credits, benefits, and platform
              features until the end of the current billing cycle.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-4">6. API Usage and Credit-Based Refunds</h2>
            <p className="text-gray-300 mb-4">
              For API-based services, refunds are permitted only if credits were not consumed due to a verified system
              error attributable to Wild Mind AI. If credits were successfully deducted, the transaction is considered
              completed and non-refundable.
            </p>
            <p className="text-gray-300 mb-4">
              Refunds are not provided for incorrect, unexpected, or unsatisfactory model outputs, output variations
              inherent to generative AI, or failures arising from user-side implementation or integration issues.
            </p>
            <p className="text-gray-300">
              All API usage is logged and may be reviewed during refund assessments.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-4">7. Chargebacks</h2>
            <p className="text-gray-300 mb-4">
              If a chargeback is initiated through a financial institution or payment gateway, the associated user
              account may be immediately suspended. Any remaining credits, benefits, or API access may be permanently
              revoked.
            </p>
            <p className="text-gray-300">
              The Company reserves the right to ban accounts involved in unauthorized chargebacks or fraudulent
              activity. Reinstatement, if considered, shall occur only after full settlement of outstanding amounts.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-4">8. Refund Processing Timeline</h2>
            <p className="text-gray-300 mb-4">
              Approved refunds shall be processed within a reasonable timeframe as permitted by the respective payment
              gateway. Timelines may vary depending on banking institutions, transaction channels, and geographic
              regions.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-4">9. Contact for Refund and Cancellation Requests</h2>
            <p className="text-gray-300 mb-4">
              All refund or cancellation inquiries should be directed to:
            </p>
            <p className="text-gray-300">
              Wild Mind AI — Support Team
              <br />
              Email:
              {' '}
              <a href="mailto:connect@wildmindai.com">connect@wildmindai.com</a>
              <br />
              Users may be required to provide transaction IDs, account details, and relevant documentation for
              verification.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
};

export default CancellationRefundsPage;

