import { ethers } from 'ethers';

/**
 * Generate a secure random nonce
 */
export function generateSecureNonce(): bigint {
  // Use crypto.getRandomValues for secure randomness
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  
  // Convert to bigint
  let nonce = 0n;
  for (let i = 0; i < array.length; i++) {
    nonce = (nonce << 8n) + BigInt(array[i]);
  }
  
  return nonce;
}

/**
 * Generate a deadline timestamp (current time + seconds)
 */
export function generateDeadline(secondsFromNow: number = 3600): bigint {
  return BigInt(Math.floor(Date.now() / 1000) + secondsFromNow);
}

/**
 * Hash a message using keccak256
 */
export function hashMessage(message: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(message));
}

/**
 * Convert address to checksum format
 */
export function toChecksumAddress(address: string): string {
  return ethers.getAddress(address);
}

/**
 * Validate Ethereum address
 */
export function isValidAddress(address: string): boolean {
  try {
    ethers.getAddress(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate a random salt for message uniqueness
 */
export function generateSalt(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return ethers.hexlify(array);
}

/**
 * Create a message hash for signing
 */
export function createMessageHash(message: string): string {
  const messageBytes = ethers.toUtf8Bytes(message);
  const messageHash = ethers.keccak256(messageBytes);
  return messageHash;
}

/**
 * Verify signature using EIP-1271 (contract signature verification)
 */
export async function verifyEIP1271Signature(
  contractAddress: string,
  messageHash: string,
  signature: string,
  provider: ethers.Provider
): Promise<boolean> {
  try {
    // This would need to be implemented based on the specific contract
    // For now, return false as a placeholder
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Aggregate ECDSA signatures
 * This is a placeholder implementation
 */
export function aggregateECDSASignatures(signatures: string[]): string {
  // In a real implementation, this would use proper ECDSA aggregation
  // For now, we'll just concatenate the signatures
  return signatures.join('');
}

/**
 * Verify aggregated ECDSA signature
 */
export function verifyAggregatedECDSASignature(
  messageHash: string,
  aggregatedSignature: string,
  signers: string[]
): boolean {
  // This would need to be implemented based on the aggregation method used
  // For now, return false as a placeholder
  return false;
}
