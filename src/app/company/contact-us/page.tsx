import { Metadata } from 'next';
import ContactUsPage from '@/app/view/Company/components/ContactUsPage';

export const metadata: Metadata = {
  title: 'Contact Us | WildMind AI',
  description: 'Get in touch with WildMind AI Technologies Pvt. Ltd. Contact us for support, inquiries, or partnerships.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Contact Us | WildMind AI',
    description: 'Get in touch with WildMind AI Technologies Pvt. Ltd.',
    type: 'website',
  },
};

export default function ContactUs() {
  return <ContactUsPage />;
}

