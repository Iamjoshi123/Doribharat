import { loadConfig } from './config/env';
import { createServer } from './server';

const config = loadConfig();
const app = createServer(config);

const start = async () => {
  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
    app.log.info({
      port: config.port,
      project: config.googleCloudProject || 'unset'
    }, 'Backend service started');
  } catch (err) {
    app.log.error(err, 'Failed to start backend service');
    process.exit(1);
  }
};

start();
