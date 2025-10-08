## Updated SDK Design: Integrating Wagmi for Wallet Detection and Connection

In response to the recommendation to incorporate Wagmi as the preferred tool for wallet integration, the TypeScript SDK design has been refined to leverage Wagmi's capabilities. Wagmi is an excellent choice due to its robust support for Ethereum wallet connections, including MetaMask, through reactive hooks and configurable connectors. This integration enhances the SDK's Wallet Integration layer by providing seamless detection, connection, and management of wallets in React applications. The following sections outline the revisions to the SDK architecture, with a focus on Wagmi-specific implementation details. These updates maintain the SDK's modular nature while ensuring compatibility with EIP-712 signing requirements.

### Revised Architecture Overview
The SDK's layered architecture remains intact, but the Wallet Integration Layer now depends on Wagmi for handling wallet providers. Key interactions include:
- **Wallet Integration Layer**: Uses Wagmi's `createConfig` to set up connectors (e.g., for MetaMask via `injected` or `metaMask`) and wraps the application in `WagmiProvider` and `QueryClientProvider`.
- **Message Factory Layer**: Generates EIP-712 messages, which are passed to the Signing Strategy Layer.
- **Signing Strategy Layer**: Utilizes Wagmi's `useSignTypedData` hook for single-sign operations or aggregates signatures for multi-sign via custom logic.
- **Verification Layer**: Employs Wagmi's `useVerifyTypedData` for client-side verification before submission to `morm_signer`.

The SDK will export Wagmi-configured hooks and components for easy adoption in React frontends. Dependencies include `@wagmi/core`, `@tanstack/react-query`, and `viem` (for underlying Ethereum interactions). Installation: `npm install wagmi @tanstack/react-query viem`. The audit scope focuses on Wagmi wrappers to ensure secure handling of signatures and nonces.

### Core Components Updates
- **Interfaces**: 
  - `WalletProvider` now extends Wagmi's `Connector` type, adding methods like `detectWallet(): Promise<boolean>` for availability checks.
  - `SignableMessage` aligns with Wagmi's `TypedData` structure for seamless signing.
- **Classes**:
  - `EngineDexConfig`: Extends Wagmi's `Config` to include domain parameters (e.g., chainId: 1, verifyingContract: string) and default connectors.
  - `NonceManager`: Integrates with Wagmi's `useAccount` to fetch and validate nonces per connected address.

Code Snippet (Core Configuration):
```typescript
import { createConfig, http } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { injected, metaMask } from 'wagmi/connectors';

export interface EngineDexConfig extends Config {
  domain: { name: string; version: string; chainId: number; verifyingContract: string };
}

export function createEngineDexConfig(options: Partial<EngineDexConfig> = {}): EngineDexConfig {
  const defaultConfig = createConfig({
    chains: [mainnet],
    connectors: [injected(), metaMask()],
    transports: { [mainnet.id]: http() },
  });
  return { ...defaultConfig, domain: { name: 'EngineDex', version: '1.0', chainId: 1, verifyingContract: options.verifyingContract || '0x...' } };
}
```

### Wallet Integration Module
This module now centers on Wagmi for detection and connection. It provides a `useEngineDexWallet` hook that abstracts Wagmi's `useConnect`, `useAccount`, and `useDisconnect` for SDK-specific use cases, such as preparing for EIP-712 signing.

Key Features:
- **Wallet Detection**: Automatically checks for installed wallets (e.g., MetaMask) using connector readiness via `getProvider()`.
- **Connection Handling**: Supports multiple connectors with threshold for multi-sign setups.
- **Best Practices**: Handles reconnection on reload, chain mismatches, and user rejection errors. Ensures secure provider access without exposing private keys.

Code Snippet (Wallet Hook):
```typescript
import { useConnect, useAccount, useDisconnect, Connector } from 'wagmi';
import { useEffect, useState } from 'react';

export function useEngineDexWallet(config: EngineDexConfig) {
  const { connectors, connect } = useConnect();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [readyConnectors, setReadyConnectors] = useState<Connector[]>([]);

  useEffect(() => {
    const checkReadiness = async () => {
      const ready = await Promise.all(connectors.map(async (connector) => {
        const provider = await connector.getProvider().catch(() => null);
        return provider ? connector : null;
      }));
      setReadyConnectors(ready.filter(Boolean) as Connector[]);
    };
    checkReadiness();
  }, [connectors]);

  const connectWallet = (connector: Connector) => connect({ connector });

  return {
    address,
    isConnected,
    readyConnectors, // For displaying available wallets
    connectWallet,
    disconnectWallet: disconnect,
  };
}
```

Integration Example in React:
```typescript
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createEngineDexConfig, useEngineDexWallet } from 'engine-dex-sdk';

const queryClient = new QueryClient();
const config = createEngineDexConfig({ verifyingContract: '0xYourContract' });

function WalletComponent() {
  const { readyConnectors, connectWallet, address, isConnected, disconnectWallet } = useEngineDexWallet(config);

  if (isConnected) {
    return (
      <div>
        Connected: {address}
        <button onClick={disconnectWallet}>Disconnect</button>
      </div>
    );
  }

  return (
    <div>
      {readyConnectors.map((connector) => (
        <button key={connector.uid} onClick={() => connectWallet(connector)}>
          Connect with {connector.name}
        </button>
      ))}
    </div>
  );
}

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <WalletComponent />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

### Signing Strategies with Wagmi
For single-sign: Use Wagmi's `useSignTypedData` hook to sign EIP-712 messages.
For multi-sign: Aggregate signatures by collecting from multiple connected accounts, verifying thresholds.

Code Snippet (Signing Example):
```typescript
import { useSignTypedData } from 'wagmi';

function useSignMessage(message: SignableMessage) {
  const { signTypedData } = useSignTypedData();
  return async () => {
    const signature = await signTypedData({
      domain: message.domain,
      types: message.types,
      primaryType: message.primaryType,
      message: message.value,
    });
    // Submit to morm_signer via API
    return signature;
  };
}
```

### Error Handling and Security
- Custom errors: Extend Wagmi's error types (e.g., `WalletNotReadyError`).
- Security: Validate connector readiness before signing; use Wagmi's built-in chain verification to prevent mismatches.
- Caveats: Wagmi requires a WalletConnect project ID for non-injected connectors; handle mobile/browser differences.

This integration positions Wagmi as the core for wallet functionality, ensuring efficient detection and connection while aligning with the SDK's goals for secure message signing. If further refinements are needed, such as multi-sign specifics or testing setups, please provide additional details.