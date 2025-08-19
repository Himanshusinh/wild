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
  return getHistoryEntries(undefined, 20);
}
