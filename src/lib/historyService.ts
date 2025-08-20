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
    timestamp: data.timestamp?.toDate() || new Date(data.createdAt),
  };
}

/**
 * Converts HistoryEntry to Firestore format
 */
function convertHistoryEntryToFirestore(entry: Omit<HistoryEntry, 'id'>): Omit<HistoryEntryFirestore, 'id'> {
  return {
    ...entry,
    timestamp: Timestamp.fromDate(entry.timestamp),
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
      firestoreUpdates.timestamp = Timestamp.fromDate(updates.timestamp);
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
    let q = query(
      collection(db, HISTORY_COLLECTION),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    // Apply filters
    if (filters?.model) {
      q = query(q, where('model', '==', filters.model));
    }
    
    if (filters?.status) {
      q = query(q, where('status', '==', filters.status));
    }

    const querySnapshot = await getDocs(q);
    const entries = querySnapshot.docs.map(convertFirestoreToHistoryEntry);

    // Apply date range filter (client-side since Firestore has limitations)
    if (filters?.dateRange) {
      return entries.filter(entry => 
        entry.timestamp >= filters.dateRange!.start && 
        entry.timestamp <= filters.dateRange!.end
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
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      imageCount: 2,
      status: 'completed'
    },
    {
      id: 'sample-2',
      prompt: 'Futuristic city with neon lights and flying cars',
      model: 'flux-pro-1.1',
      images: [
        {
          id: 'img-3',
          url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop',
          originalUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=800&fit=crop'
        }
      ],
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      imageCount: 1,
      status: 'completed'
    },
    {
      id: 'sample-3',
      prompt: 'Cute cartoon cat playing with yarn ball',
      model: 'flux-kontext-pro',
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
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      imageCount: 3,
      status: 'completed'
    }
  ];
}
