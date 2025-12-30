'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import SelfieVideoModal from '../components/selfieVideo';
import { WORKFLOWS_DATA } from '../data';

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

export default function SelfieVideoPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const workflow = useMemo<Workflow | null>(() => {
    const found = WORKFLOWS_DATA.find((w) => w.id === 'selfie-video');
    return found ? (found as Workflow) : null;
  }, []);

  useEffect(() => {
    if (mounted && !workflow) {
      router.replace('/view/workflows');
    }
  }, [mounted, workflow, router]);

  if (!mounted || !workflow) return null;

  return (
    <SelfieVideoModal
      isOpen
      onClose={() => router.push('/viraltrend')}
      workflowData={workflow}
    />
  );
}
