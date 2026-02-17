import { NextFunction, Request, Response, Router } from 'express';
import { withClient } from '../lib/db';
import { logError, logInfo, logWarning } from '../lib/logging';
import { ContactDetails, LineItem } from '../services/types';
import { enqueueWhatsappWebhook } from '../services/whatsapp';

interface OrderRow {
  id: number;
  customer_name: string;
  email: string | null;
  phone: string | null;
  line_items: unknown;
  notes: string | null;
  message_status: string;
  created_at: string;
}

interface OrderResponse {
  id: number;
  customerName: string;
  email?: string | null;
  phone?: string | null;
  lineItems: LineItem[];
  notes?: string | null;
  messageStatus: string;
  createdAt: string;
}

const router = Router();

const ADMIN_HEADER = 'x-admin-key';

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const adminApiKey = process.env.ADMIN_API_KEY;
  if (!adminApiKey) {
    return res.status(500).json({ error: 'Admin API key not configured' });
  }

  if (req.get(ADMIN_HEADER) !== adminApiKey) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  return next();
}

function normalizeContact(value: unknown): ContactDetails | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const contact = value as Record<string, unknown>;
  const name = typeof contact.name === 'string' ? contact.name.trim() : undefined;
  const phone = typeof contact.phone === 'string' ? contact.phone.trim() : undefined;
  const email = typeof contact.email === 'string' ? contact.email.trim() : undefined;

  if (!name || !phone) {
    return null;
  }

  return { name, phone, email };
}

function normalizeLineItems(value: unknown): LineItem[] | null {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  const normalized: LineItem[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') {
      return null;
    }

    const line = item as Record<string, unknown>;
    const productId = typeof line.productId === 'string' ? line.productId : undefined;
    const quantity = typeof line.quantity === 'number' ? line.quantity : Number(line.quantity);

    if (!productId || !Number.isFinite(quantity) || quantity <= 0) {
      return null;
    }

    const name = typeof line.name === 'string' ? line.name : undefined;
    const price = typeof line.price === 'number' ? line.price : line.price !== undefined ? Number(line.price) : undefined;
    const notes = typeof line.notes === 'string' ? line.notes : undefined;

    normalized.push({
      productId,
      quantity,
      name,
      price,
      notes,
    });
  }

  return normalized;
}

function mapRowToResponse(row: OrderRow): OrderResponse {
  let parsedLineItems: LineItem[] = [];
  try {
    parsedLineItems = typeof row.line_items === 'string'
      ? JSON.parse(row.line_items)
      : (Array.isArray(row.line_items) ? row.line_items as LineItem[] : []);
  } catch (error) {
    void logWarning('Failed to parse line_items from orders row', {
      orderId: row.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return {
    id: row.id,
    customerName: row.customer_name,
    email: row.email,
    phone: row.phone,
    lineItems: parsedLineItems,
    notes: row.notes,
    messageStatus: row.message_status,
    createdAt: row.created_at,
  };
}

router.post('/orders', async (req: Request, res: Response) => {
  const contact = normalizeContact(req.body?.contact);
  const lineItems = normalizeLineItems(req.body?.lineItems);
  const notes = typeof req.body?.notes === 'string' ? req.body.notes : undefined;
  const requiresWhatsapp = Boolean(req.body?.requiresWhatsapp);

  if (!contact || !lineItems) {
    return res.status(400).json({ error: 'A contact with name and phone plus at least one valid line item are required.' });
  }

  const initialMessageStatus = requiresWhatsapp ? 'pending' : 'not_requested';

  try {
    const createdOrder = await withClient(async (client) => {
      const insert = await client.query<OrderRow>(
        `INSERT INTO orders (customer_name, email, phone, line_items, notes, message_status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING id, customer_name, email, phone, line_items, notes, message_status, created_at`,
        [contact.name, contact.email ?? null, contact.phone, JSON.stringify(lineItems), notes ?? null, initialMessageStatus],
      );

      return insert.rows[0];
    });

    let messageStatus = createdOrder.message_status;

    if (requiresWhatsapp) {
      const publishResult = await enqueueWhatsappWebhook({
        orderId: createdOrder.id,
        contact,
        lineItems,
      });

      if (publishResult.status === 'queued') {
        messageStatus = 'queued';
      } else if (publishResult.status === 'skipped') {
        messageStatus = 'skipped';
      } else if (publishResult.status === 'failed') {
        messageStatus = 'failed';
      }

      if (messageStatus !== createdOrder.message_status) {
        await withClient(async (client) => {
          await client.query('UPDATE orders SET message_status = $1 WHERE id = $2', [messageStatus, createdOrder.id]);
        });
      }
    }

    await logInfo('Order created', {
      orderId: createdOrder.id,
      messageStatus,
      requiresWhatsapp,
      lineItemCount: lineItems.length,
    });

    return res.status(201).json({ orderId: createdOrder.id, messageStatus });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logError('Failed to create order', { error: errorMessage });
    return res.status(500).json({ error: 'Unable to create order at this time.' });
  }
});

router.get('/orders', requireAdmin, async (req: Request, res: Response) => {
  const limitParam = req.query.limit;
  const limit = typeof limitParam === 'string' ? Number(limitParam) : undefined;
  const boundedLimit = limit && Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 200) : 50;

  try {
    const orders = await withClient(async (client) => {
      const result = await client.query<OrderRow>(
        `SELECT id, customer_name, email, phone, line_items, notes, message_status, created_at
         FROM orders
         ORDER BY created_at DESC
         LIMIT $1`,
        [boundedLimit],
      );

      return result.rows.map(mapRowToResponse);
    });

    await logInfo('Admin fetched orders', { count: orders.length });
    return res.json({ orders });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logError('Failed to fetch orders', { error: errorMessage });
    return res.status(500).json({ error: 'Unable to fetch orders.' });
  }
});

router.get('/orders/:id', requireAdmin, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'Order id must be numeric.' });
  }

  try {
    const order = await withClient(async (client) => {
      const result = await client.query<OrderRow>(
        `SELECT id, customer_name, email, phone, line_items, notes, message_status, created_at
         FROM orders
         WHERE id = $1`,
        [id],
      );

      return result.rows[0];
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    await logInfo('Admin fetched order', { orderId: order.id });
    return res.json(mapRowToResponse(order));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logError('Failed to fetch order', { error: errorMessage, orderId: id });
    return res.status(500).json({ error: 'Unable to fetch order.' });
  }
});

router.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  logError('Unhandled orders route error', { error: errorMessage, path: req.path });
  res.status(500).json({ error: 'Unhandled error.' });
});

export default router;
