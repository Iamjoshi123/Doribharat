import Fastify, { FastifyInstance } from 'fastify';
import { AppConfig } from './config/env';

export const createServer = (config: AppConfig): FastifyInstance => {
  const app = Fastify({
    logger: true
  });

  app.get('/health', async () => ({ status: 'ok' }));

  app.get('/config', async () => ({
    project: config.googleCloudProject,
    dbInstance: config.dbInstance,
    dbName: config.dbName,
    cloudSqlConnectionName: config.cloudSqlConnectionName,
    gcsBucket: config.gcsBucket
  }));

  return app;
};
