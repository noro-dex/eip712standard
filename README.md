# EngineDex EIP-712 SDK

A TypeScript SDK for secure message creation and signing for EngineDex frontend applications. Supports both single-sign and multi-sign strategies with EIP-712 typed data.

## Features

- 🔐 **EIP-712 Compliant**: Full support for Ethereum's typed data signing standard
- 🔄 **Flexible Signing**: Single-sign and multi-sign strategies with threshold support
- 🦊 **MetaMask Integration**: Native support for MetaMask and other Ethereum wallets
- 🛡️ **Security First**: Built-in nonce management and replay attack prevention
- 📦 **Type Safe**: Full TypeScript support with comprehensive type definitions
- ⚡ **Bun Optimized**: Built and tested with Bun for maximum performance

## Installation

```bash
# Using Bun (recommended)
bun add @enginedex/eip712-sdk

# Using npm
npm install @enginedex/eip712-sdk

# Using yarn
yarn add @enginedex/eip712-sdk
```

## Quick Start

### Basic Usage

```typescript
import { 
  MessageFactory, 
  DomainConfig, 
  NonceManager,
  SingleSignStrategy,
  MetaMaskProvider 
} from '@enginedex/eip712-sdk';

// Initialize the SDK
const domainConfig = new DomainConfig(
  'EngineDex',
  '1.0',
  1, // Ethereum mainnet
  '0x...' // Your contract address
);

const nonceManager = new NonceManager();
const messageFactory = new MessageFactory(domainConfig, nonceManager);

// Create a wallet provider
const walletProvider = new MetaMaskProvider();

// Create a signing strategy
const signer = new SingleSignStrategy(walletProvider);

// Create and sign a message
const message = messageFactory.createDepositMessage(
  '0x...', // owner address
  BigInt('1000000000000000000'), // 1 ETH
  '0x...' // token address
);

const signature = await signer.signMessage(message);
```

### Multi-Sign Usage

```typescript
import { MultiSignStrategy } from '@enginedex/eip712-sdk';

// Create multiple wallet providers
const providers = [new MetaMaskProvider(), /* other providers */];

// Configure multi-sign
const multiSignConfig = {
  threshold: 2,
  signers: ['0x...', '0x...', '0x...'],
  aggregationMethod: 'ecdsa' as const
};

const multiSigner = new MultiSignStrategy(providers, multiSignConfig);

// Sign with multiple signers
const signature = await multiSigner.signMessage(message);
```

## API Reference

### Core Classes

#### `MessageFactory`
Creates EIP-712 compliant messages for different operations.

```typescript
const factory = new MessageFactory(domainConfig, nonceManager);

// Create different types of messages
const depositMessage = factory.createDepositMessage(owner, amount, token);
const withdrawalMessage = factory.createWithdrawalMessage(owner, amount, token, to);
const orderMessage = factory.createOrderSubmissionMessage(owner, side, amount, price, token, orderType);
```

#### `DomainConfig`
Manages EIP-712 domain configuration.

```typescript
const domain = new DomainConfig(
  'EngineDex',    // name
  '1.0',         // version
  1,             // chainId
  '0x...'        // verifyingContract
);
```

#### `NonceManager`
Handles nonce generation and validation to prevent replay attacks.

```typescript
const nonceManager = new NonceManager();

// Generate a new nonce
const nonce = nonceManager.generateNonce();

// Validate a nonce
const isValid = nonceManager.validateNonce(nonce);
```

### Signing Strategies

#### `SingleSignStrategy`
Signs messages with a single wallet.

```typescript
const signer = new SingleSignStrategy(walletProvider);
const signature = await signer.signMessage(message);
```

#### `MultiSignStrategy`
Aggregates signatures from multiple signers.

```typescript
const multiSigner = new MultiSignStrategy(providers, config);
const signature = await multiSigner.signMessage(message);
```

### Wallet Providers

#### `MetaMaskProvider`
Integration with MetaMask wallet.

```typescript
const provider = new MetaMaskProvider();

// Connect to wallet
const connection = await provider.connect();

// Sign typed data
const signature = await provider.signTypedData(message);
```

## Error Handling

The SDK provides comprehensive error handling with specific error types:

```typescript
import { 
  EngineDexError,
  InvalidNonceError,
  SignatureThresholdError,
  WalletConnectionError 
} from '@enginedex/eip712-sdk';

try {
  const signature = await signer.signMessage(message);
} catch (error) {
  if (error instanceof InvalidNonceError) {
    // Handle nonce errors
  } else if (error instanceof WalletConnectionError) {
    // Handle wallet connection errors
  }
}
```

## Development

### Prerequisites

- [Bun](https://bun.sh) >= 1.0.0
- Node.js >= 18.0.0

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd eip712standard

# Install dependencies
bun install

# Build the project
bun run build

# Run tests
bun test

# Run linting
bun run lint
```

### Scripts

- `bun run build` - Build the project
- `bun run dev` - Development mode with watch
- `bun test` - Run tests
- `bun run lint` - Lint code
- `bun run type-check` - Type checking

## Architecture

The SDK follows a layered architecture pattern:

```
┌─────────────────────────────────────┐
│           Wallet Integration        │
├─────────────────────────────────────┤
│           Message Factory           │
├─────────────────────────────────────┤
│         Signing Strategy            │
├─────────────────────────────────────┤
│           Verification              │
└─────────────────────────────────────┘
```

## Security Considerations

- **Nonce Management**: Automatic nonce generation and validation
- **Replay Protection**: Built-in mechanisms to prevent replay attacks
- **Signature Verification**: Client-side verification before submission
- **Domain Separation**: Proper EIP-712 domain configuration
- **Secure Randomness**: Cryptographically secure nonce generation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.
