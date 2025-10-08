/**
 * Wallet provider extensions for EngineDex EIP-712 SDK
 * Implements specific wallet integrations using Wagmi connectors
 */

import type { Connector } from 'wagmi';
import type { EngineDexWalletProvider, EngineDexConfig } from './mixwallet';
import type { EIP712Domain } from '../interfaces/SignableMessage';

/**
 * Base wallet provider implementation
 */
export abstract class BaseWalletProvider implements EngineDexWalletProvider {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly icon?: string;
  abstract readonly ready: boolean;

  protected connector: Connector;
  protected config: EngineDexConfig;

  constructor(connector: Connector, config: EngineDexConfig) {
    this.connector = connector;
    this.config = config;
  }

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract getAddress(): Promise<string | null>;
  abstract getChainId(): Promise<number>;
  abstract switchChain(chainId: number): Promise<void>;
  abstract signTypedData(message: {
    domain: EIP712Domain;
    types: Record<string, Array<{ name: string; type: string }>>;
    primaryType: string;
    message: Record<string, unknown>;
  }): Promise<string>;
  abstract isConnected(): boolean;
}

/**
 * MetaMask wallet provider
 */
export class MetaMaskProvider extends BaseWalletProvider {
  readonly id = 'metaMask';
  readonly name = 'MetaMask';
  readonly icon = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iMTYiIGZpbGw9IiNGRkY5RjkiLz4KPHBhdGggZD0iTTI0LjU0IDIuNjY2NjZMMjAuNDY2NyA5LjMzMzMzTDI0LjU0IDExLjMzMzMzTDI4LjYxMzMgMi42NjY2NkwyNC41NCAyLjY2NjY2WiIgZmlsbD0iI0Y2ODU0QyIvPgo8cGF0aCBkPSJNNy40NiAyLjY2NjY2TDMuMzg2NjcgMTEuMzMzMzNMNy40NiA5LjMzMzMzTDExLjUzMzMgMi42NjY2Nkw3LjQ2IDIuNjY2NjZaIiBmaWxsPSIjRjY4NTRDIi8+CjxwYXRoIGQ9Ik0yMC40NjY3IDI0LjY2NjdMMjQuNTQgMTEuMzMzMzNMMjAuNDY2NyA5LjMzMzMzTDE2LjM5MzMgMTEuMzMzMzNMMjAuNDY2NyAyNC42NjY3WiIgZmlsbD0iI0Y2ODU0QyIvPgo8cGF0aCBkPSJNMTEuNTMzMyAyNC42NjY3TDE1LjYwNjcgMTEuMzMzMzNMMTEuNTMzMyA5LjMzMzMzTDcuNDYgMTEuMzMzMzNMMTEuNTMzMyAyNC42NjY3WiIgZmlsbD0iI0Y2ODU0QyIvPgo8L3N2Zz4K';
  readonly ready: boolean;

  constructor(connector: Connector, config: EngineDexConfig) {
    super(connector, config);
    this.ready = Boolean(connector.ready);
  }

