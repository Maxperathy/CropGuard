import { SnwolleyApiError } from './snwolleyError';

function getKhayaApiKey(): string {
  const key = process.env.KHAYA_API_KEY;
  if (!key) {
    throw new SnwolleyApiError('Missing KHAYA_API_KEY', 401);
  }
  return key;
}

/**
 * Translates text from English to Asante Twi using Khaya API
 */
export async function translateToTwi(text: string): Promise<string> {
  const apiKey = getKhayaApiKey();
  const url = 'https://translation-api.ghananlp.org/v1/translate';

  // Limit characters to avoid API payload limit issues
  const truncatedText = text.length > 500 ? text.substring(0, 500) + '...' : text;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000); // 12 second timeout

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': apiKey,
      },
      body: JSON.stringify({
        in: truncatedText,
        lang: 'en-tw',
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Khaya Translation failed with status: ${res.status}`);
    }

    const translatedText = await res.json();
    if (typeof translatedText === 'string') {
      return translatedText;
    }
    return String(translatedText);
  } catch (err) {
    console.error('[Khaya Translation] Error:', err);
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Synthesizes speech (Twi) using Khaya TTS API
 */
export async function synthesizeSpeechKhaya(text: string): Promise<string> {
  const apiKey = getKhayaApiKey();
  const url = 'https://translation-api.ghananlp.org/tts/v1/tts';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000); // 12 second timeout

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': apiKey,
      },
      body: JSON.stringify({
        text,
        language: 'tw',
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Khaya TTS failed with status: ${res.status}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer).toString('base64');
  } catch (err) {
    console.error('[Khaya TTS] Error:', err);
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Transcribes audio using Khaya ASR API
 */
export async function transcribeAudioKhaya(
  audioBuffer: Buffer,
  language: string,
  contentType: string = 'audio/wav'
): Promise<string> {
  const apiKey = getKhayaApiKey();
  const url = `https://translation-api.ghananlp.org/asr/v3/transcribe?language=${language}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000); // 20 second timeout for ASR

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Content-Type': contentType,
      },
      body: audioBuffer as any,
      signal: controller.signal,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Khaya ASR failed with status ${res.status}: ${errorText}`);
    }

    const data = (await res.json()) as { text: string };
    return data.text;
  } catch (err) {
    console.error('[Khaya ASR] Error:', err);
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

