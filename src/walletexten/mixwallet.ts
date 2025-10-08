/**
 * Wagmi-based wallet extensions for EngineDex EIP-712 SDK
 * Provides seamless wallet detection, connection, and signing capabilities
 */

import { createConfig, http, type Config } from 'wagmi';
import { mainnet, sepolia, arbitrum, polygon } from 'wagmi/chains';
import { injected, metaMask, walletConnect, coinbaseWallet } from 'wagmi/connectors';
import type { EIP712Domain } from '../interfaces/SignableMessage';

/**
 * Extended EngineDex configuration that extends Wagmi's Config
 */
export interface EngineDexConfig extends Config {
  domain: EIP712Domain;
  multiSignThreshold?: number;
  supportedChains?: number[];
}

/**
 * Wallet connection options for EngineDex
 */
export interface EngineDexWalletOptions {
  verifyingContract: string;
  chainId?: number;
  multiSignThreshold?: number;
  supportedChains?: number[];
  autoConnect?: boolean;
}

/**
 * Create EngineDex configuration with Wagmi integration
 * testnet: 61300
 * mainnet: 65400
 */
export function createEngineDexConfig(options: EngineDexWalletOptions): EngineDexConfig {
  const {
    verifyingContract,
    chainId = 1,
    multiSignThreshold = 1,
    supportedChains = [1, 11155111, 42161, 61300,65400], // mainnet, sepolia, arbitrum, polygon
  } = options;

  // Select chains based on supported chain IDs
  const chains = [mainnet, sepolia, arbitrum, polygon].filter(chain => 
    supportedChains.includes(chain.id)
  );

  const config = createConfig({
    chains,
    connectors: [
      injected(),
      metaMask(),
      walletConnect({
        projectId: process.env.WALLETCONNECT_PROJECT_ID || 'your-project-id',
      }),
      coinbaseWallet({
        appName: 'EngineDex',
        appLogoUrl: 'https://enginedex.com/logo.png',
      }),
    ],
    transports: {
      [mainnet.id]: http(),
      [sepolia.id]: http(),
      [arbitrum.id]: http(),
      [polygon.id]: http(),
    },
    ssr: true,
  });

  const domain: EIP712Domain = {
    name: 'EngineDex',
    version: '1.0',
    chainId,
    verifyingContract,
  };

  return {
    ...config,
    domain,
    multiSignThreshold,
    supportedChains,
  };
}

/**
 * Wallet detection utilities
 */
export class WalletDetector {
  /**
   * Check if a specific wallet is available
   */
  static async isWalletAvailable(connectorId: string): Promise<boolean> {
    try {
      // This would be implemented with actual connector detection
      // For now, return true for common wallets
      const availableWallets = ['metaMask', 'coinbaseWallet', 'injected'];
      return availableWallets.includes(connectorId);
    } catch {
      return false;
    }
  }

  /**
   * Get list of available wallets
   */
  static async getAvailableWallets(): Promise<string[]> {
    const wallets = ['metaMask', 'coinbaseWallet', 'injected'];
    const available = await Promise.all(
      wallets.map(async (wallet) => ({
        wallet,
        available: await this.isWalletAvailable(wallet)
      }))
    );
    return available
      .filter(({ available }) => available)
      .map(({ wallet }) => wallet);
  }
}

/**
 * EngineDex wallet provider interface extending Wagmi's Connector
 */
export interface EngineDexWalletProvider {
  readonly id: string;
  readonly name: string;
  readonly icon?: string;
  readonly ready: boolean;
  
  /**
   * Connect to the wallet
   */
  connect(): Promise<void>;
  
  /**
   * Disconnect from the wallet
   */
  disconnect(): Promise<void>;
  
  /**
   * Get current account address
   */
  getAddress(): Promise<string | null>;
  
  /**
   * Get current chain ID
   */
  getChainId(): Promise<number>;
  
  /**
   * Switch to a different chain
   */
  switchChain(chainId: number): Promise<void>;
  
  /**
   * Sign EIP-712 typed data
   */
  signTypedData(message: {
    domain: EIP712Domain;
    types: Record<string, Array<{ name: string; type: string }>>;
    primaryType: string;
    message: Record<string, unknown>;
  }): Promise<string>;
  
  /**
   * Check if wallet is connected
   */
  isConnected(): boolean;
}

/**
 * Multi-signature wallet manager
 */
export class MultiSignWalletManager {
  private connectedWallets: Map<string, EngineDexWalletProvider> = new Map();
  private threshold: number;

  constructor(threshold: number = 1) {
    this.threshold = threshold;
  }

  /**
   * Add a wallet to the multi-sign setup
   */
  addWallet(wallet: EngineDexWalletProvider): void {
    this.connectedWallets.set(wallet.id, wallet);
  }

  /**
   * Remove a wallet from the multi-sign setup
   */
  removeWallet(walletId: string): void {
    this.connectedWallets.delete(walletId);
  }

  /**
   * Get all connected wallets
   */
  getConnectedWallets(): EngineDexWalletProvider[] {
    return Array.from(this.connectedWallets.values());
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
  async collectSignatures(message: {
    domain: EIP712Domain;
    types: Record<string, Array<{ name: string; type: string }>>;
    primaryType: string;
    message: Record<string, unknown>;
  }): Promise<Array<{ walletId: string; address: string; signature: string }>> {
    const signatures = [];
    
    for (const [walletId, wallet] of this.connectedWallets) {
      try {
        const address = await wallet.getAddress();
        if (address) {
          const signature = await wallet.signTypedData(message);
          signatures.push({ walletId, address, signature });
        }
      } catch (error) {
        console.error(`Failed to get signature from wallet ${walletId}:`, error);
      }
    }

    return signatures;
  }
}

/**
 * Wallet connection state
 */
export interface WalletConnectionState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  connectorId: string | null;
  error: string | null;
}

/**
 * EngineDex wallet utilities
 */
export class EngineDexWalletUtils {
  /**
   * Validate wallet address
   */
  static isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Format address for display
   */
  static formatAddress(address: string, length: number = 6): string {
    if (!this.isValidAddress(address)) return address;
    return `${address.slice(0, length + 2)}...${address.slice(-length)}`;
  }

  /**
   * Get chain name from chain ID
   */
  static getChainName(chainId: number): string {
    const chainNames: Record<number, string> = {
      1: 'Ethereum Mainnet',
      11155111: 'Sepolia Testnet',
      42161: 'Arbitrum One',
      137: 'Polygon',
    };
    return chainNames[chainId] || `Chain ${chainId}`;
  }

  /**
   * Check if chain is supported
   */
  static isChainSupported(chainId: number, supportedChains: number[]): boolean {
    return supportedChains.includes(chainId);
  }
}
