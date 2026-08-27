/**
 * Simple XOR-based encryption for API keys in localStorage.
 * NOT cryptographically secure, but prevents casual inspection.
 * For production: use server-side key management or Web Crypto API with proper key derivation.
 */

const ENCRYPTION_KEY = 'persian-ai-chatbox-2024'; // Static key for XOR

/**
 * Encrypt a string using XOR cipher
 */
export function encryptData(plaintext: string): string {
  if (!plaintext) return '';

  let encrypted = '';
  for (let i = 0; i < plaintext.length; i++) {
    const charCode = plaintext.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
    encrypted += String.fromCharCode(charCode);
  }

  // Base64 encode to make it safe for localStorage
  return btoa(encrypted);
}

/**
 * Decrypt a string using XOR cipher
 */
export function decryptData(ciphertext: string): string {
  if (!ciphertext) return '';

  try {
    // Base64 decode first
    const encrypted = atob(ciphertext);

    let decrypted = '';
    for (let i = 0; i < encrypted.length; i++) {
      const charCode = encrypted.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      decrypted += String.fromCharCode(charCode);
    }

    return decrypted;
  } catch (e) {
    console.warn('[Crypto] Decryption failed:', e);
    return '';
  }
}

/**
 * Encrypt API keys in settings object
 */
export function encryptAPIKeys(settings: any): any {
  const encrypted = JSON.parse(JSON.stringify(settings)); // Deep clone

  if (encrypted.providers?.gemini?.apiKey) {
    encrypted.providers.gemini.apiKey = encryptData(encrypted.providers.gemini.apiKey);
  }
  if (encrypted.providers?.openai?.apiKey) {
    encrypted.providers.openai.apiKey = encryptData(encrypted.providers.openai.apiKey);
  }
  if (encrypted.providers?.anthropic?.apiKey) {
    encrypted.providers.anthropic.apiKey = encryptData(encrypted.providers.anthropic.apiKey);
  }
  if (encrypted.providers?.custom?.apiKey) {
    encrypted.providers.custom.apiKey = encryptData(encrypted.providers.custom.apiKey);
  }

  return encrypted;
}

/**
 * Decrypt API keys in settings object
 */
export function decryptAPIKeys(settings: any): any {
  const decrypted = JSON.parse(JSON.stringify(settings)); // Deep clone

  if (decrypted.providers?.gemini?.apiKey) {
    decrypted.providers.gemini.apiKey = decryptData(decrypted.providers.gemini.apiKey);
  }
  if (decrypted.providers?.openai?.apiKey) {
    decrypted.providers.openai.apiKey = decryptData(decrypted.providers.openai.apiKey);
  }
  if (decrypted.providers?.anthropic?.apiKey) {
    decrypted.providers.anthropic.apiKey = decryptData(decrypted.providers.anthropic.apiKey);
  }
  if (decrypted.providers?.custom?.apiKey) {
    decrypted.providers.custom.apiKey = decryptData(decrypted.providers.custom.apiKey);
  }

  return decrypted;
}
