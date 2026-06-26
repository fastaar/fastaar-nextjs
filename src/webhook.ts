import crypto from 'node:crypto';
import { WebhookEvent } from './types';

/**
 * Verify the X-Fastaar-Signature header (`t=<ts>,v1=<hmac>`) against the
 * raw request body using your merchant webhook secret.
 *
 * @param secret Your merchant webhook secret
 * @param rawBody The raw request body string or Buffer
 * @param signatureHeader The value of the X-Fastaar-Signature header
 * @param toleranceSeconds Allowed drift in seconds. Defaults to 300 (5 minutes).
 * @returns boolean
 */
export function verifyWebhookSignature(
  secret: string,
  rawBody: string | Buffer,
  signatureHeader: string | null | undefined,
  toleranceSeconds = 300
): boolean {
  const match = /^t=(\d+),v1=([a-f0-9]{64})$/.exec(signatureHeader ?? '');

  if (!match) {
    return false;
  }

  const timestamp = Number(match[1]);

  if (Math.abs(Date.now() / 1000 - timestamp) > toleranceSeconds) {
    return false;
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(match[2]));
  } catch {
    return false;
  }
}

/**
 * Verifies and parses a webhook event request from a Next.js App Router Route Handler.
 * It automatically reads the request's raw text body, verifies the signature, and
 * returns the parsed event object.
 *
 * @param req The Request (or NextRequest) object from the Route Handler
 * @param secret The webhook secret. Defaults to process.env.FASTAAR_WEBHOOK_SECRET.
 * @returns {Promise<{ isValid: boolean; event: WebhookEvent | null }>}
 */
export async function verifyNextWebhook(
  req: Request,
  secret?: string
): Promise<{ isValid: boolean; event: WebhookEvent | null }> {
  const webhookSecret = secret ?? process.env.FASTAAR_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('Fastaar webhook secret is required for verification.');
  }

  const signature = req.headers.get('x-fastaar-signature') || req.headers.get('X-Fastaar-Signature');
  if (!signature) {
    return { isValid: false, event: null };
  }

  try {
    // Clone the request to avoid locking the stream if accessed again
    const clonedReq = req.clone();
    const rawBody = await clonedReq.text();

    const isValid = verifyWebhookSignature(webhookSecret, rawBody, signature);
    if (!isValid) {
      return { isValid: false, event: null };
    }

    const event = JSON.parse(rawBody) as WebhookEvent;
    return { isValid: true, event };
  } catch {
    return { isValid: false, event: null };
  }
}
