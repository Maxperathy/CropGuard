import { query, queryOne } from '../db/pool';
import { describeImageFromBuffer, describeImageFromUrl } from './visionClient';
import { getDiagnosisFromVisionDescription } from './agentsClient';
import { classifyConfidence } from './verificationEngine';
import { SnwolleyApiError } from './snwolleyError';

export interface DiagnosisRecord {
  id: string;
  user_id: string;
  image_ref: string;
  vision_description: string;
  diagnosis: string;
  confidence: number;
  status: string;
  audio_base64: string | null;
  audio_format: 'mp3' | 'wav' | null;
  chat_id?: string;
  created_at: string;
}

const DIAGNOSIS_POINTS = 5;

export async function runDiagnosisPipeline(params: {
  userId: string;
  imageBuffer?: Buffer;
  filename?: string;
  imageUrl?: string;
}): Promise<DiagnosisRecord> {
  const user = await queryOne<{ id: string }>(
    'SELECT id FROM users WHERE id = $1',
    [params.userId]
  );
  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  let visionDescription: string;
  let imageRef: string;

  if (params.imageBuffer && params.filename) {
    visionDescription = await describeImageFromBuffer(
      params.imageBuffer,
      params.filename
    );
    imageRef = params.filename;
  } else if (params.imageUrl) {
    visionDescription = await describeImageFromUrl(params.imageUrl);
    imageRef = params.imageUrl;
  } else {
    throw new Error('NO_IMAGE_PROVIDED');
  }

  const agentResult = await getDiagnosisFromVisionDescription(visionDescription);
  const { confidence, status } = classifyConfidence(
    agentResult.rawConfidence,
    agentResult.diagnosis,
    visionDescription
  );

  const audioBase64: string | null = null;
  const audioFormat: 'mp3' | 'wav' | null = null;

  const diagnosisRow = await queryOne<{
    id: string;
    user_id: string;
    image_ref: string;
    vision_description: string;
    diagnosis: string;
    confidence: number;
    status: string;
    created_at: string;
  }>(
    `INSERT INTO diagnoses (user_id, image_ref, vision_description, diagnosis, confidence, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      params.userId,
      imageRef,
      visionDescription,
      agentResult.diagnosis,
      confidence,
      status,
    ]
  );

  if (!diagnosisRow) {
    throw new Error('Failed to save diagnosis');
  }

  await query(
    `INSERT INTO activities (user_id, type, points, description)
     VALUES ($1, 'diagnosis_submitted', $2, $3)`,
    [
      params.userId,
      DIAGNOSIS_POINTS,
      `Submitted crop diagnosis (${status}, confidence ${confidence})`,
    ]
  );

  await query(
    'UPDATE users SET reputation_score = reputation_score + $1 WHERE id = $2',
    [DIAGNOSIS_POINTS, params.userId]
  );

  return {
    id: diagnosisRow.id,
    user_id: diagnosisRow.user_id,
    image_ref: diagnosisRow.image_ref,
    vision_description: diagnosisRow.vision_description,
    diagnosis: diagnosisRow.diagnosis,
    confidence: diagnosisRow.confidence,
    status: diagnosisRow.status,
    audio_base64: audioBase64,
    audio_format: audioFormat,
    chat_id: agentResult.chatId,
    created_at: new Date(diagnosisRow.created_at).toISOString(),
  };
}

export { SnwolleyApiError };
