/**
 * Wagmi-integrated signing strategies for EngineDex EIP-712 SDK
 * Provides single-sign and multi-sign capabilities using Wagmi hooks
 */

import { useSignTypedData, useAccount } from 'wagmi';
import type { SignableMessage } from '../interfaces/SignableMessage';
import type { EngineDexConfig, EngineDexWalletProvider } from './mixwallet';
import type { SignTypedDataParameters } from 'wagmi/actions';

/**
 * Single signature strategy using Wagmi
 */
export class WagmiSingleSignStrategy {
  private config: EngineDexConfig;
  private signTypedData: (params: SignTypedDataParameters) => Promise<string>;
  private account: { isConnected: boolean; address?: string };

  constructor(
    config: EngineDexConfig, 
    signTypedData: (params: SignTypedDataParameters) => Promise<string>, 
    account: { isConnected: boolean; address?: string }
  ) {
    this.config = config;
    this.signTypedData = signTypedData;
    this.account = account;
  }

  /**
   * Sign a message using Wagmi's useSignTypedData
   */
  async signMessage(message: SignableMessage): Promise<string> {
    if (!this.account?.isConnected || !this.account?.address) {
      throw new Error('Wallet not connected');
    }

    try {
      const signature = await this.signTypedData({
        domain: {
          name: message.domain.name,
          version: message.domain.version,
          chainId: message.domain.chainId,
          verifyingContract: message.domain.verifyingContract as `0x${string}`,
        },
        types: message.types as any, // Type assertion needed for complex types
        primaryType: message.primaryType,
        message: message.message,
      });

      return signature;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Signing failed';
      throw new Error(`Single sign failed: ${errorMessage}`);
    }
  }

  /**
   * Validate message before signing
   */
  validateMessage(message: SignableMessage): boolean {
    if (!message || typeof message !== 'object') {
      return false;
    }

    // Validate domain
    if (!message.domain || typeof message.domain !== 'object') {
      return false;
    }

    const { domain } = message;
    if (
      !domain.name || 
      typeof domain.name !== 'string' ||
      !domain.version || 
      typeof domain.version !== 'string' ||
      typeof domain.chainId !== 'number' ||
      domain.chainId <= 0 ||
      !domain.verifyingContract ||
      typeof domain.verifyingContract !== 'string' ||
      !/^0x[a-fA-F0-9]{40}$/.test(domain.verifyingContract)
    ) {
      return false;
    }

    // Validate types
    if (!message.types || typeof message.types !== 'object') {
      return false;
    }

    // Validate primaryType
    if (!message.primaryType || typeof message.primaryType !== 'string') {
      return false;
    }

    // Validate message
    if (!message.message || typeof message.message !== 'object') {
      return false;
    }

    return true;
  }
}

/**
 * Multi-signature strategy using Wagmi
 */
export class WagmiMultiSignStrategy {
  private config: EngineDexConfig;
  private connectedWallets: Map<string, EngineDexWalletProvider> = new Map();
  private threshold: number;

  constructor(config: EngineDexConfig, threshold: number = 1) {
    this.config = config;
    this.threshold = threshold;
  }

  /**
   * Add a wallet to the multi-sign setup
   */
  addWallet(walletId: string, wallet: EngineDexWalletProvider): void {
    this.connectedWallets.set(walletId, wallet);
  }

  /**
   * Remove a wallet from the multi-sign setup
   */
  removeWallet(walletId: string): void {
    this.connectedWallets.delete(walletId);
  }

  /**
   * Check if threshold is met
   */
  isThresholdMet(): boolean {
    return this.connectedWallets.size >= this.threshold;
  }

  /**
   * Collect signatures from all connected wallets
   */
  async collectSignatures(message: SignableMessage): Promise<Array<{
    walletId: string;
    address: string;
    signature: string;
  }>> {
    if (!this.isThresholdMet()) {
      throw new Error(`Multi-sign threshold not met. Required: ${this.threshold}, Connected: ${this.connectedWallets.size}`);
    }

    const signatures = [];
    
    for (const [walletId, wallet] of this.connectedWallets) {
      try {
        const address = await wallet.getAddress();
        if (address) {
          const signature = await wallet.signTypedData({
            domain: {
              name: message.domain.name,
              version: message.domain.version,
              chainId: message.domain.chainId,
              verifyingContract: message.domain.verifyingContract as `0x${string}`,
            },
            types: message.types as any,
            primaryType: message.primaryType,
            message: message.message,
          });
          
          signatures.push({ walletId, address, signature });
        }
      } catch (error) {
        console.error(`Failed to get signature from wallet ${walletId}:`, error);
        throw new Error(`Failed to collect signature from wallet ${walletId}`);
      }
    }

    return signatures;
  }

