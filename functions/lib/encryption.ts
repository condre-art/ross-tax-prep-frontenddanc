/**
 * Encryption Utilities for Ross Tax Prep
 * 
 * Provides encryption/decryption for sensitive data:
 * - SSN (Social Security Numbers)
 * - Tax return data
 * - Bank account numbers
 * - Other PII (Personally Identifiable Information)
 * 
 * Uses Web Crypto API (available in Cloudflare Workers)
 */

export class EncryptionService {
  private encryptionKey: CryptoKey | null = null;

  /**
   * Initialize encryption service with key
   * @param keyString - Base64 encoded encryption key
   */
  async initialize(keyString: string): Promise<void> {
    const keyData = this.base64ToArrayBuffer(keyString);
    this.encryptionKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt sensitive data
   * @param plaintext - Data to encrypt
   * @returns Encrypted data as base64 string with IV prepended
   */
  async encrypt(plaintext: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Encryption service not initialized');
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    // Generate random IV (Initialization Vector)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      this.encryptionKey,
      data
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);

    return this.arrayBufferToBase64(combined);
  }

  /**
   * Decrypt encrypted data
   * @param ciphertext - Base64 encoded encrypted data with IV
   * @returns Decrypted plaintext
   */
  async decrypt(ciphertext: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Encryption service not initialized');
    }

    const combined = this.base64ToArrayBuffer(ciphertext);

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      this.encryptionKey,
      data
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  /**
   * Hash sensitive data for comparison (one-way)
   * @param data - Data to hash
   * @returns Base64 encoded hash
   */
  async hash(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    return this.arrayBufferToBase64(new Uint8Array(hashBuffer));
  }

  /**
   * Generate a random encryption key
   * @returns Base64 encoded key
   */
  static async generateKey(): Promise<string> {
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    const exported = await crypto.subtle.exportKey('raw', key);
    return EncryptionService.prototype.arrayBufferToBase64(new Uint8Array(exported));
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert base64 string to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

/**
 * Password hashing using bcrypt-compatible algorithm
 * Note: In production, use a proper bcrypt library or delegrate to backend
 */
export class PasswordService {
  /**
   * Hash a password
   * @param password - Plain text password
   * @returns Password hash
   */
  static async hash(password: string): Promise<string> {
    // In Cloudflare Workers, we'll use a simplified PBKDF2 approach
    // For production, consider using a dedicated bcrypt library
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);
    
    // Generate salt
    const salt = crypto.getRandomValues(new Uint8Array(16));
    
    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordData,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    // Derive key
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      256
    );

    // Combine salt and hash
    const hashArray = new Uint8Array(derivedBits);
    const combined = new Uint8Array(salt.length + hashArray.length);
    combined.set(salt, 0);
    combined.set(hashArray, salt.length);

    // Return as base64 with prefix
    return '$pbkdf2$' + this.arrayBufferToBase64(combined);
  }

  /**
   * Verify a password against a hash
   * @param password - Plain text password
   * @param hash - Password hash
   * @returns True if password matches
   */
  static async verify(password: string, hash: string): Promise<boolean> {
    if (!hash.startsWith('$pbkdf2$')) {
      throw new Error('Invalid hash format');
    }

    const hashData = this.base64ToArrayBuffer(hash.substring(8));
    const salt = hashData.slice(0, 16);
    const originalHash = hashData.slice(16);

    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordData,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      256
    );

    const newHash = new Uint8Array(derivedBits);

    // Constant-time comparison
    return this.constantTimeCompare(newHash, new Uint8Array(originalHash));
  }

  /**
   * Constant-time comparison to prevent timing attacks
   */
  private static constantTimeCompare(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a[i] ^ b[i];
    }
    return result === 0;
  }

  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

/**
 * TOTP (Time-based One-Time Password) implementation for 2FA
 */
export class TOTPService {
  /**
   * Generate a random TOTP secret
   * @returns Base32 encoded secret
   */
  static generateSecret(): string {
    const buffer = crypto.getRandomValues(new Uint8Array(20));
    return this.base32Encode(buffer);
  }

  /**
   * Generate TOTP code for current time
   * @param secret - Base32 encoded secret
   * @returns 6-digit TOTP code
   */
  static async generateCode(secret: string, timeStep: number = 30): Promise<string> {
    const time = Math.floor(Date.now() / 1000 / timeStep);
    return this.generateCodeForTime(secret, time);
  }

  /**
   * Verify TOTP code
   * @param code - 6-digit code to verify
   * @param secret - Base32 encoded secret
   * @param window - Number of time steps to check (for clock drift)
   * @returns True if code is valid
   */
  static async verifyCode(code: string, secret: string, window: number = 1): Promise<boolean> {
    const time = Math.floor(Date.now() / 1000 / 30);

    for (let i = -window; i <= window; i++) {
      const expectedCode = await this.generateCodeForTime(secret, time + i);
      if (code === expectedCode) {
        return true;
      }
    }

    return false;
  }

  private static async generateCodeForTime(secret: string, time: number): Promise<string> {
    const key = this.base32Decode(secret);
    const timeBuffer = new ArrayBuffer(8);
    const timeView = new DataView(timeBuffer);
    timeView.setUint32(4, time, false);

    const keyObj = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', keyObj, timeBuffer);
    const signatureArray = new Uint8Array(signature);

    const offset = signatureArray[signatureArray.length - 1] & 0x0f;
    const binary =
      ((signatureArray[offset] & 0x7f) << 24) |
      ((signatureArray[offset + 1] & 0xff) << 16) |
      ((signatureArray[offset + 2] & 0xff) << 8) |
      (signatureArray[offset + 3] & 0xff);

    const code = binary % 1000000;
    return code.toString().padStart(6, '0');
  }

  private static base32Encode(buffer: Uint8Array): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    let output = '';

    for (let i = 0; i < buffer.length; i++) {
      value = (value << 8) | buffer[i];
      bits += 8;

      while (bits >= 5) {
        output += alphabet[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }

    if (bits > 0) {
      output += alphabet[(value << (5 - bits)) & 31];
    }

    return output;
  }

  private static base32Decode(base32: string): Uint8Array {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    let index = 0;
    const output = new Uint8Array(Math.ceil((base32.length * 5) / 8));

    for (let i = 0; i < base32.length; i++) {
      const char = base32[i].toUpperCase();
      const idx = alphabet.indexOf(char);
      if (idx === -1) continue;

      value = (value << 5) | idx;
      bits += 5;

      if (bits >= 8) {
        output[index++] = (value >>> (bits - 8)) & 255;
        bits -= 8;
      }
    }

    return output;
  }
}
