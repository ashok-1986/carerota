import { createHmac, randomUUID } from 'crypto';
import { getActiveWebhooks, markWebhookTriggered } from '@/db/queries/webhooks';
import { decryptSecret } from '@/lib/crypto';

const DELIVERY_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1_000;

interface DeliveryResult {
  webhookId: string;
  url: string;
  ok: boolean;
  status?: number;
  attempts: number;
  error?: string;
}

export async function fireWebhook(homeId: string, event: string, payload: object): Promise<DeliveryResult[]> {
  const results: DeliveryResult[] = [];

  try {
    const activeWebhooks = await getActiveWebhooks(homeId);
    for (const webhook of activeWebhooks) {
      if (!webhook.events.includes(event)) continue;

      // Decrypt the signing secret at delivery time; secrets are encrypted at rest.
      let secret: string;
      try {
        secret = decryptSecret(webhook.secret);
      } catch (error) {
        console.error(`Webhook ${webhook.id}: failed to decrypt secret`, error);
        results.push({
          webhookId: webhook.id,
          url: webhook.url,
          ok: false,
          attempts: 1,
          error: 'secret-decrypt-failed',
        });
        continue;
      }

      // Timestamp is embedded in the signed body so recipients can verify freshness
      // and reject replay of old payloads.
      const timestamp = new Date().toISOString();
      const body = JSON.stringify({ event, timestamp, data: payload });
      const signature = createHmac('sha256', secret).update(body).digest('hex');
      const deliveryId = randomUUID();

      let delivered = false;
      for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS);
        try {
          const response = await fetch(webhook.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CareRota-Signature': `sha256=${signature}`,
              'X-CareRota-Event': event,
              'X-CareRota-Timestamp': timestamp,
              'X-CareRota-Delivery': deliveryId,
            },
            body,
            signal: controller.signal,
          });

          if (response.ok) {
            delivered = true;
            try {
              await markWebhookTriggered(webhook.id);
            } catch {
              // Non-fatal: lastTriggeredAt is informational only.
            }
            results.push({
              webhookId: webhook.id,
              url: webhook.url,
              ok: true,
              status: response.status,
              attempts: attempt,
            });
            break;
          }

          console.error(
            `Webhook ${webhook.id} (${event}) attempt ${attempt}/${MAX_RETRIES + 1} ` +
              `failed with status ${response.status}`,
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(
            `Webhook ${webhook.id} (${event}) attempt ${attempt}/${MAX_RETRIES + 1} error: ${message}`,
          );
        } finally {
          clearTimeout(timer);
        }

        if (attempt <= MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
        }
      }

      if (!delivered) {
        results.push({
          webhookId: webhook.id,
          url: webhook.url,
          ok: false,
          attempts: MAX_RETRIES + 1,
          error: 'delivery-failed-after-retries',
        });
      }
    }
  } catch (error) {
    console.error('Error firing webhooks:', error);
  }

  return results;
}
