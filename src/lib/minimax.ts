/* MiniMax video generation helpers */

export type VideoModel =
  | 'MiniMax-Hailuo-02'
  | 'T2V-01-Director'
  | 'I2V-01-Director'
  | 'S2V-01'
  | 'I2V-01'
  | 'I2V-01-live'
  | 'T2V-01';

export interface CreateVideoTaskRequest {
  model: VideoModel;
  prompt?: string;
  prompt_optimizer?: boolean;
  fast_pretreatment?: boolean;
  duration?: number;
  resolution?: string;
  first_frame_image?: string; // url or data uri (base64)
  subject_reference?: unknown[]; // S2V-01 only; keep generic to pass-through
  callback_url?: string;
}

export interface BaseResp {
  status_code: number;
  status_msg: string;
}

export interface CreateVideoTaskResponse {
  task_id: string;
  base_resp: BaseResp;
}

export interface QueryStatusResponse {
  task_id: string;
  status: 'Queueing' | 'Preparing' | 'Processing' | 'Success' | 'Fail' | string;
  file_id?: string;
  base_resp: BaseResp;
}

export interface RetrieveFileResponse {
  file: {
    file_id: string | number;
    bytes: number;
    created_at: number;
    filename: string;
    purpose: string;
    download_url: string;
    backup_download_url?: string;
  };
  base_resp: BaseResp;
}

function getApiKey(): string {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    throw new Error('MINIMAX_API_KEY is not set');
  }
  return apiKey;
}

function getGroupId(fallback?: string | null): string {
  const fromEnv = process.env.MINIMAX_GROUP_ID;
  const groupId = fallback || fromEnv;
  if (!groupId) {
    throw new Error('GroupId is required (provide query param group_id or set MINIMAX_GROUP_ID)');
  }
  return groupId;
}

const BASE_URL = 'https://api.minimax.io/v1';

export async function createVideoTask(
  params: CreateVideoTaskRequest
): Promise<CreateVideoTaskResponse> {
  const apiKey = getApiKey();
  const res = await fetch(`${BASE_URL}/video_generation`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MiniMax create task failed: ${res.status} ${text}`);
  }
  return (await res.json()) as CreateVideoTaskResponse;
}

export async function queryVideoTaskStatus(taskId: string): Promise<QueryStatusResponse> {
  const apiKey = getApiKey();
  const url = `${BASE_URL}/query/video_generation?task_id=${encodeURIComponent(taskId)}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      authorization: `Bearer ${apiKey}`,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MiniMax query task failed: ${res.status} ${text}`);
  }
  return (await res.json()) as QueryStatusResponse;
}

export async function retrieveFile(
  args: { groupId?: string | null; fileId: string }
): Promise<RetrieveFileResponse> {
  const apiKey = getApiKey();
  const groupId = getGroupId(args.groupId);
  const url = `${BASE_URL}/files/retrieve?GroupId=${encodeURIComponent(groupId)}&file_id=${encodeURIComponent(args.fileId)}`;
  // Attempt GET first (observed in examples), then fallback to POST per docs
  const commonHeaders: Record<string, string> = {
    authorization: `Bearer ${apiKey}`,
    'content-type': 'application/json',
  };
  let res = await fetch(url, { method: 'GET', headers: commonHeaders });
  if (!res.ok) {
    // Fallback to POST
    res = await fetch(url, { method: 'POST', headers: commonHeaders });
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MiniMax retrieve file failed: ${res.status} ${text}`);
  }
  return (await res.json()) as RetrieveFileResponse;
}


