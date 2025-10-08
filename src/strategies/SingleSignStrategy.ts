import type { SignerStrategy, SingleSignature, SignatureResult } from '../interfaces/SignerStrategy';
import type { SignableMessage } from '../interfaces/SignableMessage';
import type { WalletProvider } from '../interfaces/WalletProvider';
import { ethers } from 'ethers';

/**
 * Single-sign strategy implementation
 * Signs messages directly with a single wallet
 */
export class SingleSignStrategy implements SignerStrategy {
  private readonly walletProvider: WalletProvider;

  constructor(walletProvider: WalletProvider) {
    this.walletProvider = walletProvider;
  }

  /**
   * Sign a message using single-sign strategy
   */
  async signMessage(message: SignableMessage): Promise<SignatureResult> {
    try {
      // Connect to wallet if not already connected
      const connection = await this.walletProvider.getConnection();
      if (!connection || !connection.isConnected) {
        await this.walletProvider.connect();
      }

      // Sign the typed data
      const signature = await this.walletProvider.signTypedData(message);

      // Get the signer address
      const signer = await this.recoverSigner(message, signature);

      const result: SingleSignature = {
        signature,
        signer,
        message
      };

      return result;
    } catch (error) {
      throw new Error(`Single sign failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify a single signature
   */
  async verifySignature(signature: SignatureResult): Promise<boolean> {
    if (signature.signatures && signature.signatures.length > 1) {
      return false; // This is not a single signature
    }

    try {
      const singleSig = signature as SingleSignature;
      const recoveredAddress = await this.recoverSigner(singleSig.message, singleSig.signature);
      return recoveredAddress.toLowerCase() === singleSig.signer.toLowerCase();
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the strategy type
   */
  getStrategyType(): 'single' | 'multi' {
    return 'single';
  }

  /**
   * Check if the strategy supports the given message type
   */
  supportsMessage(message: SignableMessage): boolean {
    // Single sign supports all message types
    return true;
  }

  /**
   * Recover the signer address from a signature
   */
  private async recoverSigner(message: SignableMessage, signature: string): Promise<string> {
    try {
      // Create the typed data hash
      const domain = message.domain;
      const types = message.types;
      const value = message.message;

      // Use ethers.js to recover the address
      const recoveredAddress = ethers.verifyTypedData(domain, types, value, signature);
      return recoveredAddress;
    } catch (error) {
      throw new Error(`Failed to recover signer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get the wallet provider
   */
  getWalletProvider(): WalletProvider {
    return this.walletProvider;
  }
}
