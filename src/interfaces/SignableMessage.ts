/**
 * Core interface for EIP-712 signable messages
 * Extends the standard EIP-712 typed data structure
 */

export interface EIP712Domain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: string;
}

export interface EIP712Types {
  [key: string]: Array<{
    name: string;
    type: string;
  }>;
}

export interface SignableMessage {
  domain: EIP712Domain;
  types: EIP712Types;
  primaryType: string;
  message: Record<string, unknown>;
}

/**
 * Extended interface for EngineDex specific messages
 */
export interface EngineDexMessage extends SignableMessage {
  operation: string;
  nonce: bigint;
  deadline: bigint;
}

/**
 * Message validation result
 */
export interface MessageValidation {
  isValid: boolean;
  errors: string[];
}

/**
 * Message creation options
 */
export interface MessageOptions {
  nonce?: bigint;
  deadline?: bigint;
  domain?: Partial<EIP712Domain>;
}
