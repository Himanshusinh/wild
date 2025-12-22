import type { Metadata } from 'next';
import AboutPage from '@/app/view/Company/components/AboutPage';

export const metadata: Metadata = {
  title: 'About Wild Mind AI',
  description:
    'Learn about Wild Mind AI, our mission to democratize creativity with generative AI, and how we help creators and businesses.',
};

export default function About() {
  return <AboutPage />;
}

