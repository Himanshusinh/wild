import { getImageUrl } from '../routes';

export interface WorkflowCard {
  title: string;
  src: string;
}

export const workflowCards: WorkflowCard[] = [
  {
    title: 'Designing',
    src: getImageUrl('workflow', 'designing')
  },
  {
    title: 'Film Making',
    src: getImageUrl('workflow', 'filmMaking')
  },
  {
    title: 'Printing',
    src: getImageUrl('workflow', 'printing')
  },
  {
    title: 'Branding',
    src: getImageUrl('workflow', 'branding')
  },
  {
    title: 'Content Creation',
    src: getImageUrl('workflow', 'contentCreation')
  },
  {
    title: 'Art Direction',
    src: getImageUrl('workflow', 'artDirection')
  },
  {
    title: 'Marketing',
    src: getImageUrl('workflow', 'marketing')
  },
  {
    title: 'Photography',
    src: getImageUrl('workflow', 'photography')
  }
];
