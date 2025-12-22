import type { Metadata } from 'next';
import PrivacyPolicyPage from '@/app/view/Legal/components/PrivacyPolicyPage';

export const metadata: Metadata = {
  title: 'Privacy Policy | Wild Mind AI',
  description:
    'Learn how Wild Mind AI collects, uses, and protects your personal data across the platform, APIs, and associated services.',
};

export default function PrivacyPage() {
  return <PrivacyPolicyPage />;
}

