import { PubSub } from '@google-cloud/pubsub';
import { logError, logInfo, logWarning } from '../lib/logging';
import { ContactDetails, LineItem } from './types';

export interface WhatsappMessageRequest {
  orderId: number;
  contact: ContactDetails;
  lineItems: LineItem[];
  webhookUrl?: string;
}

let pubsub: PubSub | null = null;
if (process.env.DISABLE_GCP_SERVICES !== 'true') {
  try {
    pubsub = new PubSub({ projectId: process.env.GCLOUD_PROJECT });
  } catch (e) {
    console.warn('Failed to init PubSub', e);
  }
}

const whatsappTopic = process.env.WHATSAPP_TOPIC;

export async function enqueueWhatsappWebhook(payload: WhatsappMessageRequest) {
  if (!whatsappTopic) {
    await logWarning('WhatsApp topic not configured, skipping webhook enqueue', { orderId: payload.orderId });
    return { status: 'skipped' as const, reason: 'topic_not_configured' };
  }

  if (!pubsub) {
    await logWarning('PubSub not initialized (DISABLE_GCP_SERVICES=true), skipping webhook', { orderId: payload.orderId });
    return { status: 'skipped' as const, reason: 'pubsub_disabled' };
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
