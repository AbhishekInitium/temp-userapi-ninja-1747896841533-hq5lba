
/**
 * Utility for encrypting and decrypting sensitive data
 * Using native Web Crypto API for secure client-side encryption
 */

// Generate a consistent encryption key based on domain to avoid losing data across sessions
const getEncryptionKey = async (): Promise<CryptoKey> => {
  // Create a deterministic but reasonably secure key based on domain
  const domain = window.location.hostname;
  const keyMaterial = new TextEncoder().encode(`lovable-api-client-${domain}`);
  
  // Import the key material
  const baseKey = await crypto.subtle.importKey(
    'raw',
    keyMaterial,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  
  // Derive the actual encryption key
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode('lovable-api-salt'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

// Encrypt sensitive data
export const encryptData = async (data: string): Promise<string> => {
  try {
    const key = await getEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12)); // AES-GCM recommends 12 bytes IV
    
    const encodedData = new TextEncoder().encode(data);
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedData
    );
    
    // Combine IV and encrypted data and encode as base64
    const result = new Uint8Array(iv.length + encryptedData.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(encryptedData), iv.length);
    
    return btoa(String.fromCharCode(...new Uint8Array(result)));
  } catch (error) {
    console.error('Encryption error:', error);
    return data; // Fallback to unencrypted data
  }
};

// Decrypt sensitive data
export const decryptData = async (encryptedData: string): Promise<string> => {
  try {
    if (!encryptedData) return '';
    
    const key = await getEncryptionKey();
    
    // Decode the base64 string
    const encryptedBytes = new Uint8Array(
      atob(encryptedData)
        .split('')
        .map(char => char.charCodeAt(0))
    );
    
    // Extract IV (first 12 bytes)
    const iv = encryptedBytes.slice(0, 12);
    const data = encryptedBytes.slice(12);
    
    // Decrypt
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    return new TextDecoder().decode(decryptedData);
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedData; // Return original if decryption fails
  }
};

// Check if a string is likely encrypted (starts with our format)
export const isEncrypted = (data: string): boolean => {
  try {
    if (!data) return false;
    const decoded = atob(data);
    // At minimum, we expect IV (12 bytes) + some encrypted data
    return decoded.length > 12;
  } catch (e) {
    return false; // Not base64, so not encrypted
  }
};
