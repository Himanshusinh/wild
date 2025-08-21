export interface RunwayVideoTaskStatus {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'THROTTLED';
  createdAt: string;
  failure?: string;
  failureCode?: string;
  output?: string[];
  progress?: number;
}

export interface VideoGenerationProgress {
  current: number;
  total: number;
  status: string;
}

export interface VideoGenerationCallback {
  (progress: VideoGenerationProgress, status: string): void;
}

/**
 * Polls a Runway video generation task status
 */
export async function pollRunwayVideoTaskStatus(taskId: string): Promise<RunwayVideoTaskStatus> {
  try {
    const response = await fetch(`/api/runway/video/status/${taskId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch task status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('=== RUNWAY VIDEO STATUS POLL ===');
    console.log('Task ID:', taskId);
    console.log('Status:', data.status);
    console.log('Progress:', data.progress);
    console.log('Output:', data.output);
    
    return data;
  } catch (error) {
    console.error('Error polling Runway video task status:', error);
    throw error;
  }
}

/**
 * Waits for a Runway video generation task to complete
 */
export async function waitForRunwayVideoCompletion(
  taskId: string,
  onProgress?: VideoGenerationCallback,
  timeoutMs: number = 300000 // 5 minutes default
): Promise<RunwayVideoTaskStatus> {
  const startTime = Date.now();
  const pollInterval = 2000; // Poll every 2 seconds
  
  console.log('=== WAITING FOR RUNWAY VIDEO COMPLETION ===');
  console.log('Task ID:', taskId);
  console.log('Timeout:', timeoutMs, 'ms');
  console.log('Poll interval:', pollInterval, 'ms');
  
  while (true) {
    // Check timeout
    if (Date.now() - startTime > timeoutMs) {
      throw new Error(`Video generation timeout after ${timeoutMs}ms`);
    }
    
    try {
      const status = await pollRunwayVideoTaskStatus(taskId);
      
      // Call progress callback if provided
      if (onProgress && status.progress !== undefined) {
        const progress = Math.round(status.progress * 100);
        onProgress(
          { current: progress, total: 100, status: status.status },
          status.status
        );
      }
      
      // Check if task is complete
      if (status.status === 'SUCCEEDED') {
        console.log('=== RUNWAY VIDEO COMPLETED ===');
        console.log('Task ID:', taskId);
        console.log('Output:', status.output);
        return status;
      }
      
      if (status.status === 'FAILED') {
        console.error('=== RUNWAY VIDEO FAILED ===');
        console.error('Task ID:', taskId);
        console.error('Failure:', status.failure);
        console.error('Failure Code:', status.failureCode);
        throw new Error(`Video generation failed: ${status.failure || 'Unknown error'}`);
      }
      
      if (status.status === 'CANCELLED') {
        throw new Error('Video generation was cancelled');
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      
    } catch (error) {
      console.error('Error during video generation polling:', error);
      throw error;
    }
  }
}

/**
 * Validates video file type and size
 */
export function validateVideoFile(file: File): { isValid: boolean; error?: string } {
  const allowedTypes = [
    'video/mp4',
    'video/webm', 
    'video/quicktime',
    'video/mov',
    'video/ogg',
    'video/h264'
  ];
  
  const maxSize = 16 * 1024 * 1024; // 16 MB
  
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Invalid video type. Allowed: ${allowedTypes.join(', ')}`
    };
  }
  
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `Video file too large. Maximum size: 16 MB`
    };
  }
  
  return { isValid: true };
}

/**
 * Converts file to data URI
 */
export function fileToDataURI(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
