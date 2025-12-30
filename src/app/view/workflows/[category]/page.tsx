'use client';

import { WorkflowsPageComponent } from '../WorkflowsPageComponent';
import { CATEGORIES } from '../data';

type CategoryParam = { category: string };

const slugToCategory = (slug: string) => {
  const normalized = (slug || '').toLowerCase();
  const match = CATEGORIES.find((cat) => cat.toLowerCase().replace(/[^a-z0-9]+/g, '') === normalized);
  return match || 'All';
};

export default async function CategoryWorkflowsPage({ params }: { params: Promise<CategoryParam> }) {
  const resolvedParams = await params;
  const category = slugToCategory(resolvedParams?.category || '');
  return <WorkflowsPageComponent initialCategory={category} basePath="/view/workflows" />;
}
