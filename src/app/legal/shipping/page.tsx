import type { Metadata } from 'next';
import ShippingPage from '@/app/view/Legal/components/ShippingPage';

export const metadata: Metadata = {
  title: 'Shipping and Delivery Policy | Wild Mind AI',
  description:
    'Understand how Wild Mind AI delivers digital services, including credits, subscriptions, and API access.',
};

export default function Shipping() {
  return <ShippingPage />;
}

