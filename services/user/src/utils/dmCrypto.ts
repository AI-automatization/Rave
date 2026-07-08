import crypto from 'crypto';
import { logger } from '@shared/utils/logger';

// At-rest encryption for DM message text (AES-256-GCM), like Telegram cloud chats:
// the server holds the key (DM_ENCRYPTION_KEY), messages are ciphertext in MongoDB,
// transit stays TLS/WSS. This protects against a database leak.
//
// Stored format: `enc:v1:` + base64( iv[12] | authTag[16] | ciphertext ).
// Backward compatible: values without the prefix are treated as legacy plaintext.

const ALGO = 'aes-256-gcm';
const PREFIX = 'enc:v1:';
const IV_LEN = 12;
const TAG_LEN = 16;

let cachedKey: Buffer | null | undefined;

function getKey(): Buffer | null {
  if (cachedKey !== undefined) return cachedKey;
  const raw = process.env.DM_ENCRYPTION_KEY;
  if (!raw) {
    cachedKey = null;
    logger.warn('DM_ENCRYPTION_KEY not set — DM messages stored in plaintext');
    return null;
  }
  // Accept a 64-char hex string or base64; must decode to exactly 32 bytes.
  const buf = /^[0-9a-fA-F]{64}$/.test(raw) ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64');
  cachedKey = buf.length === 32 ? buf : null;
  if (!cachedKey) logger.error('DM_ENCRYPTION_KEY is not 32 bytes — encryption disabled');
  return cachedKey;
}

export function encryptText(plain: string): string {
  const key = getKey();
  if (!key) return plain; // no/invalid key → store as-is (dev fallback)
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, enc]).toString('base64');
}

export function decryptText(stored: string): string {
  if (!stored || !stored.startsWith(PREFIX)) return stored; // legacy plaintext
  const key = getKey();
  if (!key) return '[encrypted]';
  try {
    const data = Buffer.from(stored.slice(PREFIX.length), 'base64');
    const iv = data.subarray(0, IV_LEN);
    const tag = data.subarray(IV_LEN, IV_LEN + TAG_LEN);
    const enc = data.subarray(IV_LEN + TAG_LEN);
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
  } catch {
    return '[unable to decrypt]';
  }
}
