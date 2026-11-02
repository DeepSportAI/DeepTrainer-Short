import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';

import { systemPrompt } from '@/features/programs/prompt';
import { assistantRequestSchema, assistantWireSchema, normalizeOutput } from '@/features/programs/schema';

/**
 * Program asistanı — sunucu rotası. Anahtar (`ANTHROPIC_API_KEY`) yalnız sunucuda okunur, uygulama paketine girmez
 * (Expo Router API rotası; `.env`, git dışı). Uygulama sohbet geçmişini gönderir, rota yapılandırılmış çıktıyla
 * `{ reply, program }` döner.
 *
 * Model Claude Opus 5.5, çaba `medium` (sohbet hızında yanıt; program tasarımı için yeterli düşünme). Akışla istenir
 * ve son mesaj beklenir (uzun yanıtta HTTP zaman aşımı olmasın). Sınıflandırıcı reddinde sunucu tarafı yedek model
 * devreye girer (`fallbacks: 'default'`).
 */
const MODEL = 'claude-opus-5-5';

type ErrorCode = 'not_configured' | 'bad_request' | 'refusal' | 'truncated' | 'invalid_output' | 'rate_limited' | 'upstream';

function failure(code: ErrorCode, status: number) {
  return Response.json({ error: code }, { status });
}

/** Sunucu ortamında tanımlı bir kimlik kaynağı var mı (yoksa SDK yalnız diskteki `ant` profiline bakar). */
function hasCredentialEnv(): boolean {
  return ['ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN', 'ANTHROPIC_PROFILE', 'ANTHROPIC_FEDERATION_RULE_ID'].some((key) => Boolean(process.env[key]));
}

function createClient(): Anthropic | null {
  try {
    // Kimlik SDK'nın kendi sırasıyla çözülür: ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN ya da `ant auth login` profili.
    return new Anthropic();
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const parsed = assistantRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || parsed.data.messages[0]?.role !== 'user') return failure('bad_request', 400);
  const { locale, messages } = parsed.data;

  const client = createClient();
  if (!client) return failure('not_configured', 503);
  try {
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium', format: betaZodOutputFormat(assistantWireSchema) },
      system: [{ type: 'text', text: systemPrompt(locale), cache_control: { type: 'ephemeral' } }],
      messages,
    });
    const message = await stream.finalMessage();

    if (message.stop_reason === 'refusal') return failure('refusal', 422);
    if (message.stop_reason === 'max_tokens') return failure('truncated', 502);
    const output = message.parsed_output;
    if (!output) return failure('invalid_output', 502);
    return Response.json(normalizeOutput(output));
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return failure('rate_limited', 429);
    if (error instanceof Anthropic.AuthenticationError) return failure('not_configured', 503);
    if (error instanceof Anthropic.BadRequestError) return failure('bad_request', 400);
    if (error instanceof Anthropic.APIError) return failure('upstream', 502);
    // API'ye gitmeyen istemci hatası ve ortamda kimlik yok: SDK kimliği çözemedi (akış bunu AnthropicError'a sarar).
    if (!hasCredentialEnv()) return failure('not_configured', 503);
    console.error('[program-assistant]', error);
    // Yanıt geldi ama yapılandırılmış çıktı ayrıştırılamadı.
    if (error instanceof Anthropic.AnthropicError) return failure('invalid_output', 502);
    return failure('upstream', 502);
  }
}
