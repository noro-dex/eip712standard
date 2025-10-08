import type { WalletProvider, WalletConnection, EthereumProvider } from '../interfaces/WalletProvider';
import { WalletConnectionError } from '../errors/WalletConnectionError';

/**
 * MetaMask wallet provider implementation
 */
export class MetaMaskProvider implements WalletProvider {
  private provider: EthereumProvider | null = null;
  private connection: WalletConnection | null = null;

  constructor() {
    this.provider = this.getEthereumProvider();
  }

  /**
   * Connect to MetaMask
   */
  async connect(): Promise<WalletConnection> {
    if (!this.provider) {
      throw new WalletConnectionError('MetaMask', 'Provider not available');
    }

    try {
      // Request account access
      const accounts = await this.requestAccounts();
      const chainId = await this.getChainId();

      this.connection = {
        accounts: accounts.map(address => ({
          address,
          chainId: Number(chainId)
        })),
        chainId: Number(chainId),
        isConnected: true
      };

      return this.connection;
    } catch (error) {
      throw new WalletConnectionError('MetaMask', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Disconnect from MetaMask
   */
  async disconnect(): Promise<void> {
    this.connection = null;
  }

  /**
   * Get current connection
   */
  async getConnection(): Promise<WalletConnection | null> {
    if (!this.provider) {
      return null;
    }

    try {
      const accounts = await this.requestAccounts();
      const chainId = await this.getChainId();

      if (accounts.length === 0) {
        return null;
      }

      return {
        accounts: accounts.map(address => ({
          address,
          chainId: Number(chainId)
        })),
        chainId: Number(chainId),
        isConnected: true
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Request account access
   */
  async requestAccounts(): Promise<string[]> {
    if (!this.provider) {
      throw new WalletConnectionError('MetaMask', 'Provider not available');
    }

    const accounts = await this.provider.request({
      method: 'eth_requestAccounts'
    }) as string[];

    return accounts;
  }

  /**
   * Switch to a different chain
   */
  async switchChain(chainId: number): Promise<void> {
    if (!this.provider) {
      throw new WalletConnectionError('MetaMask', 'Provider not available');
    }

    try {
      await this.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }]
      });
    } catch (error) {
      // If the chain doesn't exist, try to add it
      if (error instanceof Error && error.message.includes('Unrecognized chain ID')) {
        throw new WalletConnectionError('MetaMask', `Chain ${chainId} not supported`);
      }
      throw error;
    }
  }

  /**
   * Sign typed data using eth_signTypedData_v4
   */
  async signTypedData(message: unknown): Promise<string> {
    if (!this.provider) {
      throw new WalletConnectionError('MetaMask', 'Provider not available');
    }

    const connection = await this.getConnection();
    if (!connection || !connection.isConnected) {
      throw new WalletConnectionError('MetaMask', 'Not connected');
    }

    const signature = await this.provider.request({
      method: 'eth_signTypedData_v4',
      params: [connection.accounts[0].address, JSON.stringify(message)]
    }) as string;

    return signature;
  }

  /**
   * Get the provider name
   */
  getProviderName(): string {
    return 'MetaMask';
  }

  /**
   * Check if the provider is available
   */
  isAvailable(): boolean {
    return this.provider !== null;
  }

  /**
   * Check if this is MetaMask
   */
  isMetaMask(): boolean {
    return this.provider?.isMetaMask === true;
  }

  /**
   * Get MetaMask version
   */
  getVersion(): string {
    // This would need to be implemented based on MetaMask's version detection
    return 'unknown';
  }

  /**
   * Get the Ethereum provider
   */
  private getEthereumProvider(): EthereumProvider | null {
    if (typeof window !== 'undefined' && window.ethereum) {
      return window.ethereum as EthereumProvider;
    }
    return null;
  }

  /**
   * Get current chain ID
   */
  private async getChainId(): Promise<number> {
    if (!this.provider) {
      throw new WalletConnectionError('MetaMask', 'Provider not available');
    }

    const chainId = await this.provider.request({
      method: 'eth_chainId'
    }) as string;

    return parseInt(chainId, 16);
  }
}

/**
 * Generic wallet provider factory
 */
export class WalletProviderFactory {
  /**
   * Create a wallet provider based on the available providers
   */
  static createProvider(): WalletProvider {
    if (typeof window !== 'undefined' && window.ethereum) {
      return new MetaMaskProvider();
    }
    
    throw new WalletConnectionError('No Provider', 'No Ethereum wallet provider found');
  }

  /**
   * Get all available providers
   */
  static getAvailableProviders(): string[] {
    const providers: string[] = [];
    
    if (typeof window !== 'undefined' && window.ethereum) {
      providers.push('MetaMask');
    }
    
    return providers;
  }
}

// Global type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}
