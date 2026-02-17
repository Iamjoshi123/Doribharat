import express, { Express } from 'express';
import cors from 'cors';
import { AppConfig } from './config/env';
import ordersRouter from './routes/orders';

export const createServer = (config: AppConfig): Express => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', async (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/', async (_req, res) => {
    res.json({
      message: 'Doribharat API is running',
      endpoints: {
        health: '/health',
        config: '/config',
        orders: '/api/orders'
      }
    });
  });

  app.get('/config', async (_req, res) => {
    res.json({
      project: config.googleCloudProject,
      dbInstance: config.dbInstance,
      dbName: config.dbName,
      cloudSqlConnectionName: config.cloudSqlConnectionName,
      gcsBucket: config.gcsBucket
    });
  });

  // Mount API routes
  app.use('/api', ordersRouter);

  // Catch-all 404 handler
  app.use((req, res) => {
    console.log(`404 Not Found: ${req.method} ${req.path}`);
    res.status(404).json({
      error: 'Route not found',
      path: req.path,
      method: req.method,
      note: 'If you see this, the new code IS running.'
    });
  });

  return app;
};
