import { WorkflowsPageComponent } from './components/WorkflowsPageComponent';

export default function WorkflowsPage() {
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
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white/10 selection:text-white overflow-x-hidden relative">
      {/* Main Content */}
      <main className="relative z-10 pt-4 pb-32 px-4 sm:px-6 md:px-8 min-h-screen">
        <div className="w-full">
          <WorkflowsView openModal={openWorkflowModal} />
        </div>
      </main>

      {/* Modal - Conditionally render based on workflow type */}
      {selectedWorkflow?.id === 'selfie-video' ? (
        <SelfieVideoModal isOpen={isModalOpen} onClose={closeWorkflowModal} workflowData={selectedWorkflow} />
      ) : (
        <WorkflowModal isOpen={isModalOpen} onClose={closeWorkflowModal} workflowData={selectedWorkflow} />
      )}
    </div>
  );
}
