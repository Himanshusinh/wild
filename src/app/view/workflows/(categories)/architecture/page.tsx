'use client';
import { WorkflowsPageComponent } from '../../components/WorkflowsPageComponent';
import { DATA } from './data';

export default function Page() {
  return (
    <WorkflowsPageComponent 
      initialCategory="Architecture" 
      workflows={DATA} 
      basePath="/view/workflows" 
    />
  );
}
