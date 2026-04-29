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
    if (!user) {
      router.replace('/');
    }
  }, [user, router]);

  if (!user) return null; // Prevent flash of content

  return <ProfileManagement initialUserData={user} />;
};

export default AccountManagementPage;
