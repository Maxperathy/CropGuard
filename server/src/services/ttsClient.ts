import { SnwolleyApiError, getTimeoutMs, parseSnwolleyError } from './snwolleyError';
import { synthesizeSpeechGoogleTwi } from './gttsClient';
import { translateToTwi, synthesizeSpeechKhaya } from './khayaClient';

const baseUrl =
  process.env.SNWOLLEY_HACKATHON_BASE_URL ??
  'https://v1.snwolley.ai/api/v1/hackathon';

function getApiKey(): string {
  const key = process.env.SNWOLLEY_HACKATHON_API_KEY;
  if (!key) throw new SnwolleyApiError('Missing SNWOLLEY_HACKATHON_API_KEY', 401);
  return key;
}

export interface SynthesisResult {
  format: 'mp3' | 'wav';
  audioBase64: string;
}

export async function synthesizeSpeech(text: string): Promise<Buffer> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getTimeoutMs());

  try {
    const response = await fetch(`${baseUrl}/tts`, {
      method: 'POST',
      headers: {
        'X-API-Key': getApiKey(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const msg = await parseSnwolleyError(response);
      throw new SnwolleyApiError(msg, response.status);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    if (err instanceof SnwolleyApiError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new SnwolleyApiError('TTS API request timed out', 504);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export async function synthesizeSpeechAuto(text: string): Promise<SynthesisResult> {
  // 1. Try Snwolley TTS first (Direct Snwolley Voice Integration)
  try {
    console.log('[TTS] Routing voice synthesis directly to Snwolley TTS API...');
    const wavBuffer = await synthesizeSpeech(text);
    return { format: 'wav', audioBase64: wavBuffer.toString('base64') };
  } catch (err) {
    console.warn('[TTS] Snwolley TTS failed, falling back to other providers:', err);
  }

  // 2. Try Khaya Translation + Khaya TTS (local Twi fallback)
  if (process.env.KHAYA_API_KEY) {
    try {
      console.log('[TTS] Using Khaya translation to Twi and TTS synthesis...');
      const twiText = await translateToTwi(text);
      const audioBase64 = await synthesizeSpeechKhaya(twiText);
      return { format: 'wav', audioBase64 };
    } catch (err) {
      console.warn('[TTS] Khaya translation/TTS failed, falling back to Google:', err);
    }
  }

  // 3. Try Google Cloud TTS (Twi language synthesis fallback)
  if (process.env.GOOGLE_API_KEY) {
    try {
      const audioBase64 = await synthesizeSpeechGoogleTwi(text);
      return { format: 'mp3', audioBase64 };
    } catch (err) {
      console.warn('[TTS] Google Twi synthesis failed:', err);
    }
  }

  throw new Error('All TTS synthesis providers failed');
}
