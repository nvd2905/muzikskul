import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const KEY_SALT = 'muzikskul-wallet-v1'

let cachedKey: Buffer | null = null

function getKey(): Buffer {
  if (cachedKey) return cachedKey
  const secret = process.env.WALLET_ENCRYPTION_KEY
  if (!secret) throw new Error('WALLET_ENCRYPTION_KEY is not set')
  cachedKey = scryptSync(secret, KEY_SALT, 32)
  return cachedKey
}

export function encryptField(value: string): string {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return [iv, authTag, encrypted].map(buf => buf.toString('base64')).join('.')
}

export function decryptField(payload: string): string {
  const [ivB64, authTagB64, dataB64] = payload.split('.')
  if (!ivB64 || !authTagB64 || !dataB64) throw new Error('Invalid encrypted payload')
  const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivB64, 'base64'))
  decipher.setAuthTag(Buffer.from(authTagB64, 'base64'))
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()])
  return decrypted.toString('utf8')
}
