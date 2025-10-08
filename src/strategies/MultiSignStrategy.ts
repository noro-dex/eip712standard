import type { SignerStrategy, SignatureAggregate, SignatureResult, MultiSignConfig } from '../interfaces/SignerStrategy';
import type { SignableMessage } from '../interfaces/SignableMessage';
import type { WalletProvider } from '../interfaces/WalletProvider';
import { ethers } from 'ethers';

/**
 * Multi-sign strategy implementation
 * Aggregates signatures from multiple signers with threshold support
 */
export class MultiSignStrategy implements SignerStrategy {
  private readonly walletProviders: WalletProvider[];
  private readonly config: MultiSignConfig;
  private readonly aggregationMethod: 'ecdsa' | 'schnorr';

  constructor(
    walletProviders: WalletProvider[],
    config: MultiSignConfig,
    aggregationMethod: 'ecdsa' | 'schnorr' = 'ecdsa'
  ) {
    this.walletProviders = walletProviders;
    this.config = config;
    this.aggregationMethod = aggregationMethod;
  }

  /**
   * Sign a message using multi-sign strategy
   */
  async signMessage(message: SignableMessage): Promise<SignatureResult> {
    const signatures: string[] = [];
    const signers: string[] = [];
    const errors: string[] = [];

    // Collect signatures from all configured signers
    for (const provider of this.walletProviders) {
      try {
        // Connect to wallet if not already connected
        const connection = await provider.getConnection();
        if (!connection || !connection.isConnected) {
          await provider.connect();
        }

        // Sign the typed data
        const signature = await provider.signTypedData(message);
        const signer = await this.recoverSigner(message, signature);

        signatures.push(signature);
        signers.push(signer);
      } catch (error) {
        errors.push(`Signer ${provider.getProviderName()} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Check if we have enough signatures
    if (signatures.length < this.config.threshold) {
      throw new Error(`Insufficient signatures: ${signatures.length}/${this.config.threshold}. Errors: ${errors.join(', ')}`);
    }

    // Create aggregate signature
    const aggregateSignature = await this.aggregateSignatures(signatures, message);

    const result: SignatureAggregate = {
      signatures,
      signers,
      threshold: this.config.threshold,
      message,
      aggregateSignature
    };

    return result;
  }

  /**
   * Verify a multi-signature
   */
  async verifySignature(signature: SignatureResult): Promise<boolean> {
    if (!signature.signatures || signature.signatures.length === 0) {
      return false; // This is not a multi-signature
    }

    try {
      const multiSig = signature as SignatureAggregate;

      // Check threshold
      if (multiSig.signatures.length < multiSig.threshold) {
        return false;
      }

      // Verify each individual signature
      const validSignatures = await this.verifyIndividualSignatures(multiSig);
      
      // Check if we have enough valid signatures
      return validSignatures >= multiSig.threshold;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the strategy type
   */
  getStrategyType(): 'single' | 'multi' {
    return 'multi';
  }

  /**
   * Check if the strategy supports the given message type
   */
  supportsMessage(message: SignableMessage): boolean {
    // Multi-sign supports all message types
    return true;
  }

  /**
   * Recover the signer address from a signature
   */
  private async recoverSigner(message: SignableMessage, signature: string): Promise<string> {
    try {
      const domain = message.domain;
      const types = message.types;
      const value = message.message;

      const recoveredAddress = ethers.verifyTypedData(domain, types, value, signature);
      return recoveredAddress;
    } catch (error) {
      throw new Error(`Failed to recover signer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify individual signatures
   */
  private async verifyIndividualSignatures(multiSig: SignatureAggregate): Promise<number> {
    let validCount = 0;

    for (let i = 0; i < multiSig.signatures.length; i++) {
      try {
        const signature = multiSig.signatures[i];
        const expectedSigner = multiSig.signers[i];
        const recoveredSigner = await this.recoverSigner(multiSig.message, signature);

        if (recoveredSigner.toLowerCase() === expectedSigner.toLowerCase()) {
          validCount++;
        }
      } catch (error) {
        // Signature verification failed
        continue;
      }
    }

    return validCount;
  }

  /**
   * Aggregate signatures using the configured method
   */
  private async aggregateSignatures(signatures: string[], message: SignableMessage): Promise<string> {
    if (this.aggregationMethod === 'ecdsa') {
      return this.aggregateECDSASignatures(signatures);
    } else {
      return this.aggregateSchnorrSignatures(signatures);
    }
  }

  /**
   * Aggregate ECDSA signatures
   * For now, we'll concatenate signatures. In a real implementation,
   * you'd use proper aggregation techniques from btcutilecc
   */
  private async aggregateECDSASignatures(signatures: string[]): Promise<string> {
    // Simple concatenation for now
    // In production, use proper ECDSA aggregation
    return signatures.join('');
  }

  /**
   * Aggregate Schnorr signatures
   * This would use Schnorr aggregation techniques
   */
  private async aggregateSchnorrSignatures(signatures: string[]): Promise<string> {
    // Placeholder for Schnorr aggregation
    // In production, implement proper Schnorr signature aggregation
    return signatures.join('');
  }

  /**
   * Get the configuration
   */
  getConfig(): MultiSignConfig {
    return { ...this.config };
  }

  /**
   * Get the aggregation method
   */
  getAggregationMethod(): 'ecdsa' | 'schnorr' {
    return this.aggregationMethod;
  }
}
