'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getImageUrl } from '@/routes/imageroute';
import { LEGAL_ROUTES } from '@/routes/routes';

const PrivacyPage: React.FC = () => {
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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy</h1>
          <p className="text-xl text-gray-400">How we protect your privacy</p>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-4xl space-y-8">
          <section>
            <h2 className="text-3xl font-semibold mb-4">Your Privacy Matters</h2>
            <p className="text-gray-300 mb-4">
              At WildMind AI, we are committed to protecting your privacy and personal information. We understand 
              the importance of data security and take measures to ensure your information is handled responsibly.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-4">Information We Collect</h2>
            <p className="text-gray-300 mb-4">
              We collect information necessary to provide and improve our services, including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Account information (email, name)</li>
              <li>Payment information (processed securely through third-party providers)</li>
              <li>Usage data to improve our services</li>
              <li>Content you generate (stored securely on our servers)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-4">How We Use Your Information</h2>
            <p className="text-gray-300 mb-4">
              We use your information to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Provide and maintain our services</li>
              <li>Process payments and manage subscriptions</li>
              <li>Improve our platform and user experience</li>
              <li>Communicate with you about your account</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-4">Data Security</h2>
            <p className="text-gray-300 mb-4">
              We implement industry-standard security measures to protect your personal information. This includes 
              encryption, secure data storage, and regular security audits.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-4">Your Rights</h2>
            <p className="text-gray-300 mb-4">
              You have the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Access your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of marketing communications</li>
              <li>Export your data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-4">Full Privacy Policy</h2>
            <p className="text-gray-300 mb-4">
              For complete details about our privacy practices, data collection, and your rights, please review our 
              comprehensive Privacy Policy.
            </p>
            <Link 
              href={LEGAL_ROUTES.PRIVACY}
              className="inline-block px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-semibold"
            >
              View Full Privacy Policy
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
};

export default PrivacyPage;

