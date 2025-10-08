/**
 * Signature types and utilities
 */

export interface SignatureData {
  r: string;
  s: string;
  v: number;
}

export interface ECDSASignature extends SignatureData {
  recoveryId: number;
}

export interface SchnorrSignature {
  r: string;
  s: string;
}

/**
 * Signature verification result
 */
export interface SignatureVerification {
  isValid: boolean;
  signer: string;
  recoveredAddress: string;
  error?: string;
}

/**
 * Multi-signature verification result
 */
export interface MultiSignatureVerification {
  isValid: boolean;
  validSignatures: number;
  requiredThreshold: number;
  signers: string[];
  errors: string[];
}

/**
 * Signature aggregation methods
 */
export enum AggregationMethod {
  ECDSA = 'ecdsa',
  SCHNORR = 'schnorr'
}

/**
 * Signature threshold configuration
 */
export interface SignatureThreshold {
  required: number;
  total: number;
  signers: string[];
}
