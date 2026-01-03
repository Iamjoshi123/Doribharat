import http from 'http';
import crypto from 'crypto';
import { randomUUID } from 'crypto';
import { URL } from 'url';

const PORT = process.env.PORT || 4000;
const ADMIN_ORIGIN = process.env.ADMIN_ORIGIN || 'http://localhost:5173';
const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'doribharat-product-media';
const OBJECT_PREFIX = process.env.GCS_UPLOAD_PREFIX || 'uploads';
const SIGNING_TTL_SECONDS = parseInt(process.env.GCS_SIGNING_TTL_SECONDS || '600', 10);
const SERVICE_ACCOUNT_EMAIL = process.env.GCS_SERVICE_ACCOUNT_EMAIL;
const SERVICE_ACCOUNT_KEY = process.env.GCS_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, '\n');

const defaultHeaders = {
  'Access-Control-Allow-Origin': ADMIN_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const error = (res, statusCode, message) => {
  res.writeHead(statusCode, {
    ...defaultHeaders,
    'Content-Type': 'application/json',
  });
  res.end(JSON.stringify({ error: message }));
};

const parseBody = async (req) =>
  new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1e6) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (err) {
        reject(err);
      }
    });
  });

const toTimestamp = (date) => {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, '');
  return `${iso.slice(0, 8)}T${iso.slice(9, 15)}Z`;
};

const buildCanonicalQuery = (params) =>
  params
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

const signUrl = (objectPath, contentType) => {
  if (!SERVICE_ACCOUNT_EMAIL || !SERVICE_ACCOUNT_KEY) {
    throw new Error('Service account credentials are required to sign URLs.');
  }

  const method = 'PUT';
  const now = new Date();
  const timestamp = toTimestamp(now);
  const datestamp = timestamp.slice(0, 8);
  const credentialScope = `${datestamp}/auto/storage/goog4_request`;
  const credential = `${SERVICE_ACCOUNT_EMAIL}/${credentialScope}`;

  const canonicalHeaders = `content-type:${contentType}\nhost:storage.googleapis.com\n`;
  const signedHeaders = 'content-type;host';

  const canonicalQuery = buildCanonicalQuery([
    ['X-Goog-Algorithm', 'GOOG4-RSA-SHA256'],
    ['X-Goog-Credential', credential],
    ['X-Goog-Date', timestamp],
    ['X-Goog-Expires', `${SIGNING_TTL_SECONDS}`],
    ['X-Goog-SignedHeaders', signedHeaders],
  ]);

  const canonicalRequest = [
    method,
    `/${BUCKET_NAME}/${objectPath}`,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    'UNSIGNED-PAYLOAD',
  ].join('\n');

  const hash = crypto.createHash('sha256').update(canonicalRequest).digest('hex');
  const stringToSign = ['GOOG4-RSA-SHA256', timestamp, credentialScope, hash].join('\n');

  const signature = crypto.createSign('RSA-SHA256').update(stringToSign).sign(SERVICE_ACCOUNT_KEY, 'hex');

  const queryWithSignature = `${canonicalQuery}&X-Goog-Signature=${signature}`;
  const uploadUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${encodeURI(objectPath)}?${queryWithSignature}`;
  const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${encodeURI(objectPath)}`;

  return { uploadUrl, publicUrl, expiresAt: new Date(now.getTime() + SIGNING_TTL_SECONDS * 1000).toISOString() };
};

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', ADMIN_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204, defaultHeaders);
    res.end();
    return;
  }

  const url = new URL(req.url || '', `http://${req.headers.host}`);
  if (req.method !== 'POST' || url.pathname !== '/media/sign-upload') {
    error(res, 404, 'Not Found');
    return;
  }

  try {
    const body = await parseBody(req);
    const { filename, contentType, visibility = 'public', prefix } = body;

    if (!filename || !contentType) {
      error(res, 400, 'filename and contentType are required.');
      return;
    }

    const cleanName = filename.replace(/[^a-zA-Z0-9.\\-_]/g, '_');
    const objectPath = `${prefix || OBJECT_PREFIX}/${visibility === 'temp' ? 'temp/' : ''}${randomUUID()}-${cleanName}`;
    const signed = signUrl(objectPath, contentType);

    res.writeHead(200, {
      ...defaultHeaders,
      'Content-Type': 'application/json',
    });
    res.end(
      JSON.stringify({
        bucket: BUCKET_NAME,
        objectPath,
        uploadUrl: signed.uploadUrl,
        publicUrl: signed.publicUrl,
        expiresAt: signed.expiresAt,
        visibility,
      }),
    );
  } catch (err) {
    console.error(err);
    error(res, 500, 'Failed to sign upload URL');
  }
});

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`Media signing server running on http://localhost:${PORT}`);
  });
}

export default server;
