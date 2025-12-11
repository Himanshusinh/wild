'use client';

import React from 'react';
import Image from 'next/image';
import { getImageUrl } from '@/routes/imageroute';

const BlogPage: React.FC = () => {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10 flex items-center gap-3">
          <Image
            src={getImageUrl('core', 'logo') || '/placeholder.svg'}
            alt="WildMind Logo"
            width={40}
            height={40}
            className="h-10 w-auto"
          />
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Wild Mind AI Blog</h1>
            <p className="text-gray-400 text-sm md:text-base">
              News, product updates, and deep dives into AI creativity.
            </p>
          </div>
        </div>

        <section className="border border-white/10 rounded-2xl p-6 md:p-8 bg-gradient-to-b from-white/5 to-transparent">
          <h2 className="text-2xl font-semibold mb-3">Coming soon</h2>
          <p className="text-gray-300 mb-3">
            Our team is preparing articles on how to get the most out of Wild Mind AI, best practices for AI image and
            video generation, and behind-the-scenes stories from the product.
          </p>
          <p className="text-gray-400 text-sm">
            Stay tuned — this space will soon feature regular content to help you create faster and smarter with AI.
          </p>
        </section>
      </div>
    </main>
  );
};

export default BlogPage;
