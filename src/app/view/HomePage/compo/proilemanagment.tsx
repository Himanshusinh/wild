'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getApiClient } from '@/lib/axiosInstance';
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
        const response = await api.get('/api/auth/me');
        const responseData = response.data;
        
        const userData = responseData.data?.user || responseData.user || responseData;
        try { console.log('[PublicGen][me] plan:', userData?.plan, 'canTogglePublicGenerations:', (userData as any)?.canTogglePublicGenerations, 'forcePublicGenerations:', (userData as any)?.forcePublicGenerations) } catch {}
        setUserData(userData);
        // setEditedUsername(userData.username || ''); // DISABLED
        
        // Set public generations preference with plan gating
        try {
          const stored = localStorage.getItem('isPublicGenerations');
          const server = userData && (userData as any).isPublic;
          const planRaw = String(userData?.plan || '').toUpperCase();
          const canToggle = (userData as any)?.canTogglePublicGenerations === true || /(^|\b)PLAN\s*C\b/.test(planRaw) || /(^|\b)PLAN\s*D\b/.test(planRaw) || planRaw === 'C' || planRaw === 'D';
          const next = canToggle ? ((stored != null) ? (stored === 'true') : Boolean(server)) : true;
          if (!canToggle) { try { localStorage.setItem('isPublicGenerations', 'true') } catch {} }
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

  // Handle public generations toggle
  const handleTogglePublic = async () => {
    const planRaw = String(userData?.plan || '').toUpperCase();
    const canToggle = /(^|\b)PLAN\s*C\b/.test(planRaw) || /(^|\b)PLAN\s*D\b/.test(planRaw) || planRaw === 'C' || planRaw === 'D';
    if (!canToggle) {
      setIsPublic(true);
      try { localStorage.setItem('isPublicGenerations', 'true'); } catch {}
      return;
    }
    const next = !isPublic;
    setIsPublic(next);
    try { localStorage.setItem('isPublicGenerations', String(next)); } catch {}
  };

  // Handle back navigation
  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#07070B] flex items-center justify-center">
        <div className="text-gray-900 dark:text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#07070B] text-gray-900 dark:text-white p-6 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-6 mb-12">
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-4xl font-semibold text-gray-900 dark:text-white">Account Settings</h1>
        </div>

        {/* Profile Picture Section - READ ONLY */}
        <div className="bg-white/90 dark:bg-white/5 rounded-3xl p-8 mb-8 border border-gray-200 dark:border-white/10 shadow-sm">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Profile Picture</h2>
          
          <div className="flex items-center gap-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden border-4 border-gray-200 dark:border-white/20">
                {(userData?.photoURL && !avatarFailed) ? (
                  <img
                    src={userData.photoURL}
                    alt="Profile"
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-semibold text-3xl">
                    {(userData?.username || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1">
              <p className="text-gray-600 dark:text-gray-300 text-base mb-2">
                Profile picture cannot be changed
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Contact support if you need to update your profile picture
              </p>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-white/90 dark:bg-white/5 rounded-3xl p-8 mb-8 border border-gray-200 dark:border-white/10 shadow-sm">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Profile Information</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Username - READ ONLY */}
            <div>
              <label className="block text-base font-medium text-gray-600 dark:text-gray-300 mb-3">
                Username
              </label>
              <div className="px-4 py-3 bg-gray-100 dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg text-gray-900 dark:text-white text-base">
                {userData?.username || 'No username'}
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                Username cannot be changed
              </p>
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-base font-medium text-gray-600 dark:text-gray-300 mb-3">
                Email Address
              </label>
              <div className="px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-600 dark:text-gray-400 text-base">
                {userData?.email || 'No email'}
              </div>
            </div>

            {/* Account Status */}
            <div>
              <label className="block text-base font-medium text-gray-600 dark:text-gray-300 mb-3">
                Account Status
              </label>
              <div className="flex items-center gap-3">
                <span className="px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-600 dark:text-gray-400 text-base">
                  {userData?.metadata?.accountStatus || 'Active'}
                </span>
                <span className="w-3 h-3 bg-green-400 rounded-full"></span>
              </div>
            </div>

            {/* Member Since */}
            <div>
              <label className="block text-base font-medium text-gray-600 dark:text-gray-300 mb-3">
                Member Since
              </label>
              <div className="px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-600 dark:text-gray-400 text-base">
                {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'Unknown'}
              </div>
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="bg-white/90 dark:bg-white/5 rounded-3xl p-8 mb-8 border border-gray-200 dark:border-white/10 shadow-sm">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Account Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Credits */}
            <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-6 border border-gray-200 dark:border-white/10">
              <label className="block text-base font-medium text-gray-600 dark:text-gray-300 mb-3">
                Credits Balance
              </label>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {creditBalance ?? userData?.credits ?? 0}
                </span>
                <Image src="/icons/coinswhite.svg" alt="credits" width={24} height={24} className="dark:brightness-100 brightness-0" />
              </div>
            </div>

            {/* Active Plan */}
            <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-6 border border-gray-200 dark:border-white/10">
              <label className="block text-base font-medium text-gray-600 dark:text-gray-300 mb-3">
                Active Plan
              </label>
              <div className="text-xl font-semibold text-gray-900 dark:text-white">
                {userData?.plan || 'Free'}
              </div>
            </div>

            {/* Login Count - REMOVED */}
            {/* <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <label className="block text-base font-medium text-gray-300 mb-3">
                Total Logins
              </label>
              <div className="text-xl font-semibold text-white">
                {userData?.loginCount || 0}
              </div>
            </div> */}
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="bg-white/90 dark:bg-white/5 rounded-3xl p-8 mb-8 border border-gray-200 dark:border-white/10 shadow-sm">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Privacy Settings</h2>
          
          <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-6 border border-gray-200 dark:border-white/10">
            {/* Public Generations */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">Make Generations Public</h3>
                <p className="text-gray-600 dark:text-gray-400 text-base">
                  Allow others to see your generated content on the public feed
                </p>
              </div>
              <button
                type="button"
                aria-pressed={isPublic}
                onClick={handleTogglePublic}
                className={`w-16 h-8 rounded-full transition-colors ${isPublic ? 'bg-blue-500 dark:bg-blue-600' : 'bg-gray-300 dark:bg-white/20'}`}
              >
                <span className={`block w-7 h-7 bg-white dark:bg-white rounded-full shadow-md transition-transform transform ${isPublic ? 'translate-x-8' : 'translate-x-0.5'} relative top-0.5`} />
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-6 mt-8">
          <button
            onClick={handleBack}
            className="flex items-center gap-3 px-8 py-4 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 rounded-xl transition-colors font-medium text-lg text-gray-900 dark:text-white"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          
          <button
            onClick={() => router.push('/view/pricing')}
            className="flex items-center gap-3 px-8 py-4 bg-blue-500 hover:bg-blue-600 rounded-xl transition-colors font-medium text-lg text-white"
          >
            <Image src="/icons/coinswhite.svg" alt="credits" width={20} height={20} />
            Upgrade Plan
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileManagement;
