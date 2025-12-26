'use client';

import { WorkflowsPageComponent } from '../page';
import { CATEGORIES } from '../data';

const slugToCategory = (slug: string) => {
  const normalized = (slug || '').toLowerCase();
  const match = CATEGORIES.find((cat) => cat.toLowerCase().replace(/[^a-z0-9]+/g, '') === normalized);
  return match || 'All';
};

export default function CategoryWorkflowsPage({ params }: { params: { category: string } }) {
  const category = slugToCategory(params?.category || '');
  return <WorkflowsPageComponent initialCategory={category} basePath="/view/workflows" />;
}
