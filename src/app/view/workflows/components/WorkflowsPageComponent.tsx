'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WorkflowsView from './WorkflowsView';
import WorkflowModal from './WorkflowModal';


import { WORKFLOWS_DATA } from './data';

interface Workflow {
  id: string;
  title: string;
  category: string;
  description: string;
  model: string;
  thumbnail: string;
  sampleBefore: string;
  sampleAfter: string;
}

export function WorkflowsPageComponent({ initialCategory = 'All', basePath = '/view/workflows', initialWorkflowId, initialWorkflow, workflows }: { initialCategory?: string; basePath?: string; initialWorkflowId?: string; initialWorkflow?: Workflow; workflows?: any[] }) {
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (initialWorkflow) {
      setSelectedWorkflow(initialWorkflow);
      setIsModalOpen(true);
      document.body.style.overflow = 'hidden';
    } else if (initialWorkflowId) {
      const found = WORKFLOWS_DATA.find(w => w.id === initialWorkflowId);
      if (found) {
        setSelectedWorkflow(found as any);
        setIsModalOpen(true);
        document.body.style.overflow = 'hidden';
      }
    }
  }, [initialWorkflowId, initialWorkflow]);

  const openWorkflowModal = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const router = useRouter(); // Import useRouter at top level if not present, need to check imports

  const closeWorkflowModal = () => {
    if (selectedWorkflow) {
      // Slugify logic consistent with View: lowercase, replace non-alphanumeric with dash
      const categorySlug = selectedWorkflow.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '').trim();
      router.push(`/view/workflows/${categorySlug}`);
    }
    setIsModalOpen(false);
    setTimeout(() => setSelectedWorkflow(null), 300);
    document.body.style.overflow = 'unset';
  };

  return (
    <div className="min-h-screen bg-[#07070B] text-white font-sans selection:bg-white/10 selection:text-white overflow-x-hidden relative">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }}></div>
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-blue-600/[0.03] rounded-full blur-[120px]"></div>
      </div>

      <main className="relative z-10 pt-1 pb-32 px-2 sm:px-6 md:px-24 min-h-screen">
        <div className="w-full">
          <WorkflowsView openModal={openWorkflowModal} initialCategory={initialCategory} basePath={basePath} workflows={workflows as any} />
        </div>
      </main>

      {/* Modal removed to use generic or redirect logic. SelfieVideo is now a separate page. */}
      <WorkflowModal isOpen={isModalOpen} onClose={closeWorkflowModal} workflowData={selectedWorkflow} />
    </div>
  );
}
