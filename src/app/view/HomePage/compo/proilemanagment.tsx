'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getApiClient } from '@/lib/axiosInstance';
import { getMeCached } from '@/lib/me';
import { onCreditsRefresh } from '@/lib/creditsBus';
import { ArrowLeft } from 'lucide-react';

interface UserData {
  uid: string;
  email: string;
  username: string;
  photoURL?: string;
  displayName?: string;
  provider: string;
  createdAt?: string;
  emailVerified?: boolean;
  isActive?: boolean;
  lastLoginAt?: string;
  loginCount?: number;
  lastLoginIP?: string;
  userAgent?: string;
  credits?: number;
  plan?: string;
  metadata?: {
    accountStatus: string;
    roles: string[];
  };
  preferences?: {
    theme: string;
    language: string;
  };
  deviceInfo?: {
    os: string;
    browser: string;
    device: string;
  };
}

const ProfileManagement = () => {
  const router = useRouter();
  // const fileInputRef = useRef<HTMLInputElement>(null); // DISABLED
  
  // State management
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  
  // Edit states
  // Username editing states - DISABLED
  // const [isEditingUsername, setIsEditingUsername] = useState(false);
  // const [editedUsername, setEditedUsername] = useState('');
  // const [usernameError, setUsernameError] = useState('');
  
  // Upload states - DISABLED
  // const [uploadingPhoto, setUploadingPhoto] = useState(false);
  // const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('user');
        
        if (!token) {
          router.push('/view/signup');
          return;
        }

        // Parse token if needed
        let authToken = token;
        try {
          const userObj = JSON.parse(token);
          authToken = userObj.token || userObj.idToken;
        } catch {
          // Token is already a string
        }

  const api = getApiClient();
  const userData = await getMeCached();
        try { console.log('[PublicGen][me] plan:', userData?.plan, 'canTogglePublicGenerations:', (userData as any)?.canTogglePublicGenerations, 'forcePublicGenerations:', (userData as any)?.forcePublicGenerations) } catch {}
        setUserData(userData);
        // setEditedUsername(userData.username || ''); // DISABLED
        
        // Initialize public flag (same logic as Nav.tsx)
        try {
          const stored = localStorage.getItem('isPublicGenerations');
          const server = userData && (userData as any).isPublic;
          const next = (stored != null) ? (stored === 'true') : (server !== undefined ? Boolean(server) : false);
          setIsPublic(next);
        } catch {}

        // Fetch credits
        try {
          const creditsRes = await api.get('/api/credits/me');
          const creditsPayload = creditsRes.data?.data || creditsRes.data;
          const balance = Number(creditsPayload?.creditBalance);
          if (!Number.isNaN(balance)) setCreditBalance(balance);
        } catch (e) {
          // silent fail
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        router.push('/view/signup');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  // Listen for credits refresh
  useEffect(() => {
    const api = getApiClient();
    const unsubscribe = onCreditsRefresh(async () => {
      try {
        const creditsRes = await api.get('/api/credits/me');
        const creditsPayload = creditsRes.data?.data || creditsRes.data;
        const balance = Number(creditsPayload?.creditBalance);
        if (!Number.isNaN(balance)) setCreditBalance(balance);
      } catch {}
    });
    return unsubscribe;
  }, []);

  // Handle username editing - DISABLED
  // const handleEditUsername = () => {
  //   setIsEditingUsername(true);
  //   setUsernameError('');
  // };

  // const handleCancelUsernameEdit = () => {
  //   setIsEditingUsername(false);
  //   setEditedUsername(userData?.username || '');
  //   setUsernameError('');
  // };

  // const handleSaveUsername = async () => {
  //   if (!editedUsername.trim()) {
  //     setUsernameError('Username cannot be empty');
  //     return;
  //   }

  //   if (editedUsername === userData?.username) {
  //     setIsEditingUsername(false);
  //     return;
  //   }

  //   setSaving(true);
  //   try {
  //     const api = getApiClient();
  //     await api.patch('/api/auth/me', { username: editedUsername.trim() });
      
  //     setUserData(prev => prev ? { ...prev, username: editedUsername.trim() } : null);
  //     setIsEditingUsername(false);
  //     setUsernameError('');
  //   } catch (error: any) {
  //     console.error('Error updating username:', error);
  //     setUsernameError(error.response?.data?.message || 'Failed to update username');
  //   } finally {
  //     setSaving(false);
  //   }
  // };

  // Handle profile picture upload - DISABLED
  // const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = event.target.files?.[0];
  //   if (!file) return;

  //   // Validate file type
  //   if (!file.type.startsWith('image/')) {
  //     alert('Please select an image file');
  //     return;
  //   }

  //   // Validate file size (5MB limit)
  //   if (file.size > 5 * 1024 * 1024) {
  //     alert('File size must be less than 5MB');
  //     return;
  //   }

  //   // Create preview
  //   const reader = new FileReader();
  //   reader.onload = (e) => {
  //     setPreviewUrl(e.target?.result as string);
  //   };
  //   reader.readAsDataURL(file);
  // };

  // const handleRemovePhoto = () => {
  //   setPreviewUrl(null);
  //   if (fileInputRef.current) {
  //     fileInputRef.current.value = '';
  //   }
  // };

  // const handleSavePhoto = async () => {
  //   if (!previewUrl) return;

  //   setUploadingPhoto(true);
  //   try {
  //     // Convert preview URL to file
  //     const response = await fetch(previewUrl);
  //     const blob = await response.blob();
  //     const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' });

  //     // Create form data
  //     const formData = new FormData();
  //     formData.append('profilePicture', file);

  //     // Upload to backend
  //     const api = getApiClient();
  //     const uploadResponse = await api.post('/api/auth/upload-profile-picture', formData, {
  //       headers: {
  //         'Content-Type': 'multipart/form-data',
  //       },
  //     });

  //     // Update user data with new photo URL
  //     const newPhotoURL = uploadResponse.data.data?.photoURL || uploadResponse.data.photoURL;
  //     setUserData(prev => prev ? { ...prev, photoURL: newPhotoURL } : null);
  //     setAvatarFailed(false);
  //     setPreviewUrl(null);
      
  //     if (fileInputRef.current) {
  //       fileInputRef.current.value = '';
  //     }
  //   } catch (error: any) {
  //     console.error('Error uploading photo:', error);
  //     alert(error.response?.data?.message || 'Failed to upload photo');
  //   } finally {
  //     setUploadingPhoto(false);
  //   }
  // };

  // Handle public generations toggle (same as Nav.tsx)
  const handleTogglePublic = async () => {
    const next = !isPublic;
    setIsPublic(next);
    try {
      const api = getApiClient();
      await api.patch('/api/auth/me', { isPublic: next });
    } catch {}
    try { localStorage.setItem('isPublicGenerations', String(next)); } catch {}
  };

  // Handle back navigation
  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#07070B] flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-transparent border-t-[#1C303D] dark:border-t-white/80 animate-spin drop-shadow-sm" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#FFFFFF] dark:bg-[#07070B] text-gray-900 dark:text-white p-3 md:p-5 transition-colors duration-300">
      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white">Account Settings</h1>
        </div>

        {/* Rounded main wrapper */}
        <div className="rounded-3xl">
          {/* Header card */}
          <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-gradient-to-br from-[#0E1A22] via-[#101722] to-[#0B0F14] p-5 md:p-6 mb-5 shadow-xl">
            <div className="flex items-center gap-4 md:gap-5">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden border border-white/20">
                {(userData?.photoURL && !avatarFailed) ? (
                  <img src={userData.photoURL} alt="Profile" referrerPolicy="no-referrer" onError={() => setAvatarFailed(true)} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-semibold text-xl md:text-2xl">{(userData?.username || 'U').charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-lg md:text-xl truncate">{userData?.username || 'User'}</div>
                <div className="text-white/70 text-xs md:text-sm truncate">{userData?.email || 'user@example.com'}</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs bg-white/10 text-white border border-white/10">Plan: {userData?.plan || 'Free'}</span>
                  <span className="px-2.5 py-1 rounded-full text-xs bg-white/10 text-white border border-white/10 flex items-center gap-1">
                    <Image src="/icons/coinswhite.svg" alt="credits" width={14} height={14} className="dark:brightness-100" />
                    {creditBalance ?? userData?.credits ?? 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Info grid */}
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0F1419] p-4 md:p-5 mb-5">
            <h2 className="text-gray-900 dark:text-white text-base md:text-lg font-semibold mb-3">Profile Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">Username</label>
                <div className="px-3 py-2 bg-gray-100 dark:bg-[#11161C] border border-gray-300 dark:border-white/20 rounded-2xl text-gray-900 dark:text-white text-sm">{userData?.username || 'No username'}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">Email Address</label>
                <div className="px-3 py-2 bg-gray-50 dark:bg-[#11161C] border border-gray-200 dark:border-white/10 rounded-2xl text-gray-600 dark:text-gray-300 text-sm truncate">{userData?.email || 'No email'}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">Account Status</label>
                <div className="flex items-center gap-2.5">
                  <span className="px-3 py-2 bg-gray-50 dark:bg-[#11161C] border border-gray-200 dark:border-white/10 rounded-2xl text-gray-600 dark:text-gray-300 text-xs">{userData?.metadata?.accountStatus || 'Active'}</span>
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">Member Since</label>
                <div className="px-3 py-2 bg-gray-50 dark:bg-[#11161C] border border-gray-200 dark:border-white/10 rounded-2xl text-gray-600 dark:text-gray-300 text-sm">{userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'Unknown'}</div>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0F1419] p-4 md:p-5 mb-5">
            <h2 className="text-gray-900 dark:text-white text-base md:text-lg font-semibold mb-3">Preferences</h2>
            <div className="bg-gray-50 dark:bg-[#11161C] rounded-2xl p-4 border border-gray-200 dark:border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-gray-900 dark:text-white font-semibold text-sm mb-1">Make Generations Public</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-xs">Allow others to see your generated content on the public feed</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isPublic}
                  aria-label="Make Generations Public"
                  onClick={handleTogglePublic}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleTogglePublic(); } }}
                  tabIndex={0}
                  className={`relative z-10 w-12 h-6 rounded-full transition-colors cursor-pointer outline-none ${isPublic ? 'bg-blue-500 dark:bg-blue-600' : 'bg-gray-300 dark:bg-white/20'}`}
                >
                  <span className={`block w-5 h-5 bg-white dark:bg-white rounded-full shadow-md transition-transform transform ${isPublic ? 'translate-x-6' : 'translate-x-0.5'} relative top-0`} />
                </button>
              </div>
            </div>
          </div>
         
          {/* Action Buttons */}
          <div className="flex gap-3 mt-5">
            
            <button
              onClick={() => router.push('/view/pricing')}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#1C303D] hover:bg-blue-700 rounded-full transition-colors font-medium text-sm text-white"
            >
              <Image src="/icons/coinswhite.svg" alt="credits" width={18} height={18} />
              Upgrade Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileManagement;