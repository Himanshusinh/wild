import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  orderBy, 
  limit, 
  where,
  Timestamp 
} from 'firebase/firestore';
import { HistoryEntry, HistoryEntryFirestore, HistoryFilters } from '@/types/history';

const HISTORY_COLLECTION = 'generationHistory';

/**
 * Converts Firestore document to HistoryEntry
 */
function convertFirestoreToHistoryEntry(doc: any): HistoryEntry {
  const data = doc.data() as HistoryEntryFirestore;
  return {
    ...data,
    id: doc.id,
    timestamp: (data.timestamp?.toDate?.() ? data.timestamp.toDate().toISOString() : data.createdAt),
  };
}

/**
 * Converts HistoryEntry to Firestore format
 */
function convertHistoryEntryToFirestore(entry: Omit<HistoryEntry, 'id'>): Omit<HistoryEntryFirestore, 'id'> {
  return {
    ...entry,
    timestamp: Timestamp.fromDate(new Date(entry.timestamp)),
  };
}

/**
 * Saves a new history entry to Firestore
 */
export async function saveHistoryEntry(entry: Omit<HistoryEntry, 'id'>): Promise<string> {
  try {
    const firestoreEntry = convertHistoryEntryToFirestore(entry);
    const docRef = await addDoc(collection(db, HISTORY_COLLECTION), firestoreEntry);
    return docRef.id;
  } catch (error) {
    console.error('Error saving history entry:', error);
    throw new Error('Failed to save history entry');
  }
}

/**
 * Updates an existing history entry
 */
export async function updateHistoryEntry(id: string, updates: Partial<HistoryEntry>): Promise<void> {
  try {
    const docRef = doc(db, HISTORY_COLLECTION, id);
    const firestoreUpdates: any = { ...updates };
    
    if (updates.timestamp) {
      firestoreUpdates.timestamp = Timestamp.fromDate(new Date(updates.timestamp as unknown as string));
    }
    
    await updateDoc(docRef, firestoreUpdates);
  } catch (error) {
    console.error('Error updating history entry:', error);
    throw new Error('Failed to update history entry');
  }
}

/**
 * Retrieves all history entries with optional filters
 */
export async function getHistoryEntries(filters?: HistoryFilters, limitCount: number = 50): Promise<HistoryEntry[]> {
  try {
    const baseRef = collection(db, HISTORY_COLLECTION);
    let q;
    if (filters?.generationType) {
      // Avoid composite index requirement by not ordering in Firestore
      q = query(
        baseRef,
        where('generationType', '==', filters.generationType),
        limit(limitCount)
      );
    } else {
      q = query(
        baseRef,
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
    }

    const querySnapshot = await getDocs(q);
    let entries = querySnapshot.docs.map(convertFirestoreToHistoryEntry);

    // Apply additional client-side filters to avoid composite indexes
    if (filters?.model) {
      entries = entries.filter(e => e.model === filters.model);
    }
    if (filters?.status) {
      entries = entries.filter(e => e.status === filters.status);
    }
    if (filters?.generationType) {
      // Ensure consistent desc ordering client-side
      entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    // Apply date range filter (client-side since Firestore has limitations)
    if (filters?.dateRange) {
      return entries.filter(entry => 
        new Date(entry.timestamp) >= filters.dateRange!.start && 
        new Date(entry.timestamp) <= filters.dateRange!.end
      );
    }

    return entries;
  } catch (error) {
    console.error('Error retrieving history entries:', error);
    throw new Error('Failed to retrieve history entries');
  }
}

/**
 * Gets recent history entries (last 20)
 */
export async function getRecentHistory(): Promise<HistoryEntry[]> {
  try {
    const entries = await getHistoryEntries(undefined, 20);

    // If no entries found, return sample data for demonstration
    if (entries.length === 0) {
      return getSampleHistoryData();
    }

    return entries;
  } catch (error) {
    console.error('Error loading recent history, returning sample data:', error);
    return getSampleHistoryData();
  }
}

/**
 * Returns sample history data for demonstration
 */
function getSampleHistoryData(): HistoryEntry[] {
  return [
    {
      id: 'sample-1',
      prompt: 'A beautiful sunset over mountains with vibrant colors',
      model: 'flux-kontext-pro',
      generationType: 'text-to-image',
      images: [
        {
          id: 'img-1',
          url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
          originalUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=800&fit=crop'
        },
        {
          id: 'img-2',
          url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=400&fit=crop',
          originalUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=800&fit=crop'
        }
      ],
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
      imageCount: 2,
      status: 'completed'
    },
    {
      id: 'sample-2',
      prompt: 'Futuristic city with neon lights and flying cars',
      model: 'flux-pro-1.1',
      generationType: 'text-to-image',
      images: [
        {
          id: 'img-3',
          url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop',
          originalUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=800&fit=crop'
        }
      ],
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      imageCount: 1,
      status: 'completed'
    },
    {
      id: 'sample-3',
      prompt: 'Cute cartoon cat playing with yarn ball',
      model: 'flux-kontext-pro',
      generationType: 'logo-generation',
      images: [
        {
          id: 'img-4',
          url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop',
          originalUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&h=800&fit=crop'
        },
        {
          id: 'img-5',
          url: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400&h=400&fit=crop',
          originalUrl: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=800&h=800&fit=crop'
        },
        {
          id: 'img-6',
          url: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=400&h=400&fit=crop',
          originalUrl: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=800&h=800&fit=crop'
        }
      ],
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      imageCount: 3,
      status: 'completed'
    },
    {
      id: 'sample-4',
      prompt: 'Epic battle scene with dragons and knights',
      model: 'flux-pro-1.1',
      generationType: 'text-to-video',
      images: [
        {
          id: 'img-7',
          url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop',
          originalUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=800&fit=crop'
        }
      ],
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      imageCount: 1,
      status: 'completed'
    },
    {
      id: 'sample-5',
      prompt: 'Ambient electronic music with nature sounds',
      model: 'flux-kontext-pro',
      generationType: 'text-to-music',
      images: [
        {
          id: 'img-8',
          url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop',
          originalUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=800&fit=crop'
        }
      ],
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
      imageCount: 1,
      status: 'completed'
    }
  ];
}
