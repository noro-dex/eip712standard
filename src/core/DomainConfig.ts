import type { EIP712Domain } from '../interfaces/SignableMessage';

/**
 * Domain configuration for EIP-712 messages
 * Holds the domain data required for message signing
 */
export class DomainConfig {
  private readonly domain: EIP712Domain;

  constructor(
    name: string = 'EngineDex',
    version: string = '1.0',
    chainId: number,
    verifyingContract: string
  ) {
    this.domain = {
      name,
      version,
      chainId,
      verifyingContract
    };
  }

  /**
   * Get the domain configuration
   */
  getDomain(): EIP712Domain {
    return { ...this.domain };
  }

  /**
   * Update the chain ID
   */
  updateChainId(chainId: number): void {
    (this.domain as any).chainId = chainId;
  }

  /**
   * Update the verifying contract
   */
  updateVerifyingContract(verifyingContract: string): void {
    (this.domain as any).verifyingContract = verifyingContract;
  }

  /**
   * Validate the domain configuration
   */
  validate(): boolean {
    return (
      typeof this.domain.name === 'string' &&
      typeof this.domain.version === 'string' &&
      typeof this.domain.chainId === 'number' &&
      typeof this.domain.verifyingContract === 'string' &&
      this.domain.chainId > 0 &&
      this.domain.verifyingContract.length === 42 && // Ethereum address length
      this.domain.verifyingContract.startsWith('0x')
    );
  }

  /**
   * Get domain as string for logging
   */
  toString(): string {
    return `Domain(${this.domain.name} v${this.domain.version}, chainId: ${this.domain.chainId}, contract: ${this.domain.verifyingContract})`;
  }
}
