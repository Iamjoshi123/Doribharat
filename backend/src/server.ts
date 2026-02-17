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

  // Serve static files from the 'public' directory (where Docker puts the frontend build)
  const path = require('path');
  const publicPath = path.join(__dirname, '../public');
  app.use(express.static(publicPath));

  // Mount API routes
  app.use('/api', ordersRouter);

  // Serve index.html for any other route (Client-side routing)
  app.get('*', (_req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });

  return app;
};
