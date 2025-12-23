/**
 * Polyfill for crypto.randomUUID
 * Provides a fallback implementation for environments that don't support crypto.randomUUID
 */

// Check if we're in a browser environment with crypto.randomUUID support
const hasCryptoRandomUUID = 
  typeof window !== "undefined" && 
  typeof window.crypto !== "undefined" && 
  typeof window.crypto.randomUUID === "function";

// Check if we're in Node.js with crypto.randomUUID support (Node.js 18+)
const hasNodeCryptoRandomUUID = 
  typeof process !== "undefined" && 
  process.versions?.node && 
  typeof require !== "undefined";

let nodeCrypto: any = null;
if (hasNodeCryptoRandomUUID && !hasCryptoRandomUUID) {
  try {
    nodeCrypto = require("crypto");
  } catch (e) {
    // crypto module not available
  }
}

/**
 * Generate a random UUID v4
 * Uses native crypto.randomUUID if available, otherwise falls back to a polyfill
 */
export function randomUUID(): string {
  // Browser environment with native support
  if (hasCryptoRandomUUID) {
    return window.crypto.randomUUID();
  }
  
  // Node.js environment with native support
  if (nodeCrypto && typeof nodeCrypto.randomUUID === "function") {
    return nodeCrypto.randomUUID();
  }
  
  // Fallback: Generate UUID v4 manually
  return generateUUIDv4();
}

/**
 * Generate a UUID v4 using a fallback implementation
 */
function generateUUIDv4(): string {
  // Generate random values
  const getRandomValues = (arr: Uint8Array) => {
    if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
      return window.crypto.getRandomValues(arr);
    }
    // Fallback for Node.js
    if (nodeCrypto && nodeCrypto.randomBytes) {
      const bytes = nodeCrypto.randomBytes(arr.length);
      arr.set(bytes);
      return arr;
    }
    // Last resort: use Math.random (not cryptographically secure)
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  };

  const bytes = new Uint8Array(16);
  getRandomValues(bytes);
  
  // Set version (4) and variant bits
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10
  
  // Convert to UUID string format
  const hex = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
  
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

// Export as default for easier import
export default { randomUUID };

