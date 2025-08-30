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
      console.log('🌐 Calling MiniMax API endpoint:', `${MINIMAX_API_BASE}/video_generation`);
      console.log('🔑 Using API key length:', this.apiKey.length);
      console.log('👥 Using group ID:', this.groupId);
      
      const response = await fetch(`${MINIMAX_API_BASE}/video_generation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      console.log('📡 MiniMax API response status:', response.status);
      console.log('📡 MiniMax API response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ MiniMax API error response:', errorText);
        throw new Error(`MiniMax API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📥 MiniMax API raw response data:', JSON.stringify(data, null, 2));
      console.log('📥 Response data type:', typeof data);
      console.log('📥 Response data keys:', Object.keys(data));
      console.log('📥 task_id field value:', data.task_id);
      console.log('📥 task_id field type:', typeof data.task_id);
      console.log('📥 base_resp field:', data.base_resp);
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
      console.log('📤 Request being sent to MiniMax:', JSON.stringify(request, null, 2));
      
      // 1. Create video generation task only
      const createResponse = await this.createVideoGeneration(request);
      console.log('📥 Raw MiniMax API response:', JSON.stringify(createResponse, null, 2));
      console.log('📥 Response keys:', Object.keys(createResponse));
      console.log('📥 task_id field:', createResponse.task_id);
      console.log('📥 task_id type:', typeof createResponse.task_id);
      console.log('📥 base_resp field:', createResponse.base_resp);
      console.log('📥 base_resp status_code:', createResponse.base_resp?.status_code);
      console.log('📥 base_resp status_msg:', createResponse.base_resp?.status_msg);
      
      // Check if the API call was successful
      if (createResponse.base_resp && createResponse.base_resp.status_code !== 0) {
        console.error('❌ MiniMax API returned error status:', createResponse.base_resp);
        throw new Error(`MiniMax API error: ${createResponse.base_resp.status_msg}`);
      }
      
      const taskId = createResponse.task_id;
      console.log('✅ MiniMax task created:', taskId);
      
      if (!taskId) {
        console.error('❌ No task_id found in MiniMax response');
        console.error('❌ Full response structure:', createResponse);
        throw new Error('MiniMax API response missing task_id');
      }
      
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
