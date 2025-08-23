export interface PaginationParams {
  limit: number;
  cursor?: string | { timestamp: string; id: string }; // Document ID or timestamp+ID object for proper pagination
  direction?: 'next' | 'prev'; // For bidirectional pagination
}

export interface PaginationResult<T> {
  data: T[];
  hasMore: boolean;
  nextCursor?: { timestamp: string; id: string };
  prevCursor?: { timestamp: string; id: string };
  totalCount?: number;
}

export interface CursorPaginationOptions {
  field: string; // Field to sort by (usually timestamp or createdAt)
  order: 'asc' | 'desc'; // Sort order
  uniqueField?: string; // Additional field to ensure uniqueness (usually document ID)
}

/**
 * Creates Firestore query constraints for cursor-based pagination
 */
export function createPaginationQuery(
  baseQuery: any,
  options: CursorPaginationOptions,
  params: PaginationParams
) {
  let query = baseQuery;

  // If baseQuery is a collection reference, we need to start building the query
  if (baseQuery && typeof baseQuery.orderBy !== 'function') {
    // This is a collection reference, we need to import query from firebase/firestore
    // For now, let's handle this by checking if it's a valid query object
    console.warn('Base query is not a valid Firestore query object');
    return baseQuery; // Return as-is for now
  }

  try {
    // Add ordering
    query = query.orderBy(options.field, options.order);

    // Add cursor-based pagination
    if (params.cursor) {
      if (params.direction === 'prev') {
        // For previous page, we need to reverse the order and use the cursor
        query = query.orderBy(options.field, options.order === 'desc' ? 'asc' : 'desc');
        query = query.startAfter(params.cursor);
        query = query.orderBy(options.field, options.order);
      } else {
        // For next page, use the cursor as starting point
        query = query.startAfter(params.cursor);
      }
    }

    // Add limit
    query = query.limit(params.limit + 1); // +1 to check if there are more results

    return query;
  } catch (error) {
    console.error('Error creating pagination query:', error);
    return baseQuery; // Return base query if pagination fails
  }
}

/**
 * Processes pagination results and determines if there are more pages
 */
export function processPaginationResult<T>(
  data: T[],
  limit: number,
  options: CursorPaginationOptions
): PaginationResult<T> {
  const hasMore = data.length > limit;
  const resultData = hasMore ? data.slice(0, limit) : data;

  let nextCursor: { timestamp: string; id: string } | undefined;
  let prevCursor: { timestamp: string; id: string } | undefined;

  if (resultData.length > 0) {
    const lastItem = resultData[resultData.length - 1] as any;
    const firstItem = resultData[0] as any;
    
    // For next page cursor, use the last item's timestamp and ID
    nextCursor = hasMore ? { timestamp: lastItem.timestamp, id: lastItem.id } : undefined;
    
    // For previous page cursor, use the first item's timestamp and ID
    prevCursor = { timestamp: firstItem.timestamp, id: firstItem.id };
  }

  return {
    data: resultData,
    hasMore,
    nextCursor,
    prevCursor,
  };
}

/**
 * Creates a cursor from a document for pagination
 */
export function createCursor(doc: any, field: string): string {
  return `${doc.id}:${doc.data()[field]}`;
}

/**
 * Parses a cursor back to document ID and field value
 */
export function parseCursor(cursor: string): { id: string; fieldValue: any } {
  const [id, fieldValue] = cursor.split(':');
  return { id, fieldValue };
}
