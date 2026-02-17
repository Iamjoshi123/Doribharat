import { loadConfig } from './config/env';
import { createServer } from './server';
import { logInfo, logError } from './lib/logging';

const config = loadConfig();
const app = createServer(config);

const start = async () => {
  try {
    app.listen(config.port, '0.0.0.0', () => {
      logInfo('Backend service started', {
        port: config.port,
        project: config.googleCloudProject || 'unset'
      });
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logError('Failed to start backend service', { error: errorMessage });
    process.exit(1);
  }
};

start();
