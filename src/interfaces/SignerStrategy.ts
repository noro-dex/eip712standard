import type { SignableMessage } from './SignableMessage';

/**
 * Signature result for single-sign operations
 */
export interface SingleSignature {
  signature: string;
  signer: string;
  message: SignableMessage;
}

/**
 * Signature result for multi-sign operations
 */
export interface SignatureAggregate {
  signatures: string[];
  signers: string[];
  threshold: number;
  message: SignableMessage;
  aggregateSignature?: string;
}

/**
 * Union type for all signature results
 */
export type SignatureResult = SingleSignature | SignatureAggregate;

/**
 * Strategy interface for different signing approaches
 */
export interface SignerStrategy {
  /**
   * Sign a message using the implemented strategy
   */
  signMessage(message: SignableMessage): Promise<SignatureResult>;
  
  /**
   * Verify a signature result
   */
  verifySignature(signature: SignatureResult): Promise<boolean>;
  
  /**
   * Get the strategy type
   */
  getStrategyType(): 'single' | 'multi';
  
  /**
   * Check if the strategy supports the given message type
   */
  supportsMessage(message: SignableMessage): boolean;
}

/**
 * Configuration for signing strategies
 */
export interface SignerConfig {
  threshold?: number;
  signers?: string[];
  timeout?: number;
  retries?: number;
}

/**
 * Multi-sign specific configuration
 */
export interface MultiSignConfig extends SignerConfig {
  threshold: number;
  signers: string[];
  aggregationMethod?: 'ecdsa' | 'schnorr';
}
