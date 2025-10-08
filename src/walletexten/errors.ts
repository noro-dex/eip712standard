/**
 * Wagmi-specific error handling and security measures for EngineDex EIP-712 SDK
 * Extends base error classes with Wagmi integration specific errors
 */

import { EngineDexError } from '../errors/EngineDexError';

/**
 * Base class for Wagmi-related errors
 */
export class WagmiError extends EngineDexError {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = 'WagmiError';
  }
}

/**
 * Wallet connection errors
 */
export class WalletConnectionError extends WagmiError {
  constructor(message: string, walletId?: string) {
    super(message, 'WALLET_CONNECTION_ERROR');
    this.name = 'WalletConnectionError';
    this.walletId = walletId;
  }

  readonly walletId?: string;
}

/**
 * Wallet disconnection errors
 */
export class WalletDisconnectionError extends WagmiError {
  constructor(message: string, walletId?: string) {
    super(message, 'WALLET_DISCONNECTION_ERROR');
    this.name = 'WalletDisconnectionError';
    this.walletId = walletId;
  }

  readonly walletId?: string;
}

/**
 * Chain switching errors
 */
export class ChainSwitchError extends WagmiError {
  constructor(message: string, fromChainId?: number, toChainId?: number) {
    super(message, 'CHAIN_SWITCH_ERROR');
    this.name = 'ChainSwitchError';
    this.fromChainId = fromChainId;
    this.toChainId = toChainId;
  }

  readonly fromChainId?: number;
  readonly toChainId?: number;
}

/**
 * Signing errors specific to Wagmi integration
 */
export class WagmiSigningError extends WagmiError {
  constructor(message: string, walletId?: string, operation?: string) {
    super(message, 'WAGMI_SIGNING_ERROR');
    this.name = 'WagmiSigningError';
    this.walletId = walletId;
    this.operation = operation;
  }

  readonly walletId?: string;
  readonly operation?: string;
}

/**
 * Multi-signature threshold errors
 */
export class MultiSignThresholdError extends WagmiError {
  constructor(
    message: string,
    currentSignatures: number,
    requiredThreshold: number,
    walletIds?: string[]
  ) {
    super(message, 'MULTI_SIGN_THRESHOLD_ERROR');
    this.name = 'MultiSignThresholdError';
    this.currentSignatures = currentSignatures;
    this.requiredThreshold = requiredThreshold;
    this.walletIds = walletIds;
  }

  readonly currentSignatures: number;
  readonly requiredThreshold: number;
  readonly walletIds?: string[];
}

/**
 * Wallet detection errors
 */
export class WalletDetectionError extends WagmiError {
  constructor(message: string, walletType?: string) {
    super(message, 'WALLET_DETECTION_ERROR');
    this.name = 'WalletDetectionError';
    this.walletType = walletType;
  }

  readonly walletType?: string;
}

/**
 * Configuration errors
 */
export class WagmiConfigError extends WagmiError {
  constructor(message: string, configProperty?: string) {
    super(message, 'WAGMI_CONFIG_ERROR');
    this.name = 'WagmiConfigError';
    this.configProperty = configProperty;
  }

  readonly configProperty?: string;
}

/**
 * Security validation errors
 */
export class SecurityValidationError extends WagmiError {
  constructor(message: string, validationType?: string) {
    super(message, 'SECURITY_VALIDATION_ERROR');
    this.name = 'SecurityValidationError';
    this.validationType = validationType;
  }

  readonly validationType?: string;
}

/**
 * Error handler for Wagmi operations
 */
export class WagmiErrorHandler {
  /**
   * Handle wallet connection errors
   */
  static handleConnectionError(error: unknown, walletId?: string): WalletConnectionError {
    if (error instanceof WalletConnectionError) {
      return error;
    }

    let message = 'Wallet connection failed';
    if (error instanceof Error) {
      message = error.message;
    }

    return new WalletConnectionError(message, walletId);
  }

  /**
   * Handle wallet disconnection errors
   */
  static handleDisconnectionError(error: unknown, walletId?: string): WalletDisconnectionError {
    if (error instanceof WalletDisconnectionError) {
      return error;
    }

    let message = 'Wallet disconnection failed';
    if (error instanceof Error) {
      message = error.message;
    }

    return new WalletDisconnectionError(message, walletId);
  }

  /**
   * Handle chain switching errors
   */
  static handleChainSwitchError(
    error: unknown,
    fromChainId?: number,
    toChainId?: number
  ): ChainSwitchError {
    if (error instanceof ChainSwitchError) {
      return error;
    }

    let message = 'Chain switch failed';
    if (error instanceof Error) {
      message = error.message;
    }

    return new ChainSwitchError(message, fromChainId, toChainId);
  }

