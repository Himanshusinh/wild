'use client';

import { useState } from 'react';
import WorkflowsView from './WorkflowsView';
import WorkflowModal from './WorkflowModal';
import SelfieVideoModal from './components/selfieVideo';

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

export function WorkflowsPageComponent({ initialCategory = 'All', basePath = '/view/workflows' }: { initialCategory?: string; basePath?: string }) {
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const openWorkflowModal = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeWorkflowModal = () => {
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

      <main className="relative z-10 pt-1 pb-32 px-10 sm:px-6 md:px-24 min-h-screen">
        <div className="w-full">
          <WorkflowsView openModal={openWorkflowModal} initialCategory={initialCategory} basePath={basePath} />
        </div>
      </main>

      {selectedWorkflow?.id === 'selfie-video' ? (
        <SelfieVideoModal isOpen={isModalOpen} onClose={closeWorkflowModal} workflowData={selectedWorkflow} />
      ) : (
        <WorkflowModal isOpen={isModalOpen} onClose={closeWorkflowModal} workflowData={selectedWorkflow} />
      )}
    </div>
  );
}
