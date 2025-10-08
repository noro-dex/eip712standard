/**
 * Abstract interface for wallet providers
 * Supports MetaMask and other Ethereum wallet extensions
 */

export interface WalletAccount {
  address: string;
  publicKey?: string;
  chainId: number;
}

export interface WalletConnection {
  accounts: WalletAccount[];
  chainId: number;
  isConnected: boolean;
}

export interface WalletProvider {
  /**
   * Connect to the wallet and get accounts
   */
  connect(): Promise<WalletConnection>;
  
  /**
   * Disconnect from the wallet
   */
  disconnect(): Promise<void>;
  
  /**
   * Get current connection status
   */
  getConnection(): Promise<WalletConnection | null>;
  
  /**
   * Request account access
   */
  requestAccounts(): Promise<string[]>;
  
  /**
   * Switch to a different chain
   */
  switchChain(chainId: number): Promise<void>;
  
  /**
   * Sign a message using eth_signTypedData_v4
   */
  signTypedData(message: unknown): Promise<string>;
  
  /**
   * Get the provider name
   */
  getProviderName(): string;
  
  /**
   * Check if the provider is available
   */
  isAvailable(): boolean;
}

/**
 * MetaMask specific provider interface
 */
export interface MetaMaskProvider extends WalletProvider {
  /**
   * Check if MetaMask is installed
   */
  isMetaMask(): boolean;
  
  /**
   * Get MetaMask version
   */
  getVersion(): string;
}

/**
 * Generic Ethereum provider interface
 */
export interface EthereumProvider {
  isMetaMask?: boolean;
  isConnected(): boolean;
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on(event: string, handler: (...args: unknown[]) => void): void;
  removeListener(event: string, handler: (...args: unknown[]) => void): void;
}

/**
 * Wallet connection options
 */
export interface WalletConnectionOptions {
  chainId?: number;
  autoConnect?: boolean;
  timeout?: number;
}
