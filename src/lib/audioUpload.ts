import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { initializeApp } from 'firebase/app';

// Firebase config (you may need to adjust this based on your existing setup)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export async function downloadAudioAsBlob(url: string): Promise<Blob> {
  try {
    console.log('🎵 Downloading audio from URL:', url);
    
    // Use our backend proxy to avoid CORS issues
    const response = await fetch('/api/download-audio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error(`Failed to download audio: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    console.log('✅ Audio downloaded successfully, size:', blob.size);
    return blob;
  } catch (error) {
    console.error('❌ Error downloading audio from', url, ':', error);
    throw error;
  }
}

export async function uploadAudioToFirebase(
  audioBlob: Blob,
  fileName: string
): Promise<{ url: string; storagePath: string }> {
  try {
    console.log('🎵 Uploading audio to Firebase...');
    console.log('📁 File name:', fileName);
    console.log('📏 File size:', audioBlob.size, 'bytes');

    const storageRef = ref(storage, `generated-audio/${fileName}`);
    const snapshot = await uploadBytes(storageRef, audioBlob);
    
    console.log('✅ Audio uploaded to Firebase Storage');
    console.log('📍 Storage path:', snapshot.metadata.fullPath);
    
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('🔗 Download URL:', downloadURL);

    return {
      url: downloadURL,
      storagePath: snapshot.metadata.fullPath,
    };
  } catch (error) {
    console.error('❌ Error uploading audio to Firebase:', error);
    throw error;
  }
}

export async function uploadGeneratedAudio(
  audioData: string,
  audioId: string,
  outputFormat: 'hex' | 'url' = 'hex'
): Promise<{ id: string; url: string; originalUrl: string; firebaseUrl: string }> {
  try {
    console.log('🎵 Starting audio upload to Firebase...');
    console.log('=== UPLOADING SINGLE AUDIO TO FIREBASE ===');
    console.log('Audio ID:', audioId);
    console.log('Output format:', outputFormat);

    let audioBlob: Blob;
    let originalUrl = '';

    if (outputFormat === 'url') {
      // If it's a URL, download it first
      originalUrl = audioData;
      audioBlob = await downloadAudioAsBlob(audioData);
    } else {
      // If it's hex, convert to blob
      originalUrl = `hex:${audioData.substring(0, 50)}...`;
      const hexString = audioData;
      const bytes = new Uint8Array(hexString.length / 2);
      for (let i = 0; i < hexString.length; i += 2) {
        bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
      }
      audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
    }

    const fileName = `${audioId}_${Date.now()}.mp3`;
    const { url: firebaseUrl } = await uploadAudioToFirebase(audioBlob, fileName);

    console.log('✅ Audio uploaded to Firebase:', {
      id: audioId,
      url: firebaseUrl,
      originalUrl,
      firebaseUrl,
    });

    return {
      id: audioId,
      url: firebaseUrl,
      originalUrl,
      firebaseUrl,
    };
  } catch (error) {
    console.error('❌ Error uploading audio to Firebase:', error);
    // Return fallback data if upload fails
    return {
      id: audioId,
      url: audioData,
      originalUrl: audioData,
      firebaseUrl: audioData,
    };
  }
}
