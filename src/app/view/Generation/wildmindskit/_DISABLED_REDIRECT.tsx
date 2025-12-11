import { redirect } from 'next/navigation';

export default function WildMindSkitDisabled() {
  redirect('/not-found');
}
