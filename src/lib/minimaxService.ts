import { 
  MiniMaxVideoGenerationRequest, 
  MiniMaxVideoGenerationResponse,
  MiniMaxVideoStatusResponse,
  MiniMaxFileRetrieveResponse
} from './minimaxTypes';

const MINIMAX_API_BASE = 'https://api.minimax.io/v1';

export class MiniMaxService {
  private apiKey: string;
  private groupId: string;

  constructor(apiKey: string, groupId: string) {
    this.apiKey = apiKey;
    this.groupId = groupId;
  }

  // Create video generation task
  async createVideoGeneration(request: MiniMaxVideoGenerationRequest): Promise<MiniMaxVideoGenerationResponse> {
    try {
      const response = await fetch(`${MINIMAX_API_BASE}/video_generation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`MiniMax API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ MiniMax createVideoGeneration failed:', error);
      throw error;
    }
  }

  // Query video generation status
  async queryVideoGenerationStatus(taskId: string): Promise<MiniMaxVideoStatusResponse> {
    try {
      const response = await fetch(`${MINIMAX_API_BASE}/query/video_generation?task_id=${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`MiniMax API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ MiniMax queryVideoGenerationStatus failed:', error);
      throw error;
    }
  }

  // Retrieve file download URL
  async retrieveFile(fileId: string): Promise<MiniMaxFileRetrieveResponse> {
    try {
      const response = await fetch(`${MINIMAX_API_BASE}/files/retrieve?GroupId=${this.groupId}&file_id=${fileId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`MiniMax API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ MiniMax retrieveFile failed:', error);
      throw error;
    }
  }

  // Poll video generation status until completion
  async waitForVideoCompletion(taskId: string, maxAttempts: number = 60): Promise<MiniMaxVideoStatusResponse> {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const status = await this.queryVideoGenerationStatus(taskId);
        console.log(`🔄 MiniMax task ${taskId} status: ${status.status} (attempt ${attempts + 1})`);
        
        if (status.status === 'Success') {
          console.log('✅ MiniMax video generation completed successfully');
          return status;
        }
        
        if (status.status === 'Fail') {
          throw new Error(`MiniMax video generation failed: ${status.base_resp.status_msg}`);
        }
        
        // Wait 5 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
        
      } catch (error) {
        console.error(`❌ Error polling MiniMax status (attempt ${attempts + 1}):`, error);
        attempts++;
        
        if (attempts >= maxAttempts) {
          throw new Error(`MiniMax video generation timed out after ${maxAttempts} attempts`);
        }
        
        // Wait 5 seconds before retry
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    throw new Error('MiniMax video generation polling exceeded maximum attempts');
  }

  // Create video generation task only - return task_id
  async generateVideo(request: MiniMaxVideoGenerationRequest): Promise<{
    taskId: string;
  }> {
    try {
      console.log('🚀 Creating MiniMax video generation task...');
      
      // 1. Create video generation task only
      const createResponse = await this.createVideoGeneration(request);
      const taskId = createResponse.task_id;
      console.log('✅ MiniMax task created:', taskId);
      
      return { taskId };
      
    } catch (error) {
      console.error('❌ MiniMax video generation task creation failed:', error);
      throw error;
    }
  }
}

// Helper function to create MiniMax service instance
export const createMiniMaxService = (apiKey: string, groupId: string): MiniMaxService => {
  return new MiniMaxService(apiKey, groupId);
};
