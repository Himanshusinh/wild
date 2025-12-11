import type { Metadata } from 'next';
import AUPPage from '@/app/view/Legal/components/AUPPage';

export const metadata: Metadata = {
  title: 'AI Usage Policy / Acceptable Use Policy | Wild Mind AI',
  description:
    'Read the Wild Mind AI Acceptable Use Policy (AUP) to understand what content and behaviours are allowed when using our AI tools and APIs.',
};

export default function AUPPageRoute() {
  return <AUPPage />;
}

