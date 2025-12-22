'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getImageUrl } from '@/routes/imageroute';
import { COMPANY_ROUTES, PRODUCT_ROUTES } from '@/routes/routes';

const AboutPage: React.FC = () => {
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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About WildMind AI</h1>
          <p className="text-xl text-gray-400">Transforming imagination into reality through AI</p>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-4xl space-y-8">
          <section>
            <h2 className="text-3xl font-semibold mb-4">Our Mission</h2>
            <p className="text-gray-300 mb-4">
              At WildMind AI, we believe that creativity should be accessible to everyone. Our mission is to 
              democratize content creation by providing powerful, intuitive AI tools that empower creators, 
              businesses, and individuals to bring their visions to life.
            </p>
            <p className="text-gray-300">
              We're committed to pushing the boundaries of what's possible with generative AI, continuously 
              innovating to deliver cutting-edge solutions that inspire and enable creative expression.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-4">What We Do</h2>
            <p className="text-gray-300 mb-4">
              WildMind AI is a comprehensive platform for AI-powered content generation. We offer a suite of 
              tools that enable users to create:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>Stunning AI-generated images from text prompts</li>
              <li>High-quality videos and animations</li>
              <li>Original music and audio content</li>
              <li>Professional logos and branding materials</li>
              <li>Product mockups and visualizations</li>
              <li>And much more</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-4">Our Technology</h2>
            <p className="text-gray-300 mb-4">
              We leverage state-of-the-art AI models and proprietary technology to deliver exceptional results. 
              Our platform combines multiple AI systems to provide the best possible output quality while 
              maintaining fast generation times and competitive pricing.
            </p>
            <p className="text-gray-300">
              Our commitment to innovation means we're constantly exploring new models, techniques, and features 
              to enhance the creative experience for our users.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-4">Join Us</h2>
            <p className="text-gray-300 mb-6">
              Whether you're a creative professional, a business looking to scale content production, or someone 
              exploring the possibilities of AI, we'd love to have you as part of the WildMind AI community.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link 
                href={PRODUCT_ROUTES.PRICING}
                className="px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-semibold"
              >
                Get Started
              </Link>
              <Link 
                href={COMPANY_ROUTES.CAREERS}
                className="px-6 py-3 border border-white text-white rounded-lg hover:bg-white hover:text-black transition-colors font-semibold"
              >
                View Careers
              </Link>
              <Link 
                href={COMPANY_ROUTES.CONTACT}
                className="px-6 py-3 border border-white text-white rounded-lg hover:bg-white hover:text-black transition-colors font-semibold"
              >
                Contact Us
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default AboutPage;

