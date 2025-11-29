'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getImageUrl } from '@/routes/imageroute';
import { LEGAL_ROUTES } from '@/routes/routes';

const TermsConditionsPage: React.FC = () => {
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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms and Conditions</h1>
          <p className="text-xl text-gray-400">Terms of use for WildMind AI services</p>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-4xl space-y-8">
          <section>
            <h2 className="text-3xl font-semibold mb-4">Agreement to Terms</h2>
            <p className="text-gray-300 mb-4">
              By accessing and using WildMind AI services, you agree to be bound by these Terms and Conditions. 
              If you do not agree to these terms, please do not use our services.
            </p>
            <p className="text-gray-300">
              We reserve the right to modify these terms at any time. Continued use of our services after changes 
              constitutes acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-4">Use of Service</h2>
            <p className="text-gray-300 mb-4">
              You agree to use WildMind AI services only for lawful purposes and in accordance with these Terms. 
              You are responsible for maintaining the confidentiality of your account credentials.
            </p>
            <p className="text-gray-300">
              Prohibited activities include but are not limited to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Violating any applicable laws or regulations</li>
              <li>Infringing on intellectual property rights</li>
              <li>Creating harmful, offensive, or illegal content</li>
              <li>Attempting to gain unauthorized access to our systems</li>
              <li>Interfering with or disrupting the service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-4">Intellectual Property</h2>
            <p className="text-gray-300 mb-4">
              All content generated using WildMind AI services belongs to you, subject to compliance with these Terms 
              and our Acceptable Use Policy. You retain ownership of your generated content.
            </p>
            <p className="text-gray-300">
              WildMind AI and its associated trademarks, logos, and service marks are the property of WildMind AI 
              and may not be used without our prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-4">Limitation of Liability</h2>
            <p className="text-gray-300 mb-4">
              WildMind AI provides services "as is" without warranties of any kind. We are not liable for any 
              indirect, incidental, or consequential damages arising from your use of our services.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-4">Related Documents</h2>
            <p className="text-gray-300 mb-4">
              For more detailed information, please review our complete legal documentation:
            </p>
            <div className="flex flex-wrap gap-4">
              <Link 
                href={LEGAL_ROUTES.TERMS}
                className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:border-white hover:text-white transition-colors"
              >
                Terms of Service
              </Link>
              <Link 
                href={LEGAL_ROUTES.PRIVACY}
                className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:border-white hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default TermsConditionsPage;

