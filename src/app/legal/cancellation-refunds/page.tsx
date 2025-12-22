import type { Metadata } from 'next';
import CancellationRefundsPage from '@/app/view/Legal/components/CancellationRefundsPage';

export const metadata: Metadata = {
  title: 'Refund and Cancellation Policy | Wild Mind AI',
  description:
    'Read the Wild Mind AI refund and cancellation terms for credits, subscriptions, and API-based services.',
};

export default function CancellationRefunds() {
  return <CancellationRefundsPage />;
}

