export type DiagnosisStatus = 'verified' | 'needs_review' | 'low_confidence';

const HEDGING_PATTERNS = [
  'not sure',
  'cannot confirm',
  'unable to determine',
  'hard to tell',
  'unclear from',
];

const VAGUE_VISION_PATTERNS = [
  'no clear',
  'no visible',
  'unable to identify',
  'too blurry',
  'not enough detail',
];

function containsPattern(text: string, patterns: string[]): boolean {
  const lower = text.toLowerCase();
  return patterns.some((p) => lower.includes(p));
}

export function classifyConfidence(
  rawConfidence: number,
  diagnosisText: string,
  visionDescription: string
): { confidence: number; status: DiagnosisStatus } {
  let confidence = Math.max(0, Math.min(100, rawConfidence));

  const hasHedging = containsPattern(diagnosisText, HEDGING_PATTERNS);
  const vagueVision = containsPattern(visionDescription, VAGUE_VISION_PATTERNS);

  // Cap at needs_review boundary when hedging or vague vision detected.
  // Not a real hallucination detector — transparency layer on self-reported score.
  if (hasHedging || vagueVision) {
    confidence = Math.min(confidence, 60);
  }

  let status: DiagnosisStatus;
  if (confidence >= 85) {
    status = 'verified';
  } else if (confidence >= 60) {
    status = 'needs_review';
  } else {
    status = 'low_confidence';
  }

  return { confidence, status };
}

export function parseConfidenceFromAgentReply(content: string): number {
  const match = content.match(/CONFIDENCE:\s*(\d{1,3})/i);
  if (!match) return 50;
  const parsed = parseInt(match[1], 10);
  if (Number.isNaN(parsed)) return 50;
  return Math.max(0, Math.min(100, parsed));
}

export function stripConfidenceLine(content: string): string {
  return content.replace(/\n?CONFIDENCE:\s*\d{1,3}\s*$/i, '').trim();
}
