/**
 * EngineDex EIP-712 SDK
 * 
 * A TypeScript SDK for secure message creation and signing for EngineDex frontend applications.
 * Supports both single-sign and multi-sign strategies with EIP-712 typed data.
 */

// Core exports
export * from './core/MessageFactory';
export * from './core/DomainConfig';
export * from './core/NonceManager';

// Interface exports
export * from './interfaces/SignableMessage';
export * from './interfaces/SignerStrategy';
export * from './interfaces/WalletProvider';

// Strategy exports
export * from './strategies/SingleSignStrategy';
export * from './strategies/MultiSignStrategy';

// Utility exports
export * from './utils/wallet';
export * from './utils/verification';
export * from './utils/crypto';

// Type exports
export * from './types/operations';
export * from './types/signatures';

// Error exports
export * from './errors/EngineDexError';
export * from './errors/InvalidNonceError';
export * from './errors/SignatureThresholdError';
export * from './errors/WalletConnectionError';

// Wagmi wallet extensions
export * from './walletexten';
