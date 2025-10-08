import { ethers } from 'ethers';
import type { SignableMessage } from '../interfaces/SignableMessage';
import type { SingleSignature, SignatureAggregate } from '../interfaces/SignerStrategy';
import { SignatureVerificationError } from '../errors/EngineDexError';

/**
 * Verify a single signature
 */
export async function verifySingleSignature(signature: SingleSignature): Promise<boolean> {
  try {
    const recoveredAddress = ethers.verifyTypedData(
      signature.message.domain,
      signature.message.types,
      signature.message.message,
      signature.signature
    );

    return recoveredAddress.toLowerCase() === signature.signer.toLowerCase();
  } catch (error) {
    throw new SignatureVerificationError(
      signature.signature,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Verify a multi-signature
 */
export async function verifyMultiSignature(signature: SignatureAggregate): Promise<boolean> {
  try {
    let validSignatures = 0;

    for (let i = 0; i < signature.signatures.length; i++) {
      const sig = signature.signatures[i];
      const expectedSigner = signature.signers[i];

      try {
        const recoveredAddress = ethers.verifyTypedData(
          signature.message.domain,
          signature.message.types,
          signature.message.message,
          sig
        );

        if (recoveredAddress.toLowerCase() === expectedSigner.toLowerCase()) {
          validSignatures++;
        }
      } catch (error) {
        // Individual signature verification failed, continue with others
        continue;
      }
    }

    return validSignatures >= signature.threshold;
  } catch (error) {
    throw new SignatureVerificationError(
      signature.signatures.join(','),
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Recover signer address from a signature
 */
export function recoverSigner(message: SignableMessage, signature: string): string {
  try {
    return ethers.verifyTypedData(
      message.domain,
      message.types,
      message.message,
      signature
    );
  } catch (error) {
    throw new SignatureVerificationError(
      signature,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Validate message structure
 */
export function validateMessageStructure(message: SignableMessage): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check domain
  if (!message.domain || typeof message.domain !== 'object') {
    errors.push('Invalid domain');
  } else {
    const { name, version, chainId, verifyingContract } = message.domain;
    
    if (!name || typeof name !== 'string') {
      errors.push('Invalid domain name');
    }
    
    if (!version || typeof version !== 'string') {
      errors.push('Invalid domain version');
    }
    
    if (typeof chainId !== 'number' || chainId <= 0) {
      errors.push('Invalid chain ID');
    }
    
    if (!verifyingContract || typeof verifyingContract !== 'string' || !verifyingContract.startsWith('0x')) {
      errors.push('Invalid verifying contract');
    }
  }

  // Check types
  if (!message.types || typeof message.types !== 'object') {
    errors.push('Invalid types');
  }

  // Check primary type
  if (!message.primaryType || typeof message.primaryType !== 'string') {
    errors.push('Invalid primary type');
  }

  // Check message
  if (!message.message || typeof message.message !== 'object') {
    errors.push('Invalid message');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate nonce
 */
export function validateNonce(nonce: bigint, usedNonces: Set<string>): boolean {
  const nonceStr = nonce.toString();
  return !usedNonces.has(nonceStr) && nonce > 0n;
}

/**
 * Validate deadline
 */
export function validateDeadline(deadline: bigint): boolean {
  const now = BigInt(Math.floor(Date.now() / 1000));
  return deadline > now;
}
