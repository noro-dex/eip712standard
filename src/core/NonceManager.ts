/**
 * Client-side nonce generation and tracking
 * Prevents replay attacks and ensures message uniqueness
 */

export interface NonceState {
  current: bigint;
  used: Set<string>;
  lastUpdated: number;
}

export class NonceManager {
  private nonceState: NonceState;
  private readonly maxAge: number; // Maximum age for nonce state in milliseconds

  constructor(
    initialNonce: bigint = 0n,
    maxAge: number = 24 * 60 * 60 * 1000 // 24 hours
  ) {
    this.nonceState = {
      current: initialNonce,
      used: new Set(),
      lastUpdated: Date.now()
    };
    this.maxAge = maxAge;
  }

  /**
   * Generate the next nonce
   */
  generateNonce(): bigint {
    this.cleanup();
    const nonce = this.nonceState.current;
    this.nonceState.current += 1n;
    this.nonceState.lastUpdated = Date.now();
    return nonce;
  }

  /**
   * Mark a nonce as used
   */
  markNonceUsed(nonce: bigint): void {
    this.cleanup();
    this.nonceState.used.add(nonce.toString());
  }

  /**
   * Check if a nonce has been used
   */
  isNonceUsed(nonce: bigint): boolean {
    this.cleanup();
    return this.nonceState.used.has(nonce.toString());
  }

  /**
   * Validate a nonce (not used and not too old)
   */
  validateNonce(nonce: bigint): boolean {
    this.cleanup();
    return !this.isNonceUsed(nonce) && this.isNonceValid(nonce);
  }

  /**
   * Check if nonce is valid (not too old)
   */
  private isNonceValid(nonce: bigint): boolean {
    // For now, accept any nonce >= current - 1000
    // This allows for some flexibility in nonce ordering
    return nonce >= (this.nonceState.current - 1000n);
  }

  /**
   * Clean up old nonce state
   */
  private cleanup(): void {
    const now = Date.now();
    if (now - this.nonceState.lastUpdated > this.maxAge) {
      this.nonceState.used.clear();
      this.nonceState.lastUpdated = now;
    }
  }

  /**
   * Get current nonce state
   */
  getState(): NonceState {
    this.cleanup();
    return {
      current: this.nonceState.current,
      used: new Set(this.nonceState.used),
      lastUpdated: this.nonceState.lastUpdated
    };
  }

  /**
   * Reset nonce state
   */
  reset(initialNonce: bigint = 0n): void {
    this.nonceState = {
      current: initialNonce,
      used: new Set(),
      lastUpdated: Date.now()
    };
  }

  /**
   * Sync with backend nonce state
   * This would typically be called after successful message submission
   */
  syncWithBackend(backendNonce: bigint): void {
    this.nonceState.current = backendNonce + 1n;
    this.nonceState.lastUpdated = Date.now();
  }
}
