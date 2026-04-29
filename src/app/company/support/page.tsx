import { Metadata } from 'next';
import ContactUsPage from '@/app/view/Company/components/ContactUsPage';

export const metadata: Metadata = {
  title: 'Support | WildMind AI',
  description: 'Get support from the WildMind AI team for billing, account, and product help.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Support | WildMind AI',
    description: 'Get support from the WildMind AI team for billing, account, and product help.',
    type: 'website',
  },
};

export default function SupportPage() {
  return <ContactUsPage initialSupportOpen={true} />;
}
