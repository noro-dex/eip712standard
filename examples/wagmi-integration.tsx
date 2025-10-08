/**
 * Example React component demonstrating Wagmi integration with EngineDex EIP-712 SDK
 * Shows how to use the new wallet extensions for wallet detection, connection, and signing
 */

import React, { useState, useEffect } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createEngineDexConfig,
  useEngineDexWallet,
  useEngineDexSigning,
  useMultiSignWallet,
  useWalletDetection,
  WalletProviderFactory,
  WagmiErrorHandler,
  WagmiSecurityValidator,
} from '../src/walletexten';

// Create query client for Wagmi
const queryClient = new QueryClient();

// Create EngineDex configuration
const config = createEngineDexConfig({
  verifyingContract: '0x1234567890123456789012345678901234567890',
  chainId: 1,
  multiSignThreshold: 2,
  supportedChains: [1, 11155111, 42161, 137], // mainnet, sepolia, arbitrum, polygon
});

/**
 * Wallet connection component
 */
function WalletConnection() {
  const {
    address,
    isConnected,
    chainId,
    readyConnectors,
    connectWallet,
    disconnectWallet,
    switchToChain,
    isChainSupported,
    connectionState,
  } = useEngineDexWallet(config);

  const { availableWallets, isDetecting } = useWalletDetection();

  const handleConnect = async (connector: any) => {
    try {
      await connectWallet(connector);
    } catch (error) {
      const wagmiError = WagmiErrorHandler.handleConnectionError(error, connector.id);
      console.error('Connection failed:', wagmiError.message);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
    } catch (error) {
      const wagmiError = WagmiErrorHandler.handleDisconnectionError(error);
      console.error('Disconnection failed:', wagmiError.message);
    }
  };

  const handleSwitchChain = async (targetChainId: number) => {
    try {
      await switchToChain(targetChainId);
    } catch (error) {
      const wagmiError = WagmiErrorHandler.handleChainSwitchError(error, chainId, targetChainId);
      console.error('Chain switch failed:', wagmiError.message);
    }
  };

  if (isConnected && address) {
    return (
      <div className="wallet-connected">
        <h3>Wallet Connected</h3>
        <p>Address: {address}</p>
        <p>Chain ID: {chainId}</p>
        <p>Chain Supported: {isChainSupported ? 'Yes' : 'No'}</p>
        
        <div className="chain-switcher">
          <h4>Switch Chain:</h4>
          <button onClick={() => handleSwitchChain(1)}>Ethereum Mainnet</button>
          <button onClick={() => handleSwitchChain(11155111)}>Sepolia Testnet</button>
          <button onClick={() => handleSwitchChain(42161)}>Arbitrum One</button>
          <button onClick={() => handleSwitchChain(137)}>Polygon</button>
        </div>
        
        <button onClick={handleDisconnect} className="disconnect-btn">
          Disconnect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="wallet-connection">
      <h3>Connect Wallet</h3>
      <p>Available wallets: {availableWallets.join(', ')}</p>
      <p>Detecting: {isDetecting ? 'Yes' : 'No'}</p>
      
      <div className="connectors">
        {readyConnectors.map((connector) => (
          <button
            key={connector.uid}
            onClick={() => handleConnect(connector)}
            className="connect-btn"
          >
            Connect with {connector.name}
          </button>
        ))}
      </div>
      
      {connectionState.error && (
        <div className="error">
          Error: {connectionState.error}
        </div>
      )}
    </div>
  );
}

/**
 * Message signing component
 */
function MessageSigning() {
  const { address, isConnected } = useEngineDexWallet(config);
  const { signMessage, isPending, error } = useEngineDexSigning(config);
  const [signature, setSignature] = useState<string | null>(null);

  const handleSignMessage = async () => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

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
      // Validate message before signing
      if (!WagmiSecurityValidator.validateMessage(message)) {
        throw new Error('Invalid message format');
      }

      const sig = await signMessage(message);
      setSignature(sig);
    } catch (error) {
      const wagmiError = WagmiErrorHandler.handleSigningError(error, 'unknown', 'signMessage');
      console.error('Signing failed:', wagmiError.message);
    }
  };

  return (
    <div className="message-signing">
      <h3>Sign Message</h3>
      <button onClick={handleSignMessage} disabled={!isConnected || isPending}>
        {isPending ? 'Signing...' : 'Sign Message'}
      </button>
      
      {signature && (
        <div className="signature">
          <h4>Signature:</h4>
          <p>{signature}</p>
        </div>
      )}
      
      {error && (
        <div className="error">
          Error: {error.message}
        </div>
      )}
    </div>
  );
}

/**
 * Multi-signature wallet component
 */
function MultiSignWallet() {
  const { address, isConnected } = useEngineDexWallet(config);
  const { connectedWallets, addWallet, removeWallet, isThresholdMet, collectSignatures } = useMultiSignWallet(config);
  const [signatures, setSignatures] = useState<any[]>([]);

  const handleAddWallet = (walletId: string) => {
    // In a real implementation, you would get the actual wallet provider
    const mockWallet = {
      id: walletId,
      name: `Wallet ${walletId}`,
      getAddress: async () => `0x${Math.random().toString(16).substr(2, 40)}`,
      signTypedData: async (message: any) => `0x${Math.random().toString(16).substr(2, 130)}`,
    };
    
    addWallet(walletId, mockWallet);
  };

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
        content: 'Multi-sign message from EngineDex!',
        timestamp: Math.floor(Date.now() / 1000),
      },
    };

    try {
      const sigs = await collectSignatures(message);
      setSignatures(sigs);
    } catch (error) {
      console.error('Multi-sign failed:', error);
    }
  };

  return (
    <div className="multi-sign-wallet">
      <h3>Multi-Signature Wallet</h3>
      <p>Connected wallets: {connectedWallets.length}</p>
      <p>Threshold met: {isThresholdMet() ? 'Yes' : 'No'}</p>
      
      <div className="wallet-management">
        <button onClick={() => handleAddWallet('wallet1')}>Add Wallet 1</button>
        <button onClick={() => handleAddWallet('wallet2')}>Add Wallet 2</button>
        <button onClick={() => handleAddWallet('wallet3')}>Add Wallet 3</button>
      </div>
      
      <button 
        onClick={handleCollectSignatures} 
        disabled={!isThresholdMet()}
      >
        Collect Signatures
      </button>
      
      {signatures.length > 0 && (
        <div className="signatures">
          <h4>Collected Signatures:</h4>
          {signatures.map((sig, index) => (
            <div key={index}>
              <p>Wallet: {sig.walletId}</p>
              <p>Address: {sig.address}</p>
              <p>Signature: {sig.signature}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Main App component
 */
function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <div className="app">
          <h1>EngineDex EIP-712 SDK with Wagmi Integration</h1>
          
          <div className="section">
            <WalletConnection />
          </div>
          
          <div className="section">
            <MessageSigning />
          </div>
          
          <div className="section">
            <MultiSignWallet />
          </div>
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
