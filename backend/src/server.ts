import express, { Express } from 'express';
import cors from 'cors';
import { AppConfig } from './config/env';
import ordersRouter from './routes/orders';

export const createServer = (config: AppConfig): Express => {
  const app = express();

  app.use(cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (config.corsAllowedOrigins.length === 0 || config.corsAllowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key', 'x-frontend-origin'],
    credentials: false,
  }));
  app.use(express.json());

  app.get('/health', async (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/', async (_req, res) => {
    res.json({
      message: 'Doribharat API is running',
      endpoints: {
        health: '/health',
        orders: '/v1/orders'
      }
    });
  });


  if (config.enableDebugEndpoints) {
    app.get('/config', async (_req, res) => {
      res.json({
        project: config.googleCloudProject,
        dbName: config.dbName,
        gcsBucket: config.gcsBucket,
      });
    });
  }

  // Mount API routes (legacy + versioned alias)
  // Serve static files from the 'public' directory (where Docker puts the frontend build)
  const path = require('path');
  const publicPath = path.join(__dirname, '../public');
  app.use(express.static(publicPath));

  // Mount API routes
  app.use('/api', ordersRouter);
  app.use('/v1', ordersRouter);

  // Serve index.html for any other route (Client-side routing)
  app.get('*', (_req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });

  return app;
};