  /**
   * Aggregate signatures into a single result
   */
  aggregateSignatures(signatures: Array<{
    walletId: string;
    address: string;
    signature: string;
  }>): {
    signatures: Array<{ address: string; signature: string }>;
    threshold: number;
    totalSignatures: number;
  } {
    return {
      signatures: signatures.map(sig => ({
        address: sig.address,
        signature: sig.signature,
      })),
      threshold: this.threshold,
      totalSignatures: signatures.length,
    };
  }
}

/**
 * Wagmi signing manager that coordinates between single and multi-sign strategies
 */
export class WagmiSigningManager {
  private config: EngineDexConfig;
  private singleSignStrategy: WagmiSingleSignStrategy;
  private multiSignStrategy: WagmiMultiSignStrategy;
  private currentMode: 'single' | 'multi' = 'single';

  constructor(
    config: EngineDexConfig,
    signTypedData: (params: SignTypedDataParameters) => Promise<string>,
    account: { isConnected: boolean; address?: string },
    multiSignThreshold: number = 1
  ) {
    this.config = config;
    this.singleSignStrategy = new WagmiSingleSignStrategy(config, signTypedData, account);
    this.multiSignStrategy = new WagmiMultiSignStrategy(config, multiSignThreshold);
  }

  /**
   * Set signing mode
   */
  setMode(mode: 'single' | 'multi'): void {
    this.currentMode = mode;
  }

  /**
   * Get current signing mode
   */
  getMode(): 'single' | 'multi' {
    return this.currentMode;
  }

  /**
   * Sign a message based on current mode
   */
  async signMessage(message: SignableMessage): Promise<string | {
    signatures: Array<{ address: string; signature: string }>;
    threshold: number;
    totalSignatures: number;
  }> {
    if (this.currentMode === 'single') {
      return await this.singleSignStrategy.signMessage(message);
    } else {
      const signatures = await this.multiSignStrategy.collectSignatures(message);
      return this.multiSignStrategy.aggregateSignatures(signatures);
    }
  }

  /**
   * Add wallet for multi-sign mode
   */
  addWallet(walletId: string, wallet: EngineDexWalletProvider): void {
    this.multiSignStrategy.addWallet(walletId, wallet);
  }

  /**
   * Remove wallet for multi-sign mode
   */
  removeWallet(walletId: string): void {
    this.multiSignStrategy.removeWallet(walletId);
  }

  /**
   * Check if multi-sign threshold is met
   */
  isMultiSignReady(): boolean {
    return this.multiSignStrategy.isThresholdMet();
  }

  /**
   * Validate message before signing
   */
  validateMessage(message: SignableMessage): boolean {
    return this.singleSignStrategy.validateMessage(message);
  }
}

/**
 * Hook for Wagmi signing integration
 */
export function useWagmiSigning(config: EngineDexConfig, multiSignThreshold: number = 1) {
  const { signTypedData, isPending, error } = useSignTypedData();
  const { address, isConnected } = useAccount();

  const signingManager = new WagmiSigningManager(
    config,
    signTypedData as any, // Type assertion for Wagmi compatibility
    { address: address as string | undefined, isConnected },
    multiSignThreshold
  );

  /**
   * Sign a message
   */
  const signMessage = async (message: SignableMessage) => {
    if (!signingManager.validateMessage(message)) {
      throw new Error('Invalid message format');
    }

    return await signingManager.signMessage(message);
  };

  /**
   * Switch to multi-sign mode
   */
  const enableMultiSign = () => {
    signingManager.setMode('multi');
  };

  /**
   * Switch to single-sign mode
   */
  const enableSingleSign = () => {
    signingManager.setMode('single');
  };

  /**
   * Add wallet for multi-sign
   */
  const addWallet = (walletId: string, wallet: EngineDexWalletProvider) => {
    signingManager.addWallet(walletId, wallet);
  };

  /**
   * Remove wallet for multi-sign
   */
  const removeWallet = (walletId: string) => {
    signingManager.removeWallet(walletId);
  };

  return {
    signMessage,
    enableMultiSign,
    enableSingleSign,
    addWallet,
    removeWallet,
    isMultiSignReady: signingManager.isMultiSignReady(),
    currentMode: signingManager.getMode(),
    isPending,
    error,
    isConnected,
    address,
  };
}
