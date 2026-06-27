let rawBase = import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';
if (rawBase.endsWith('/')) {
  rawBase = rawBase.slice(0, -1);
}
const API_BASE = rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`;

export interface User {
  id: string;
  display_name: string;
  reputation_score: number;
  created_at: string;
}

export interface DiagnosisResult {
  id: string;
  user_id: string;
  image_ref: string;
  vision_description: string;
  diagnosis: string;
  confidence: number;
  status: 'verified' | 'needs_review' | 'low_confidence';
  audio_base64: string | null;
  audio_format?: 'mp3' | 'wav' | null;
  chat_id?: string;
  created_at: string;
}

export interface Activity {
  id: string;
  user_id: string;
  type: string;
  points: number;
  description: string | null;
  created_at: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? 'Request failed');
  }
  return res.json();
}

export async function createUser(displayName: string): Promise<User> {
  return request<User>('/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName }),
  });
}

export async function diagnosePhoto(userId: string, file: File): Promise<DiagnosisResult> {
  const formData = new FormData();
  formData.append('userId', userId);
  formData.append('image', file);

  const res = await fetch(`${API_BASE}/diagnose`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? 'Diagnosis failed');
  }

  return res.json();
}

export async function getActivity(userId: string): Promise<{
  user: User;
  activities: Activity[];
}> {
  return request(`/activity/${userId}`);
}

export async function completeLesson(
  userId: string,
  lessonTitle: string
): Promise<{ user: User; activity: Activity }> {
  return request('/activity/lesson-complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, lessonTitle }),
  });
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatFollowUpResponse {
  reply: string;
  chatId: string;
  audio_base64: string | null;
  audio_format: 'mp3' | 'wav' | null;
}

export async function chatFollowUp(
  userId: string,
  message: string,
  chatHistory: ChatMessage[],
  chatId: string | null,
  twiMode?: boolean
): Promise<ChatFollowUpResponse> {
  return request<ChatFollowUpResponse>('/diagnose/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, message, chatHistory, chatId, twiMode }),
  });
}

export async function checkHealth(): Promise<{ status: string; service: string }> {
  return request('/health');
}

export interface HistoryDiagnosis {
  id: string;
  user_id: string;
  image_ref: string;
  diagnosis: string;
  confidence: number;
  status: 'verified' | 'needs_review' | 'low_confidence';
  created_at: string;
}

export async function getDiagnosisHistory(userId: string): Promise<HistoryDiagnosis[]> {
  const data = await request<{ diagnoses: HistoryDiagnosis[] }>(`/history/${userId}`);
  return data.diagnoses;
}

export async function deleteDiagnosis(id: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/history/${id}`, {
    method: 'DELETE',
  });
}
