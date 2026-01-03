import { PubSub } from '@google-cloud/pubsub';
import { logError, logInfo, logWarning } from '../lib/logging.js';
import { ContactDetails, LineItem } from './types.js';

export interface WhatsappMessageRequest {
  orderId: number;
  contact: ContactDetails;
  lineItems: LineItem[];
  webhookUrl?: string;
}

const pubsub = new PubSub({ projectId: process.env.GCLOUD_PROJECT });
const whatsappTopic = process.env.WHATSAPP_TOPIC;

export async function enqueueWhatsappWebhook(payload: WhatsappMessageRequest) {
  if (!whatsappTopic) {
    await logWarning('WhatsApp topic not configured, skipping webhook enqueue', { orderId: payload.orderId });
    return { status: 'skipped' as const, reason: 'topic_not_configured' };
  }

  const webhookUrl = payload.webhookUrl ?? process.env.WHATSAPP_WEBHOOK_URL;
  const message = {
    orderId: payload.orderId,
    contact: payload.contact,
    lineItems: payload.lineItems,
    webhookUrl,
    source: 'orders-api',
    retryable: true,
  };

  try {
    const messageId = await pubsub.topic(whatsappTopic).publishMessage({ json: message });
    await logInfo('WhatsApp webhook enqueued', { orderId: payload.orderId, messageId, target: webhookUrl });
    return { status: 'queued' as const, messageId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logError('Failed to enqueue WhatsApp webhook', { orderId: payload.orderId, error: errorMessage });
    return { status: 'failed' as const, error: errorMessage };
  }
}
