import type { Metadata } from 'next';
import TermsOfServicePage from '@/app/view/Legal/components/TermsOfServicePage';

export const metadata: Metadata = {
  title: 'Terms and Conditions of Use | Wild Mind AI',
  description:
    'Review the terms and conditions that govern your use of the Wild Mind AI platform, APIs, subscriptions, and credits.',
};

export default function TermsPage() {
  return <TermsOfServicePage />;
}

