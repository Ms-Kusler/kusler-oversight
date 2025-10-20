import crypto from 'crypto';

const DEFAULT_KEY = 'kusler-oversight-default-encryption-key-change-in-prod';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || DEFAULT_KEY;
const IV_LENGTH = 16;
const ALGORITHM = 'aes-256-cbc';

if (ENCRYPTION_KEY === DEFAULT_KEY && process.env.NODE_ENV === 'production') {
  throw new Error(
    'CRITICAL SECURITY ERROR: Default encryption key detected in production! ' +
    'Set ENCRYPTION_KEY environment variable to a strong, unique key before deploying.'
  );
}

if (ENCRYPTION_KEY === DEFAULT_KEY) {
  console.warn(
    '⚠️  WARNING: Using default encryption key in development. ' +
    'Set ENCRYPTION_KEY environment variable for production.'
  );
}

function getKey(): Buffer {
  return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = Buffer.from(parts[1], 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
  return decrypted.toString('utf8');
}

export function encryptCredentials(credentials: Record<string, string>): string {
  return encrypt(JSON.stringify(credentials));
}

export function decryptCredentials(encryptedData: string): Record<string, string> {
  try {
    return JSON.parse(decrypt(encryptedData));
  } catch (error) {
    console.error('Failed to decrypt credentials:', error);
    return {};
  }
}
