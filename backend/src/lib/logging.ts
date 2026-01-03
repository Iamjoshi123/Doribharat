import { Logging } from '@google-cloud/logging';

type Severity = 'DEBUG' | 'INFO' | 'NOTICE' | 'WARNING' | 'ERROR' | 'CRITICAL' | 'ALERT' | 'EMERGENCY';

const logging = new Logging({ projectId: process.env.GCLOUD_PROJECT });
const log = logging.log(process.env.CLOUD_LOG_NAME ?? 'orders-events');

async function writeLog(severity: Severity, message: string, data?: Record<string, unknown>) {
  const entry = log.entry({
    severity,
    resource: { type: 'global' },
  }, {
    message,
    ...data,
  });

  try {
    await log.write(entry);
  } catch (error) {
    // Cloud Logging failures should not break request handling; surface locally for operators.
    console.error('Failed to write log entry', { error });
  }
}

export async function logInfo(message: string, data?: Record<string, unknown>) {
  await writeLog('INFO', message, data);
}

export async function logWarning(message: string, data?: Record<string, unknown>) {
  await writeLog('WARNING', message, data);
}

export async function logError(message: string, data?: Record<string, unknown>) {
  await writeLog('ERROR', message, data);
}