  /**
   * Handle signing errors
   */
  static handleSigningError(
    error: unknown,
    walletId?: string,
    operation?: string
  ): WagmiSigningError {
    if (error instanceof WagmiSigningError) {
      return error;
    }

    let message = 'Signing operation failed';
    if (error instanceof Error) {
      message = error.message;
    }

    return new WagmiSigningError(message, walletId, operation);
  }

  /**
   * Handle multi-sign threshold errors
   */
  static handleMultiSignThresholdError(
    currentSignatures: number,
    requiredThreshold: number,
    walletIds?: string[]
  ): MultiSignThresholdError {
    const message = `Multi-sign threshold not met. Required: ${requiredThreshold}, Current: ${currentSignatures}`;
    return new MultiSignThresholdError(message, currentSignatures, requiredThreshold, walletIds);
  }

  /**
   * Handle wallet detection errors
   */
  static handleDetectionError(error: unknown, walletType?: string): WalletDetectionError {
    if (error instanceof WalletDetectionError) {
      return error;
    }

    let message = 'Wallet detection failed';
    if (error instanceof Error) {
      message = error.message;
    }

    return new WalletDetectionError(message, walletType);
  }

  /**
   * Handle configuration errors
   */
  static handleConfigError(error: unknown, configProperty?: string): WagmiConfigError {
    if (error instanceof WagmiConfigError) {
      return error;
    }

    let message = 'Configuration error';
    if (error instanceof Error) {
      message = error.message;
    }

    return new WagmiConfigError(message, configProperty);
  }

  /**
   * Handle security validation errors
   */
  static handleSecurityValidationError(
    error: unknown,
    validationType?: string
  ): SecurityValidationError {
    if (error instanceof SecurityValidationError) {
      return error;
    }

    let message = 'Security validation failed';
    if (error instanceof Error) {
      message = error.message;
    }

    return new SecurityValidationError(message, validationType);
  }
}

/**
 * Security validator for Wagmi operations
 */
export class WagmiSecurityValidator {
  /**
   * Validate wallet address format
   */
  static validateAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Validate chain ID
   */
  static validateChainId(chainId: number): boolean {
    return Number.isInteger(chainId) && chainId > 0;
  }

  /**
   * Validate domain configuration
   */
  static validateDomain(domain: {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string;
  }): boolean {
    return (
      typeof domain.name === 'string' &&
      domain.name.length > 0 &&
      typeof domain.version === 'string' &&
      domain.version.length > 0 &&
      this.validateChainId(domain.chainId) &&
      this.validateAddress(domain.verifyingContract)
    );
  }

  /**
   * Validate EIP-712 message structure
   */
  static validateMessage(message: {
    domain: any;
    types: any;
    primaryType: string;
    message: any;
  }): boolean {
    return (
      message.domain &&
      message.types &&
      typeof message.primaryType === 'string' &&
      message.message &&
      this.validateDomain(message.domain)
    );
  }

  /**
   * Validate signature format
   */
  static validateSignature(signature: string): boolean {
    return /^0x[a-fA-F0-9]{130}$/.test(signature);
  }

  /**
   * Validate multi-sign threshold
   */
  static validateThreshold(threshold: number, connectedWallets: number): boolean {
    return Number.isInteger(threshold) && threshold > 0 && threshold <= connectedWallets;
  }

  /**
   * Validate wallet provider
   */
  static validateWalletProvider(provider: any): boolean {
    return (
      provider &&
      typeof provider.id === 'string' &&
      typeof provider.name === 'string' &&
      typeof provider.connect === 'function' &&
      typeof provider.disconnect === 'function' &&
      typeof provider.getAddress === 'function' &&
      typeof provider.signTypedData === 'function'
    );
  }
}

/**
 * Error recovery strategies
 */
export class WagmiErrorRecovery {
  /**
   * Attempt to recover from connection errors
   */
  static async recoverFromConnectionError(
    error: WalletConnectionError,
    retryCount: number = 3
  ): Promise<boolean> {
    if (retryCount <= 0) return false;

    try {
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retryCount)));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Attempt to recover from chain switch errors
   */
  static async recoverFromChainSwitchError(
    error: ChainSwitchError,
    targetChainId: number
  ): Promise<boolean> {
    try {
      // Check if the target chain is supported
      const supportedChains = [1, 11155111, 42161, 137]; // mainnet, sepolia, arbitrum, polygon
      return supportedChains.includes(targetChainId);
    } catch {
      return false;
    }
  }

  /**
   * Attempt to recover from signing errors
   */
  static async recoverFromSigningError(
    error: WagmiSigningError,
    retryCount: number = 2
  ): Promise<boolean> {
    if (retryCount <= 0) return false;

    try {
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 2000));
      return true;
    } catch {
      return false;
    }
  }
}
