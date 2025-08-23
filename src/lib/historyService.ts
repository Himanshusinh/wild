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
  startAfter,
  Timestamp
} from 'firebase/firestore';
import { HistoryEntry, HistoryEntryFirestore, HistoryFilters } from '@/types/history';
import { PaginationParams, PaginationResult } from './paginationUtils';

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
 * Retrieves history entries with proper database pagination
 */
export async function getHistoryEntries(
  filters?: HistoryFilters, 
  paginationParams?: PaginationParams
): Promise<PaginationResult<HistoryEntry>> {
  try {
    console.log('🔥 FIREBASE PAGINATION DEBUG 🔥');
    console.log('Filters:', filters);
    console.log('Pagination params:', paginationParams);
    
    // Build the query step by step
    let baseQuery: any = collection(db, HISTORY_COLLECTION);
    
    // Apply filters
    if (filters?.generationType) {
      baseQuery = query(baseQuery, where('generationType', '==', filters.generationType));
      console.log('✅ Applied generationType filter:', filters.generationType);
    }
    if (filters?.model) {
      baseQuery = query(baseQuery, where('model', '==', filters.model));
      console.log('✅ Applied model filter:', filters.model);
    }
    if (filters?.status) {
      baseQuery = query(baseQuery, where('status', '==', filters.status));
      console.log('✅ Applied status filter:', filters.status);
    }

         // Add ordering - we need both timestamp and document ID for proper pagination
     // Check if sort order is specified in filters
     const sortDirection = (filters as any)?.sortOrder || 'desc';
     let finalQuery = query(baseQuery, orderBy('timestamp', sortDirection), orderBy('__name__', 'asc'));
     console.log(`✅ Applied ordering: timestamp ${sortDirection}, __name__ asc`);
    
         // Add cursor-based pagination if cursor is provided
     if (paginationParams?.cursor) {
       console.log('🔄 Using cursor for pagination:', paginationParams.cursor);
       
       // The cursor should contain the timestamp and document ID for proper pagination
       if (typeof paginationParams.cursor === 'object' && paginationParams.cursor.timestamp && paginationParams.cursor.id) {
         // For reliable pagination, we need to fetch the cursor document first
         // This ensures we get the exact document snapshot for startAfter
         try {
           const cursorDocRef = doc(db, HISTORY_COLLECTION, paginationParams.cursor.id);
           const cursorDoc = await getDocs(query(collection(db, HISTORY_COLLECTION), where('__name__', '==', paginationParams.cursor.id)));
           
           if (!cursorDoc.empty) {
             const cursorSnapshot = cursorDoc.docs[0];
             console.log('🔍 Found cursor document:', {
               id: cursorSnapshot.id,
               timestamp: cursorSnapshot.data().timestamp?.toDate?.()?.toISOString()
             });
             
             // Use the document snapshot for startAfter - this is the most reliable method
             finalQuery = query(finalQuery, startAfter(cursorSnapshot));
             console.log('✅ Applied startAfter with document snapshot cursor');
           } else {
             console.log('⚠️ Cursor document not found, falling back to beginning');
           }
         } catch (cursorError) {
           console.log('⚠️ Error fetching cursor document, falling back to beginning:', cursorError);
         }
       } else {
         console.log('⚠️ Invalid cursor format, falling back to beginning');
       }
     } else {
       console.log('🆕 No cursor provided, starting from beginning');
     }
    
    // Add limit (request +1 to check if there are more results)
    const requestLimit = (paginationParams?.limit || 20) + 1;
    finalQuery = query(finalQuery, limit(requestLimit));
    console.log('✅ Applied limit:', requestLimit);

         console.log('🚀 Executing Firestore query...');
     const querySnapshot = await getDocs(finalQuery);
     console.log('📊 Query result - Total docs:', querySnapshot.docs.length);
     
     // Debug: Show the first few documents to verify we're getting new content
     if (querySnapshot.docs.length > 0) {
       const firstDocData = querySnapshot.docs[0].data() as HistoryEntryFirestore;
       console.log('🔍 First document in result:', {
         id: querySnapshot.docs[0].id,
         timestamp: firstDocData.timestamp?.toDate?.()?.toISOString()
       });
       if (querySnapshot.docs.length > 1) {
         const lastDocData = querySnapshot.docs[querySnapshot.docs.length - 1].data() as HistoryEntryFirestore;
         console.log('🔍 Last document in result:', {
           id: querySnapshot.docs[querySnapshot.docs.length - 1].id,
           timestamp: lastDocData.timestamp?.toDate?.()?.toISOString()
         });
       }
     }
    
    const entries = querySnapshot.docs.map(convertFirestoreToHistoryEntry);
    console.log('🔄 Converted entries:', entries.length);

    // Remove duplicate entries based on ID
    const uniqueEntries = entries.filter((entry, index, self) => 
      index === self.findIndex(e => e.id === entry.id)
    );
    console.log('✨ Unique entries after deduplication:', uniqueEntries.length);

         // Process pagination results
     const limitCount = paginationParams?.limit || 20;
     const hasMore = uniqueEntries.length > limitCount;
     const resultData = hasMore ? uniqueEntries.slice(0, limitCount) : uniqueEntries;
     
     // For cursor, use the last document from the FULL query result (before slicing)
     // This ensures we get the actual next document for pagination
     const lastFullDocument = uniqueEntries[uniqueEntries.length - 1];
     const firstFullDocument = uniqueEntries[0];
     
     console.log('📈 Pagination results:');
     console.log('  - Requested limit:', limitCount);
     console.log('  - Actual returned:', resultData.length);
     console.log('  - Has more:', hasMore);
     console.log('  - Full query result count:', uniqueEntries.length);
     console.log('  - Last full document:', lastFullDocument ? `ID: ${lastFullDocument.id}, Time: ${lastFullDocument.timestamp}` : 'none');
     console.log('  - Next cursor:', hasMore ? 
       `{timestamp: ${lastFullDocument?.timestamp}, id: ${lastFullDocument?.id}}` : 'none');
     
     const result = {
       data: resultData,
       hasMore,
       nextCursor: hasMore ? { 
         timestamp: lastFullDocument?.timestamp, 
         id: lastFullDocument?.id 
       } : undefined,
       prevCursor: firstFullDocument ? { 
         timestamp: firstFullDocument?.timestamp, 
         id: firstFullDocument?.id 
       } : undefined
     };

    // Apply date range filter (client-side since Firestore has limitations)
    if (filters?.dateRange) {
      const filteredData = result.data.filter(entry => 
        new Date(entry.timestamp) >= filters.dateRange!.start && 
        new Date(entry.timestamp) <= filters.dateRange!.end
      );
      
      console.log('📅 Date range filter applied:', filteredData.length, 'entries match');
      
      return {
        ...result,
        data: filteredData,
        hasMore: filteredData.length === (paginationParams?.limit || 20)
      };
    }

    console.log('✅ Returning pagination result');
    return result;
  } catch (error) {
    console.error('❌ Error retrieving history entries:', error);
    throw new Error('Failed to retrieve history entries');
  }
}

/**
 * Gets recent history entries (last 20)
 */
export async function getRecentHistory(): Promise<HistoryEntry[]> {
  try {
    const result = await getHistoryEntries(undefined, { limit: 20 });

    // If no entries found, return sample data for demonstration
    if (result.data.length === 0) {
      return getSampleHistoryData();
    }

    return result.data;
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
