/**
 * Paal Ledger — Security & Hash Utilities
 * Uses standard Web Crypto API for secure PIN hashing and backup checksum verification.
 */

/**
 * Generate a random cryptographic hex salt
 */
export function generateSalt(length: number = 16): string {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Hash PIN with salt using SHA-256
 */
export async function hashPin(pin: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${pin}:paal_ledger_secure_salt`);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Compute SHA-256 checksum of a JSON string for backup integrity
 */
export async function computeChecksum(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * In-memory rate limiter for PIN authentication attempts
 */
class PinRateLimiter {
  private failedAttempts: number = 0;
  private lockedUntil: number = 0;

  public isLocked(): { locked: boolean; remainingSeconds: number } {
    const now = Date.now();
    if (now < this.lockedUntil) {
      const remaining = Math.ceil((this.lockedUntil - now) / 1000);
      return { locked: true, remainingSeconds: remaining };
    }
    return { locked: false, remainingSeconds: 0 };
  }

  public recordFailure(): { locked: boolean; remainingSeconds: number; attemptsLeft: number } {
    this.failedAttempts += 1;
    if (this.failedAttempts >= 5) {
      this.lockedUntil = Date.now() + 30000; // 30 seconds lockout
      this.failedAttempts = 0;
      return { locked: true, remainingSeconds: 30, attemptsLeft: 0 };
    }
    return {
      locked: false,
      remainingSeconds: 0,
      attemptsLeft: 5 - this.failedAttempts,
    };
  }

  public reset(): void {
    this.failedAttempts = 0;
    this.lockedUntil = 0;
  }
}

export const pinLimiter = new PinRateLimiter();
