'use client';
import { WorkflowsPageComponent } from '../../components/WorkflowsPageComponent';
import { DATA } from './data';

export default function Page() {
  return (
    <WorkflowsPageComponent 
      initialCategory="Fun" 
      workflows={DATA} 
      basePath="/view/workflows" 
    />
  );
}