  async connect(): Promise<void> {
    try {
      await this.connector.connect();
    } catch (error) {
      throw new Error(`MetaMask connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.connector.disconnect();
    } catch (error) {
      throw new Error(`MetaMask disconnection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAddress(): Promise<string | null> {
    try {
      const account = await this.connector.getAccount() as { address?: string } | null;
      return account?.address || null;
    } catch (error) {
      console.error('Failed to get address:', error);
      return null;
    }
  }

  async getChainId(): Promise<number> {
    try {
      const chainId = await this.connector.getChainId();
      return chainId as number;
    } catch (error) {
      console.error('Failed to get chain ID:', error);
      return 1; // Default to mainnet
    }
  }

  async switchChain(chainId: number): Promise<void> {
    try {
      await (this.connector as any).switchChain({ chainId });
    } catch (error) {
      throw new Error(`MetaMask chain switch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async signTypedData(message: {
    domain: EIP712Domain;
    types: Record<string, Array<{ name: string; type: string }>>;
    primaryType: string;
    message: Record<string, unknown>;
  }): Promise<string> {
    try {
      const signature = await (this.connector as any).signTypedData({
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
      return signature;
    } catch (error) {
      throw new Error(`MetaMask signing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  isConnected(): boolean {
    return Boolean((this.connector as any).connected);
  }

  /**
   * Check if MetaMask is installed
   */
  static isMetaMaskAvailable(): boolean {
    return typeof window !== 'undefined' && 
           (window as any).ethereum?.isMetaMask === true;
  }

  /**
   * Get MetaMask version
   */
  static getMetaMaskVersion(): string {
    if (typeof window !== 'undefined' && (window as any).ethereum?.isMetaMask) {
      return (window as any).ethereum?.version || 'unknown';
    }
    return 'not-installed';
  }
}

/**
 * Coinbase Wallet provider
 */
export class CoinbaseWalletProvider extends BaseWalletProvider {
  readonly id = 'coinbaseWallet';
  readonly name = 'Coinbase Wallet';
  readonly icon = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iMTYiIGZpbGw9IiMwMDUyRkYiLz4KPHBhdGggZD0iTTE2IDhMMjQgMTZMMTYgMjRMOCAxNkwxNiA4WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==';
  readonly ready: boolean;

  constructor(connector: Connector, config: EngineDexConfig) {
    super(connector, config);
    this.ready = Boolean(connector.ready);
  }

  async connect(): Promise<void> {
    try {
      await this.connector.connect();
    } catch (error) {
      throw new Error(`Coinbase Wallet connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.connector.disconnect();
    } catch (error) {
      throw new Error(`Coinbase Wallet disconnection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAddress(): Promise<string | null> {
    try {
      const account = await this.connector.getAccount() as { address?: string } | null;
      return account?.address || null;
    } catch (error) {
      console.error('Failed to get address:', error);
      return null;
    }
  }

  async getChainId(): Promise<number> {
    try {
      const chainId = await this.connector.getChainId();
      return chainId as number;
    } catch (error) {
      console.error('Failed to get chain ID:', error);
      return 1; // Default to mainnet
    }
  }

  async switchChain(chainId: number): Promise<void> {
    try {
      await (this.connector as any).switchChain({ chainId });
    } catch (error) {
      throw new Error(`Coinbase Wallet chain switch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async signTypedData(message: {
    domain: EIP712Domain;
    types: Record<string, Array<{ name: string; type: string }>>;
    primaryType: string;
    message: Record<string, unknown>;
  }): Promise<string> {
    try {
      const signature = await (this.connector as any).signTypedData({
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
      return signature;
    } catch (error) {
      throw new Error(`Coinbase Wallet signing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  isConnected(): boolean {
    return Boolean((this.connector as any).connected);
  }

  /**
   * Check if Coinbase Wallet is available
   */
  static isCoinbaseWalletAvailable(): boolean {
    return typeof window !== 'undefined' && 
           (window as any).ethereum?.isCoinbaseWallet === true;
  }
}

/**
 * Generic injected wallet provider
 */
export class InjectedWalletProvider extends BaseWalletProvider {
  readonly id = 'injected';
  readonly name = 'Injected Wallet';
  readonly icon = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iMTYiIGZpbGw9IiM2MzY2RjEiLz4KPHBhdGggZD0iTTE2IDhMMjQgMTZMMTYgMjRMOCAxNkwxNiA4WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==';
  readonly ready: boolean;

  constructor(connector: Connector, config: EngineDexConfig) {
    super(connector, config);
    this.ready = Boolean(connector.ready);
  }

  async connect(): Promise<void> {
    try {
      await this.connector.connect();
    } catch (error) {
      throw new Error(`Injected wallet connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.connector.disconnect();
    } catch (error) {
      throw new Error(`Injected wallet disconnection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAddress(): Promise<string | null> {
    try {
      const account = await this.connector.getAccount() as { address?: string } | null;
      return account?.address || null;
    } catch (error) {
      console.error('Failed to get address:', error);
      return null;
    }
  }

  async getChainId(): Promise<number> {
    try {
      const chainId = await this.connector.getChainId();
      return chainId as number;
    } catch (error) {
      console.error('Failed to get chain ID:', error);
      return 1; // Default to mainnet
    }
  }

  async switchChain(chainId: number): Promise<void> {
    try {
      await (this.connector as any).switchChain({ chainId });
    } catch (error) {
      throw new Error(`Injected wallet chain switch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async signTypedData(message: {
    domain: EIP712Domain;
    types: Record<string, Array<{ name: string; type: string }>>;
    primaryType: string;
    message: Record<string, unknown>;
  }): Promise<string> {
    try {
      const signature = await (this.connector as any).signTypedData({
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
      return signature;
    } catch (error) {
      throw new Error(`Injected wallet signing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  isConnected(): boolean {
    return Boolean((this.connector as any).connected);
  }

  /**
   * Check if any injected wallet is available
   */
  static isInjectedWalletAvailable(): boolean {
    return typeof window !== 'undefined' && 
           typeof (window as any).ethereum !== 'undefined';
  }
}

/**
 * Wallet provider factory
 */
export class WalletProviderFactory {
  /**
   * Create a wallet provider from a Wagmi connector
   */
  static createProvider(connector: Connector, config: EngineDexConfig): EngineDexWalletProvider {
    switch (connector.id) {
      case 'metaMask':
        return new MetaMaskProvider(connector, config);
      case 'coinbaseWallet':
        return new CoinbaseWalletProvider(connector, config);
      case 'injected':
        return new InjectedWalletProvider(connector, config);
      default:
        return new InjectedWalletProvider(connector, config);
    }
  }

  /**
   * Get available wallet providers
   */
  static getAvailableProviders(): Array<{
    id: string;
    name: string;
    icon?: string;
    available: boolean;
  }> {
    return [
      {
        id: 'metaMask',
        name: 'MetaMask',
        icon: MetaMaskProvider.prototype.icon,
        available: MetaMaskProvider.isMetaMaskAvailable(),
      },
      {
        id: 'coinbaseWallet',
        name: 'Coinbase Wallet',
        icon: CoinbaseWalletProvider.prototype.icon,
        available: CoinbaseWalletProvider.isCoinbaseWalletAvailable(),
      },
      {
        id: 'injected',
        name: 'Injected Wallet',
        icon: InjectedWalletProvider.prototype.icon,
        available: InjectedWalletProvider.isInjectedWalletAvailable(),
      },
    ];
  }
}
