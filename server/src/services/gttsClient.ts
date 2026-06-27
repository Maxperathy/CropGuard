import { SnwolleyApiError } from './snwolleyError';

/**
 * Uses Google Cloud TTS to synthesize text into Twi (tw-GH) audio.
 * Returns base64 encoded MP3 content.
 */
export async function synthesizeSpeechGoogleTwi(text: string): Promise<string> {
  const googleApiKey = process.env.GOOGLE_API_KEY;
  if (!googleApiKey) {
    throw new Error('Missing GOOGLE_API_KEY');
  }

  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleApiKey}`;

  try {
    console.log('[GoogleTTS] Requesting Twi audio synthesis');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: 'tw-GH',
          name: 'tw-GH-Standard-A',
        },
        audioConfig: {
          audioEncoding: 'MP3',
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GoogleTTS] API failed:', errorText);
      throw new SnwolleyApiError(`Google TTS API failed: ${response.statusText}`, response.status);
    }

    const data = (await response.json()) as { audioContent?: string };
    if (!data.audioContent) {
      throw new Error('Google TTS response did not contain audioContent');
    }

    return data.audioContent;
  } catch (err) {
    console.error('[GoogleTTS] Error:', err);
    throw err;
  }
}
