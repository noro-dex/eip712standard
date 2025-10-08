# Wagmi Integration for EngineDex EIP-712 SDK

This document describes the Wagmi integration features added to the EngineDex EIP-712 SDK, providing seamless wallet detection, connection, and signing capabilities for React applications.

## Overview

The Wagmi integration extends the EngineDex EIP-712 SDK with modern wallet management capabilities, leveraging Wagmi's robust ecosystem for Ethereum wallet connections. This integration supports MetaMask, Coinbase Wallet, and other injected wallets through a unified interface.

## Features

- **Wallet Detection**: Automatic detection of available wallets
- **Multi-Wallet Support**: Support for MetaMask, Coinbase Wallet, and injected wallets
- **Chain Management**: Easy switching between supported chains
- **EIP-712 Signing**: Seamless integration with Wagmi's `useSignTypedData` hook
- **Multi-Signature Support**: Built-in multi-signature wallet management
- **Error Handling**: Comprehensive error handling with recovery strategies
- **Security Validation**: Built-in security validators for all operations

## Installation

The Wagmi integration requires additional peer dependencies:

```bash
npm install wagmi @tanstack/react-query viem
# or
yarn add wagmi @tanstack/react-query viem
```

## Quick Start

### 1. Setup Wagmi Provider

```tsx
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createEngineDexConfig } from '@enginedex/eip712-sdk';

const queryClient = new QueryClient();
const config = createEngineDexConfig({
  verifyingContract: '0x1234567890123456789012345678901234567890',
  chainId: 1,
  multiSignThreshold: 2,
  supportedChains: [1, 11155111, 42161, 137], // mainnet, sepolia, arbitrum, polygon
});

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <YourApp />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

### 2. Wallet Connection

```tsx
import { useEngineDexWallet } from '@enginedex/eip712-sdk';

function WalletComponent() {
  const {
    address,
    isConnected,
    chainId,
    readyConnectors,
    connectWallet,
    disconnectWallet,
    switchToChain,
    isChainSupported,
  } = useEngineDexWallet(config);

  if (isConnected && address) {
    return (
      <div>
        <p>Connected: {address}</p>
        <p>Chain: {chainId}</p>
        <button onClick={disconnectWallet}>Disconnect</button>
      </div>
    );
  }

  return (
    <div>
      {readyConnectors.map((connector) => (
        <button
          key={connector.uid}
          onClick={() => connectWallet(connector)}
        >
          Connect with {connector.name}
        </button>
      ))}
    </div>
  );
}
```

### 3. Message Signing

```tsx
import { useEngineDexSigning } from '@enginedex/eip712-sdk';

function SigningComponent() {
  const { signMessage, isPending, error } = useEngineDexSigning(config);

  const handleSign = async () => {
    const message = {
      domain: config.domain,
      types: {
        Message: [
          { name: 'content', type: 'string' },
          { name: 'timestamp', type: 'uint256' },
        ],
      },
      primaryType: 'Message',
      message: {
        content: 'Hello from EngineDex!',
        timestamp: Math.floor(Date.now() / 1000),
      },
    };

    try {
      const signature = await signMessage(message);
      console.log('Signature:', signature);
    } catch (error) {
      console.error('Signing failed:', error);
    }
  };

  return (
    <button onClick={handleSign} disabled={isPending}>
      {isPending ? 'Signing...' : 'Sign Message'}
    </button>
  );
}
```

### 4. Multi-Signature Wallets

```tsx
import { useMultiSignWallet } from '@enginedex/eip712-sdk';

