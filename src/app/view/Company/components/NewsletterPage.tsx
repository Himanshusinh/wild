'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getImageUrl } from '@/routes/imageroute';

const NewsletterPage: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement newsletter subscription
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Newsletter</h1>
          <p className="text-xl text-gray-400">Stay updated with the latest from WildMind AI</p>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-2xl space-y-8">
          <section>
            <h2 className="text-3xl font-semibold mb-4">Subscribe to Our Newsletter</h2>
            <p className="text-gray-300 mb-6">
              Get the latest updates on new features, AI advancements, creative tips, and exclusive offers 
              delivered straight to your inbox.
            </p>
          </section>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-white"
                  placeholder="your.email@example.com"
                />
              </div>
              <button
                type="submit"
                className="w-full px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-semibold"
              >
                Subscribe
              </button>
            </form>
          ) : (
            <div className="p-6 bg-gray-900 border border-gray-800 rounded-lg">
              <p className="text-gray-300">
                Thank you for subscribing! We've sent a confirmation email to {email}. 
                Please check your inbox to confirm your subscription.
              </p>
            </div>
          )}

          <section>
            <h2 className="text-2xl font-semibold mb-4">What to Expect</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>Weekly updates on new features and improvements</li>
              <li>Tips and tutorials for getting the most out of WildMind AI</li>
              <li>Exclusive offers and early access to new tools</li>
              <li>Insights into the latest AI and creative technology trends</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
};

export default NewsletterPage;

