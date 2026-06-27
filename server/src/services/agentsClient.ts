import { SnwolleyApiError, getTimeoutMs, parseSnwolleyError } from './snwolleyError';
import {
  parseConfidenceFromAgentReply,
  stripConfidenceLine,
} from './verificationEngine';
import Groq from 'groq-sdk';

const agentsUrl =
  process.env.SNWOLLEY_AGENTS_URL ?? 'https://v1.snwolley.ai/v1/chat/completions';

const PLACEHOLDER_KEY = 'your_snwolley_platform_key_here';

/**
 * Returns true if a real Snwolley Agent API key is configured.
 */
function hasSnwolleyAgentKey(): boolean {
  const key = process.env.SNWOLLEY_AGENT_API_KEY;
  return !!key && key !== PLACEHOLDER_KEY;
}

function getSnwolleyApiKey(): string {
  const key = process.env.SNWOLLEY_AGENT_API_KEY;
  if (!key || key === PLACEHOLDER_KEY) {
    throw new SnwolleyApiError('Missing SNWOLLEY_AGENT_API_KEY', 401);
  }
  return key;
}

function getAgentId(): string {
  return process.env.SNWOLLEY_AGENT_ID ?? '107';
}

function buildDiagnosisPrompt(visionDescription: string): string {
  return `You are an agricultural extension assistant helping Ghanaian smallholder farmers.

Based on the following visual analysis of a crop photo, provide:
1. A plain-language diagnosis of the likely disease, pest, or issue.
2. Practical care recommendations the farmer can act on today.
3. When confidence is low, clearly recommend visiting a local agricultural extension officer in person.

Visual analysis from the image:
"""
${visionDescription}
"""

Important: End your reply with a line in exactly this format on its own line:
CONFIDENCE: <integer 0-100>

The confidence number reflects how certain you are based only on the visual description above — not a verified lab test. Be honest; use lower numbers when symptoms are ambiguous.`;
}

export interface AgentDiagnosisResult {
  chatId: string;
  rawContent: string;
  diagnosis: string;
  rawConfidence: number;
}

// ─── Groq Fallback ──────────────────────────────────────────────────────────

async function getDiagnosisViaGroq(
  visionDescription: string
): Promise<AgentDiagnosisResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new SnwolleyApiError(
      'Neither SNWOLLEY_AGENT_API_KEY nor GROQ_API_KEY is configured',
      401
    );
  }

  const model = process.env.GROQ_CHAT_MODEL ?? 'llama-3.3-70b-versatile';
  console.log(`[AgentsClient] Using Groq fallback (model: ${model})`);

  try {
    const groq = new Groq({ apiKey });

    const result = await groq.chat.completions.create({
      model,
      messages: [
        {
          role: 'user',
          content: buildDiagnosisPrompt(visionDescription),
        },
      ],
      max_tokens: 1500,
      temperature: 0.3,
    });

    const content = result.choices?.[0]?.message?.content;
    if (!content) {
      throw new SnwolleyApiError('Groq returned no content', 500);
    }

    const rawConfidence = parseConfidenceFromAgentReply(content);
    const diagnosis = stripConfidenceLine(content);

    return {
      chatId: '',
      rawContent: content,
      diagnosis,
      rawConfidence,
    };
  } catch (err) {
    if (err instanceof SnwolleyApiError) throw err;
    const message = err instanceof Error ? err.message : 'Groq API call failed';
    throw new SnwolleyApiError(`Groq fallback error: ${message}`, 502);
  }
}

// ─── Snwolley Agents API ────────────────────────────────────────────────────