function MultiSignComponent() {
  const { connectedWallets, addWallet, isThresholdMet, collectSignatures } = useMultiSignWallet(config);

  const handleCollectSignatures = async () => {
    const message = {
      domain: config.domain,
      types: {
        Message: [
          { name: 'content', type: 'string' },
          { name: 'timestamp', type: 'uint256' },
        ],
      },
      primaryType: 'Message',
      message: {
        content: 'Multi-sign message!',
        timestamp: Math.floor(Date.now() / 1000),
      },
    };

    try {
      const signatures = await collectSignatures(message);
      console.log('Collected signatures:', signatures);
    } catch (error) {
      console.error('Multi-sign failed:', error);
    }
  };

  return (
    <div>
      <p>Connected wallets: {connectedWallets.length}</p>
      <p>Threshold met: {isThresholdMet() ? 'Yes' : 'No'}</p>
      <button onClick={handleCollectSignatures} disabled={!isThresholdMet()}>
        Collect Signatures
      </button>
    </div>
  );
}
```

## API Reference

### Configuration

#### `createEngineDexConfig(options)`

Creates an EngineDex configuration with Wagmi integration.

**Parameters:**
- `options.verifyingContract` (string): The contract address for EIP-712 verification
- `options.chainId` (number, optional): Default chain ID (default: 1)
- `options.multiSignThreshold` (number, optional): Multi-signature threshold (default: 1)
- `options.supportedChains` (number[], optional): Array of supported chain IDs
- `options.autoConnect` (boolean, optional): Auto-connect on page load (default: true)

### Hooks

#### `useEngineDexWallet(config)`

Manages wallet connection state and provides connection utilities.

**Returns:**
- `address`: Current wallet address
- `isConnected`: Connection status
- `chainId`: Current chain ID
- `readyConnectors`: Available wallet connectors
- `connectWallet(connector)`: Connect to a specific wallet
- `disconnectWallet()`: Disconnect current wallet
- `switchToChain(chainId)`: Switch to a different chain
- `isChainSupported`: Whether current chain is supported

#### `useEngineDexSigning(config)`

Provides EIP-712 message signing capabilities.

**Returns:**
- `signMessage(message)`: Sign an EIP-712 message
- `isPending`: Whether signing is in progress
- `error`: Any signing error
- `isConnected`: Connection status
- `address`: Current wallet address

#### `useMultiSignWallet(config)`

Manages multi-signature wallet operations.

**Returns:**
- `connectedWallets`: Array of connected wallets
- `addWallet(walletId, wallet)`: Add a wallet to multi-sign setup
- `removeWallet(walletId)`: Remove a wallet from multi-sign setup
- `isThresholdMet()`: Check if threshold is met
- `collectSignatures(message)`: Collect signatures from all wallets

#### `useWalletDetection()`

Detects available wallets in the browser.

**Returns:**
- `availableWallets`: Array of available wallet types
- `isDetecting`: Whether detection is in progress

### Wallet Providers

#### `MetaMaskProvider`

MetaMask-specific wallet provider with additional MetaMask features.

**Methods:**
- `isMetaMaskAvailable()`: Check if MetaMask is installed
- `getMetaMaskVersion()`: Get MetaMask version

#### `CoinbaseWalletProvider`

Coinbase Wallet-specific provider.

#### `InjectedWalletProvider`

Generic injected wallet provider for other wallet extensions.

### Error Handling

The integration includes comprehensive error handling with specific error types:

- `WalletConnectionError`: Wallet connection failures
- `WalletDisconnectionError`: Wallet disconnection failures
- `ChainSwitchError`: Chain switching failures
- `WagmiSigningError`: Signing operation failures
- `MultiSignThresholdError`: Multi-signature threshold not met
- `WalletDetectionError`: Wallet detection failures
- `SecurityValidationError`: Security validation failures

### Security Features

- **Address Validation**: Validates Ethereum addresses
- **Chain ID Validation**: Ensures valid chain IDs
- **Domain Validation**: Validates EIP-712 domain configuration
- **Message Validation**: Validates EIP-712 message structure
- **Signature Validation**: Validates signature format
- **Threshold Validation**: Validates multi-signature thresholds

## Examples

See the complete example in `examples/wagmi-integration.tsx` for a full React application demonstrating all features.

## Migration from Basic SDK

If you're migrating from the basic EngineDex SDK to the Wagmi integration:

1. Install the required peer dependencies
2. Wrap your app with `WagmiProvider` and `QueryClientProvider`
3. Replace direct wallet provider usage with the new hooks
4. Update your signing logic to use the new signing hooks
5. Implement error handling using the new error classes

## Troubleshooting

### Common Issues

1. **"Cannot find module 'wagmi'"**: Install the required peer dependencies
2. **Wallet not detected**: Ensure the wallet extension is installed and enabled
3. **Chain switch fails**: Verify the target chain is supported in your configuration
4. **Signing fails**: Check that the wallet is connected and the message format is correct

### Debug Mode

Enable debug logging by setting the environment variable:

```bash
DEBUG=enginedex:wagmi
```

## Contributing

When contributing to the Wagmi integration:

1. Follow the existing code structure
2. Add comprehensive error handling
3. Include security validations
4. Write tests for new features
5. Update documentation

## License

This Wagmi integration is part of the EngineDex EIP-712 SDK and is licensed under the MIT License.
