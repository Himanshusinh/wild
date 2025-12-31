import { WorkflowsPageComponent } from '../../components/WorkflowsPageComponent';
import { CATEGORIES, WORKFLOWS_DATA } from '../../components/data';

type CategoryParam = { category: string };

export default async function Page({ params }: { params: Promise<CategoryParam> }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.category || '';
  const normalized = (slug || '').toLowerCase();

  // 1. Check if slug matches a category
  // Use same slugify logic as WorkflowsView (lowercase, dashes) but reverse for matching
  const categoryMatch = CATEGORIES.find((cat) => cat.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '').trim() === normalized);

  if (categoryMatch) {
    return <WorkflowsPageComponent initialCategory={categoryMatch} basePath="/view/workflows" />;
  }

  // 2. Check if slug matches a workflow ID (e.g. "creatively-upscale")
  const workflowMatch = WORKFLOWS_DATA.find(w => w.id === slug || w.id.toLowerCase() === normalized);

  if (workflowMatch) {
    return (
      <WorkflowsPageComponent
        initialCategory={workflowMatch.category}
        initialWorkflowId={workflowMatch.id}
        initialWorkflow={workflowMatch}
        basePath="/view/workflows"
      />
    );
  }

  // 3. Fallback to All if not found
  return <WorkflowsPageComponent initialCategory="All" basePath="/view/workflows" />;
}
