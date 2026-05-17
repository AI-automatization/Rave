import { fetch as pinnedFetch } from 'react-native-ssl-pinning';

// SHA-256 public key hashes for Railway/Let's Encrypt certificates.
// Includes both leaf cert and intermediate CA (R11) for resilience during cert rotation.
// Refresh these when Railway rotates certificates (every ~90 days).
// Script to regenerate:
//   openssl s_client -connect <host>:443 -showcerts 2>/dev/null \
//     | openssl x509 -pubkey -noout | openssl pkey -pubin -outform DER \
//     | openssl dgst -sha256 -binary | openssl enc -base64
const RAILWAY_PINS = [
  'sGDbTDZa6e6YT2TE9XG0KNYPBuV/4YoqFrebzjQs1Ss=', // leaf cert (auth service, 2026-05-17)
  'y7xVm0TVJNahMr2sZydE2jQH8SquXV9yLF9seROHHHU=', // Let's Encrypt R11 intermediate CA
  'C5+lpZ7tcVwmwQIMcRtPbsQtWLABXhQzejna0wHFr8M=', // ISRG Root X1 (fallback)
];

export interface PinnedFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string;
  timeoutInterval?: number;
}

export async function sslFetch(
  url: string,
  options: PinnedFetchOptions = {},
): Promise<{ status: number; json: () => Promise<unknown>; text: () => Promise<string> }> {
  if (__DEV__) {
    // Skip pinning in development — local backend has self-signed certs
    const res = await globalThis.fetch(url, {
      method: options.method ?? 'GET',
      headers: options.headers,
      body: options.body,
    });
    return res;
  }

  const res = await pinnedFetch(url, {
    method: options.method ?? 'GET',
    headers: options.headers ?? {},
    body: options.body,
    timeoutInterval: options.timeoutInterval ?? 15,
    sslPinning: {
      certs: RAILWAY_PINS,
    },
  });

  return {
    status: res.status,
    json: () => Promise.resolve(res.bodyString ? JSON.parse(res.bodyString) : null),
    text: () => Promise.resolve(res.bodyString ?? ''),
  };
}

/** Refresh Railway leaf cert pin. Run periodically or after 90-day Let's Encrypt rotation. */
export const SSL_CERT_PINS = RAILWAY_PINS;
export const SSL_CERT_LAST_UPDATED = '2026-05-17';
