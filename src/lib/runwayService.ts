import { getApiClient } from '@/lib/axiosInstance';
export interface RunwayTaskStatus {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'THROTTLED';
  createdAt: string;
  failure?: string;
  failureCode?: string;
  output?: string[];
  progress?: number;
}

export const pollRunwayTaskStatus = async (taskId: string): Promise<RunwayTaskStatus> => {
  try {
    console.log(`Polling Runway task status for taskId: ${taskId}`);
    const api = getApiClient();
    const { data } = await api.get(`/api/runway/status/${taskId}`);
    console.log(`Task ${taskId} status:`, data.status, data.progress);
    return data;
  } catch (error) {
    console.error(`Error polling task status for ${taskId}:`, error);
    throw new Error(`Error polling task status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const waitForRunwayCompletion = async (
  taskId: string, 
  onProgress?: (progress: number, status: string) => void,
  maxWaitTime: number = 300000 // 5 minutes
): Promise<RunwayTaskStatus> => {
  console.log(`=== STARTING RUNWAY COMPLETION WAIT FOR TASK ${taskId} ===`);
  console.log(`Max wait time: ${maxWaitTime}ms (${maxWaitTime / 1000}s)`);
  
  const startTime = Date.now();
  let pollCount = 0;
  
  while (Date.now() - startTime < maxWaitTime) {
    try {
      pollCount++;
      console.log(`Poll attempt ${pollCount} for task ${taskId}`);
      
      const status = await pollRunwayTaskStatus(taskId);
      
      if (onProgress && status.progress !== undefined) {
        console.log(`Progress callback for task ${taskId}:`, status.progress, status.status);
        onProgress(status.progress, status.status);
      }
      
      if (status.status === 'SUCCEEDED') {
        console.log(`Task ${taskId} succeeded! Output count:`, status.output?.length || 0);
        console.log(`=== RUNWAY COMPLETION WAIT COMPLETED FOR TASK ${taskId} ===`);
        return status;
      }
      
      if (status.status === 'FAILED' || status.status === 'CANCELLED') {
        console.error(`Task ${taskId} ${status.status.toLowerCase()}:`, status.failure);
        throw new Error(`Task ${status.status.toLowerCase()}: ${status.failure || 'Unknown error'}`);
      }
      
      console.log(`Task ${taskId} still ${status.status}, waiting 5 seconds...`);
      // Wait 5 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 5000));
      
    } catch (error) {
      console.error(`Error during completion wait for task ${taskId}:`, error);
      throw error;
    }
  }
  
  console.error(`Task ${taskId} polling timeout exceeded after ${maxWaitTime}ms`);
  throw new Error('Task polling timeout exceeded');
};
