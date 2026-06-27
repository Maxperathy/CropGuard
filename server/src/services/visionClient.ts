import { SnwolleyApiError, getTimeoutMs, parseSnwolleyError } from './snwolleyError';
import Groq from 'groq-sdk';

const baseUrl =
  process.env.SNWOLLEY_HACKATHON_BASE_URL ??
  'https://v1.snwolley.ai/api/v1/hackathon';

const DEFAULT_VISION_PROMPT =
  'Describe visible crop disease or pest damage symptoms in this photo. Be specific about leaf discoloration, spots, wilting, or pest damage patterns you observe.';

/**
 * Returns true when we should use Groq for vision instead of Snwolley.
 */
function useGroqVision(): boolean {
  return process.env.USE_GROQ === 'true' && !!process.env.GROQ_API_KEY;
}

function getSnwolleyKey(): string {
  const key = process.env.SNWOLLEY_HACKATHON_API_KEY;
  if (!key) throw new SnwolleyApiError('Missing SNWOLLEY_HACKATHON_API_KEY', 401);
  return key;
}

// ─── Groq Vision ────────────────────────────────────────────────────────────

function getMimeType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    bmp: 'image/bmp',
  };
  return map[ext ?? ''] ?? 'image/jpeg';
}

async function describeImageViaGroq(
  imageData: { buffer: Buffer; mimeType: string } | { url: string },
  prompt?: string
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new SnwolleyApiError('GROQ_API_KEY is not set', 401);
  }

  const model = process.env.GROQ_VISION_MODEL ?? 'llama-3.2-11b-vision-preview';
  console.log(`[VisionClient] Using Groq vision (model: ${model})`);

  try {
    const groq = new Groq({ apiKey });

    let imageUrl: string;

    if ('buffer' in imageData) {
      // Convert buffer to base64 data URL
      const base64 = imageData.buffer.toString('base64');
      imageUrl = `data:${imageData.mimeType};base64,${base64}`;
    } else {
      imageUrl = imageData.url;
    }

    const result = await groq.chat.completions.create({
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt ?? DEFAULT_VISION_PROMPT },
            {
              type: 'image_url',
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
      max_tokens: 1024,
    });

    const description = result.choices?.[0]?.message?.content;
    if (!description) {
      throw new SnwolleyApiError('Groq Vision returned no description', 500);
    }
    return description;
  } catch (err) {
    if (err instanceof SnwolleyApiError) throw err;
    const message = err instanceof Error ? err.message : 'Groq Vision failed';
    throw new SnwolleyApiError(`Groq vision error: ${message}`, 502);
  }
}

// ─── Snwolley Vision ────────────────────────────────────────────────────────

async function describeImageViaSnwolley(
  body: FormData | string,
  isJson: boolean,
  signal: AbortSignal
): Promise<string> {
  console.log('[VisionClient] Using Snwolley Vision API');

  const headers: Record<string, string> = { 'X-API-Key': getSnwolleyKey() };
  if (isJson) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${baseUrl}/vision`, {
    method: 'POST',
    headers,
    body: body,
    signal,
  });

  if (!response.ok) {
    const msg = await parseSnwolleyError(response);
    throw new SnwolleyApiError(msg, response.status);
  }

  const data = (await response.json()) as { description?: string };
  if (!data.description) {
    throw new SnwolleyApiError('Vision API returned no description', 500);
  }
  return data.description;
}

// ─── Public API ─────────────────────────────────────────────────────────────

export async function describeImageFromBuffer(
  buffer: Buffer,
  filename: string,
  prompt?: string
): Promise<string> {
  if (useGroqVision()) {
    return describeImageViaGroq(
      { buffer, mimeType: getMimeType(filename) },
      prompt
    );
  }

  // Snwolley path
  const mimeType = getMimeType(filename);
  const blob = typeof File !== 'undefined'
    ? new File([new Uint8Array(buffer)], filename, { type: mimeType })
    : new Blob([new Uint8Array(buffer)], { type: mimeType });

  const formData = new FormData();
  formData.append('image', blob, filename);
  formData.append('prompt', prompt ?? DEFAULT_VISION_PROMPT);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getTimeoutMs());

  try {
    return await describeImageViaSnwolley(formData, false, controller.signal);
  } catch (err) {
    if (err instanceof SnwolleyApiError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new SnwolleyApiError('Vision API request timed out', 504);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export async function describeImageFromUrl(
  imageUrl: string,
  prompt?: string
): Promise<string> {
  if (useGroqVision()) {
    return describeImageViaGroq({ url: imageUrl }, prompt);
  }

  // Snwolley path
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getTimeoutMs());

  try {
    return await describeImageViaSnwolley(
      JSON.stringify({
        image_url: imageUrl,
        prompt: prompt ?? DEFAULT_VISION_PROMPT,
      }),
      true,
      controller.signal
    );
  } catch (err) {
    if (err instanceof SnwolleyApiError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new SnwolleyApiError('Vision API request timed out', 504);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
