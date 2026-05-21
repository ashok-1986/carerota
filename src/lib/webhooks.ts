import { createHmac } from 'crypto';
import { getActiveWebhooks } from '@/db/queries/webhooks';

export async function fireWebhook(homeId: string, event: string, payload: object) {
  try {
    const webhooks = await getActiveWebhooks(homeId);
    for (const webhook of webhooks) {
      if (!webhook.events.includes(event)) continue;
      
      const signature = createHmac('sha256', webhook.secret)
        .update(JSON.stringify(payload))
        .digest('hex');
        
      fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CareRota-Signature': `sha256=${signature}`,
          'X-CareRota-Event': event,
        },
        body: JSON.stringify({ event, timestamp: new Date().toISOString(), data: payload }),
      }).catch(() => {}); // fire and forget, never throw
    }
  } catch (error) {
    console.error('Error firing webhooks:', error);
  }
}
