'use client';

import { useAppSelector } from '@/store/hooks';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ProfileManagement from '../HomePage/compo/proilemanagment';

const AccountManagementPage = () => {
  const user = useAppSelector((state: any) => state.auth?.user);
  const router = useRouter();

  useEffect(() => {
    // Redirect if no user found (unauthenticated)
    // Small delay to allow Redux to hydrate if needed, though usually it's fast enough
    const timer = setTimeout(() => {
      if (!user) {
        router.replace('/');
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [user, router]);

  if (!user) return null; // Prevent flash of content

  return <ProfileManagement />;
};

export default AccountManagementPage;
