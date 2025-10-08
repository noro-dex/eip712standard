/**
 * Base error class for EngineDex SDK
 */
export class EngineDexError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, code: string = 'ENGINEDEX_ERROR', details?: Record<string, unknown>) {
    super(message);
    this.name = 'EngineDexError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Invalid nonce error
 */
export class InvalidNonceError extends EngineDexError {
  constructor(nonce: bigint, reason: string) {
    super(`Invalid nonce ${nonce.toString()}: ${reason}`, 'INVALID_NONCE', { nonce: nonce.toString(), reason });
    this.name = 'InvalidNonceError';
  }
}

/**
 * Signature threshold error
 */
export class SignatureThresholdError extends EngineDexError {
  constructor(required: number, provided: number) {
    super(`Insufficient signatures: ${provided}/${required}`, 'SIGNATURE_THRESHOLD_ERROR', { required, provided });
    this.name = 'SignatureThresholdError';
  }
}

/**
 * Wallet connection error
 */
export class WalletConnectionError extends EngineDexError {
  constructor(provider: string, reason: string) {
    super(`Wallet connection failed for ${provider}: ${reason}`, 'WALLET_CONNECTION_ERROR', { provider, reason });
    this.name = 'WalletConnectionError';
  }
}

/**
 * Message validation error
 */
export class MessageValidationError extends EngineDexError {
  constructor(errors: string[]) {
    super(`Message validation failed: ${errors.join(', ')}`, 'MESSAGE_VALIDATION_ERROR', { errors });
    this.name = 'MessageValidationError';
  }
}

/**
 * Signature verification error
 */
export class SignatureVerificationError extends EngineDexError {
  constructor(signature: string, reason: string) {
    super(`Signature verification failed: ${reason}`, 'SIGNATURE_VERIFICATION_ERROR', { signature, reason });
    this.name = 'SignatureVerificationError';
  }
}

/**
 * Network error
 */
export class NetworkError extends EngineDexError {
  constructor(url: string, status: number, message: string) {
    super(`Network request failed: ${message}`, 'NETWORK_ERROR', { url, status, message });
    this.name = 'NetworkError';
  }
}
