export class SnwolleyApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'SnwolleyApiError';
    this.status = status;
  }
}

export function getTimeoutMs(): number {
  return parseInt(process.env.SNWOLLEY_TIMEOUT_MS ?? '60000', 10);
}

export async function parseSnwolleyError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? response.statusText;
  } catch {
    return response.statusText;
  }
}
