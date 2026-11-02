import { sanitizePlan } from './model';
import { assistantOutputSchema, type AssistantOutput, type AssistantRequest } from './schema';

/**
 * Program asistanı istemcisi. Geliştirmede göreli adres Expo dev sunucusuna gider (API rotası); yayındaki native
 * derlemede `EXPO_PUBLIC_API_URL` (rotaların yayınlandığı sunucu).
 */
export type AssistantErrorCode =
  | 'not_configured'
  | 'bad_request'
  | 'refusal'
  | 'truncated'
  | 'invalid_output'
  | 'rate_limited'
  | 'upstream'
  | 'network';

export class AssistantError extends Error {
  constructor(readonly code: AssistantErrorCode) {
    super(code);
  }
}

const KNOWN = new Set<AssistantErrorCode>([
  'not_configured',
  'bad_request',
  'refusal',
  'truncated',
  'invalid_output',
  'rate_limited',
  'upstream',
]);

export async function askAssistant(body: AssistantRequest): Promise<AssistantOutput> {
  const base = process.env.EXPO_PUBLIC_API_URL ?? '';
  let response: Response;
  try {
    response = await fetch(`${base}/api/program`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AssistantError('network');
  }
  const json: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const code = (json as { error?: string } | null)?.error as AssistantErrorCode | undefined;
    throw new AssistantError(code && KNOWN.has(code) ? code : 'upstream');
  }
  const parsed = assistantOutputSchema.safeParse(json);
  if (!parsed.success) throw new AssistantError('invalid_output');
  return { reply: parsed.data.reply, program: parsed.data.program ? sanitizePlan(parsed.data.program) : null };
}