async function getDiagnosisViaSnwolley(
  visionDescription: string,
  chatId: string | null = null
): Promise<AgentDiagnosisResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getTimeoutMs());

  try {
    console.log('[AgentsClient] Using Snwolley Agents API');

    const response = await fetch(agentsUrl, {
      method: 'POST',
      headers: {
        'X-API-Key': getSnwolleyApiKey(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: buildDiagnosisPrompt(visionDescription),
        agent: getAgentId(),
        stream: false,
        chat_id: chatId,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const msg = await parseSnwolleyError(response);
      throw new SnwolleyApiError(msg, response.status);
    }

    const data = (await response.json()) as { chat_id?: string; content?: string };
    if (!data.content) {
      throw new SnwolleyApiError('Agents API returned no content', 500);
    }

    const rawConfidence = parseConfidenceFromAgentReply(data.content);
    const diagnosis = stripConfidenceLine(data.content);

    return {
      chatId: data.chat_id ?? '',
      rawContent: data.content,
      diagnosis,
      rawConfidence,
    };
  } catch (err) {
    if (err instanceof SnwolleyApiError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new SnwolleyApiError('Agents API request timed out', 504);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Public API (auto-selects provider) ─────────────────────────────────────

/**
 * Get a crop diagnosis from a vision description.
 * Uses Snwolley Agents API if key is configured, otherwise falls back to Groq.
 */
export async function getDiagnosisFromVisionDescription(
  visionDescription: string,
  chatId: string | null = null
): Promise<AgentDiagnosisResult> {
  if (process.env.USE_GROQ === 'true') {
    return getDiagnosisViaGroq(visionDescription);
  }
  if (hasSnwolleyAgentKey()) {
    return getDiagnosisViaSnwolley(visionDescription, chatId);
  }
  return getDiagnosisViaGroq(visionDescription);
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatFollowUpResult {
  reply: string;
  chatId: string;
}

export async function continueChatWithAgent(
  message: string,
  chatHistory: ChatMessage[],
  chatId: string | null = null
): Promise<ChatFollowUpResult> {
  if (process.env.USE_GROQ === 'true') {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new SnwolleyApiError('GROQ_API_KEY is not set', 401);
    }
    const model = process.env.GROQ_CHAT_MODEL ?? 'llama-3.3-70b-versatile';
    console.log(`[AgentsClient] Continuing chat via Groq (model: ${model})`);

    try {
      const groq = new Groq({ apiKey });
      const messages = [
        {
          role: 'system' as const,
          content: 'You are an agricultural extension assistant helping Ghanaian smallholder farmers. Keep your answers practical, brief and helpful.'
        },
        ...chatHistory.map(m => ({
          role: m.role === 'assistant' ? 'assistant' as const : 'user' as const,
          content: m.content
        })),
        { role: 'user' as const, content: message }
      ];

      const result = await groq.chat.completions.create({
        model,
        messages,
        max_tokens: 1000,
        temperature: 0.5,
      });

      const reply = result.choices?.[0]?.message?.content;
      if (!reply) {
        throw new SnwolleyApiError('Groq returned no content', 500);
      }

      return {
        reply,
        chatId: '',
      };
    } catch (err) {
      if (err instanceof SnwolleyApiError) throw err;
      const msg = err instanceof Error ? err.message : 'Groq API call failed';
      throw new SnwolleyApiError(`Groq follow-up error: ${msg}`, 502);
    }
  }

  // Snwolley follow-up
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getTimeoutMs());

  try {
    console.log('[AgentsClient] Continuing chat via Snwolley Agents API');

    const response = await fetch(agentsUrl, {
      method: 'POST',
      headers: {
        'X-API-Key': getSnwolleyApiKey(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        agent: getAgentId(),
        stream: false,
        chat_id: chatId,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const msg = await parseSnwolleyError(response);
      throw new SnwolleyApiError(msg, response.status);
    }

    const data = (await response.json()) as { chat_id?: string; content?: string };
    if (!data.content) {
      throw new SnwolleyApiError('Agents API returned no content', 500);
    }

    return {
      reply: data.content,
      chatId: data.chat_id ?? '',
    };
  } catch (err) {
    if (err instanceof SnwolleyApiError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new SnwolleyApiError('Agents API request timed out', 504);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

