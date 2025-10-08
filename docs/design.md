## SDK Design Pattern Abstract

The TypeScript SDK for EngineDex is designed as a modular, extensible library that facilitates secure message creation and signing for frontend applications. It adopts a layered architecture pattern, separating concerns into abstraction layers for message construction, signing strategies, wallet integration, and verification. This pattern draws from the Factory and Strategy design patterns: the Factory pattern handles message creation based on operation types, while the Strategy pattern allows interchangeable signing mechanisms (e.g., single-sign via MetaMask or multi-sign via aggregated signatures). The SDK ensures compatibility with Ethereum wallets like MetaMask for EIP-712 typed data signing, integrates with the `morm_signer` for backend submission, and supports both single-sign (direct wallet signing) and multi-sign (threshold-based aggregation). Core principles emphasize security through cryptographic standards, usability via intuitive APIs, and extensibility for future operation types. The SDK minimizes dependencies, relying on ethers.js for Ethereum interactions, and provides type-safe interfaces for robust development.

## Outline of SDK Sections

### Architecture Overview
This section describes the high-level structure of the SDK, including key modules and their interactions. It outlines the flow from message creation to signing and submission, highlighting how the SDK bridges frontend wallets with backend components like `morm_signer`. Content includes diagrams (in markdown ASCII art) of the layered architecture: Wallet Integration Layer → Message Factory Layer → Signing Strategy Layer → Verification Layer. It also covers dependencies (e.g., ethers.js for signing utilities) and setup instructions, such as npm installation and initialization with domain parameters (e.g., chainId, verifyingContract).

### Core Components
Details the foundational classes and interfaces. Key elements include:
- **Interfaces**: Define contracts like `SignableMessage` (extending EIP-712 typed data), `SignerStrategy` (for single/multi-sign logic), and `WalletProvider` (abstracting MetaMask or other providers).
- **Classes**: 
  - `MessageFactory`: Creates typed messages based on operation types (e.g., OrderSubmission, Withdrawal) from the `types` package, mapping Go structs to TypeScript objects.
  - `DomainConfig`: Holds EIP-712 domain data (name: "EngineDex", version: "1.0", chainId).
  - `NonceManager`: Client-side nonce generation and tracking to prevent replays, with optional integration to backend nonce validation.
Content includes code snippets for class definitions and usage examples, emphasizing type safety with TypeScript generics.

### Message Creation Module
Focuses on constructing EIP-712 compliant messages. It outlines how to map Go-defined operation types (e.g., from `types/operation_type.go` and `types/message_standard.go`) to TypeScript. Content covers:
- Factory methods for each operation (e.g., `createOrderSubmissionMessage(owner: string, nonce: bigint, deadline: bigint, ...)`).
- Support for critical operations requiring signatures (e.g., Deposit, Withdrawal) versus low-security ones (e.g., GetBalance).
- Validation logic to ensure message integrity (e.g., checking nonce uniqueness, deadline in future).
- Examples of generating typed data objects compatible with ethers.js `TypedDataEncoder`.

### Signing Strategies
Describes the Strategy pattern implementation for flexible signing. Sections include:
- **Single-Sign Strategy**: Direct signing via wallet provider (e.g., MetaMask's `eth_signTypedData_v4`), producing a single signature.
- **Multi-Sign Strategy**: Threshold-based signing, aggregating signatures from multiple signers (inspired by `multisig` package). Supports EIP-1271 verification and aggregation methods (e.g., ECDSA or Schnorr via `btcutilecc` utilities ported to JS).
- **Hybrid Support**: Allows starting with single-sign and upgrading to multi-sign wallets.
Content provides API examples, such as `signer.signMessage(message: SignableMessage): Promise<string | SignatureAggregate>`, and integration with `morm_signer` for final submission (e.g., via API calls).

### Wallet Integration
Covers connectivity to browser extensions like MetaMask. Content includes:
- Abstraction over `window.ethereum` for provider detection and connection.
- Methods for account retrieval, chain switching, and signing requests.
- Error handling for common issues (e.g., user rejection, network mismatch).
- Examples: `connectWallet(): Promise<string[]>` for addresses, and seamless signing flow.

### Verification and Submission
Outlines client-side verification before submission to `morm_signer`. Content includes:
- Utilities to recover signer addresses from signatures using ethers.js.
- Multi-sign verification logic (e.g., threshold checks).
- Submission flow: Serialize signed messages and post to backend endpoints (e.g., via fetch to `/submit-tx`).
- Integration with auth modules (e.g., session management from `auth` package for non-critical ops).

### Error Handling and Security
Details robust error management and best practices. Content covers:
- Custom error classes (e.g., `InvalidNonceError`, `SignatureThresholdError`).
- Security audits points: Use of secure random for nonces, timestamp validation.
- Logging and debugging utilities without exposing sensitive data.

### Testing and Examples
Provides unit test setups using Jest, and end-to-end examples. Content includes:
- Mock wallet providers for testing.
- Demos mirroring Go `demos` package (e.g., single-sign order submission, multi-sign wallet creation).
- Quickstart guides for integration into React/Vue apps.

### Extensibility and Maintenance
Discusses how to extend the SDK. Content includes:
- Adding new operation types via registry (inspired by `msgfactory` and `multisig/registry.go`).
- Versioning strategy and changelog guidelines.
- Contribution notes, including porting additional Go features (e.g., blind signing from `btcutilecc`).

## First Principles for Signing Messages

To fulfill the goal of secure message signing, adhere to these fundamental principles:

1. **Security Through Standards**: Base all signing on EIP-712 for structured data, ensuring domain separation to prevent cross-contract replay attacks. Use cryptographic primitives (e.g., ECDSA) ported from `btcutilecc` for multi-sign aggregation, and enforce nonce/timestamp validation to mitigate replays.

2. **Wallet-Centric Usability**: Design APIs around user wallet interactions, prioritizing asynchronous promises for non-blocking UI. Support MetaMask natively via `eth_signTypedData_v4`, with fallbacks for other providers, ensuring minimal user friction while maintaining control over signing.

3. **Flexibility in Signatures**: Treat single-sign as a base case (one signature) and multi-sign as an extension (threshold aggregation), using abstract strategies to switch modes seamlessly. This allows progressive enhancement from simple wallets to advanced multisig setups without API changes.

4. **Verification Parity**: Ensure client-side signing produces verifiable outputs matching backend expectations (e.g., via `msgfactory/universal_signature_verifier.go`), with optional local verification before submission to `morm_signer` for efficiency.

5. **Minimalism and Auditability**: Keep the SDK lightweight, avoiding unnecessary state, and structure code for easy audits (e.g., isolate crypto operations). Prioritize immutability in message objects to prevent tampering.