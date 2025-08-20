import { HistoryEntry, HistoryFilters } from '@/types/history';
import { db, storage } from '@/lib/firebase';
import { addDoc, collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

const HISTORY_COLLECTION = 'history';

export async function uploadFromUrlToStorage(assetUrl: string, storagePath: string): Promise<string> {
  const response = await fetch(assetUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch asset: ${response.status}`);
  }
  const blob = await response.blob();
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, blob);
  return await getDownloadURL(storageRef);
}

export async function saveHistoryEntry(entry: HistoryEntry): Promise<string> {
  const docRef = await addDoc(collection(db, HISTORY_COLLECTION), entry);
  return docRef.id;
}

export async function getRecentHistory(): Promise<HistoryEntry[]> {
  const q = query(collection(db, HISTORY_COLLECTION), orderBy('createdAt', 'desc'), limit(20));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}

export async function getHistoryEntries(
  filters?: HistoryFilters,
  fetchLimit: number = 20
): Promise<HistoryEntry[]> {
  let qRef: any = collection(db, HISTORY_COLLECTION);
  const constraints: any[] = [];
  if (filters?.model) constraints.push(where('model', '==', filters.model));
  if (filters?.status) constraints.push(where('status', '==', filters.status));
  // Date range filter is optional; using string ISO timestamps
  if (filters?.dateRange) {
    constraints.push(where('createdAt', '>=', filters.dateRange.start.toISOString()));
    constraints.push(where('createdAt', '<=', filters.dateRange.end.toISOString()));
  }
  constraints.push(orderBy('createdAt', 'desc'));
  constraints.push(limit(fetchLimit));
  const q = query(qRef, ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}


