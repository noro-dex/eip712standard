/**
 * React hooks for EngineDex wallet integration with Wagmi
 * Provides reactive wallet state management and connection utilities
 */

import { useConnect, useAccount, useDisconnect, useSignTypedData, useSwitchChain } from 'wagmi';
import { useEffect, useState, useCallback } from 'react';
import type { Connector } from 'wagmi';
import type { EngineDexConfig, EngineDexWalletProvider, WalletConnectionState } from './mixwallet';
import type { EIP712Domain } from '../interfaces/SignableMessage';

/**
 * Custom hook for EngineDex wallet management
 * Integrates Wagmi's wallet functionality with EngineDex-specific features
 */
export function useEngineDexWallet(config: EngineDexConfig) {
  const { connectors, connect, isPending } = useConnect();
  const { address, isConnected, chainId, connector } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  
  const [readyConnectors, setReadyConnectors] = useState<Connector[]>([]);
  const [connectionState, setConnectionState] = useState<WalletConnectionState>({
    isConnected: false,
    address: null,
    chainId: null,
    connectorId: null,
    error: null,
  });

  // Update connection state when account changes
  useEffect(() => {
    setConnectionState({
      isConnected,
      address: address || null,
      chainId: chainId || null,
      connectorId: connector?.id || null,
      error: null,
    });
  }, [isConnected, address, chainId, connector]);

  // Check connector readiness
  useEffect(() => {
    let isMounted = true;
    
    const checkReadiness = async () => {
      try {
        const ready = await Promise.all(
          connectors.map(async (connector) => {
            try {
              const provider = await connector.getProvider().catch(() => null);
              return provider ? connector : null;
            } catch {
              return null;
            }
          })
        );
        
        if (isMounted) {
          setReadyConnectors(ready.filter(Boolean) as Connector[]);
        }
      } catch (error) {
        console.error('Error checking connector readiness:', error);
      }
    };
    
    checkReadiness();
    
    return () => {
      isMounted = false;
    };
  }, [connectors]);

  /**
   * Connect to a specific wallet
   */
  const connectWallet = useCallback(async (connector: Connector) => {
    try {
      setConnectionState(prev => ({ ...prev, error: null }));
      await connect({ connector });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      setConnectionState(prev => ({ ...prev, error: errorMessage }));
      
      // Log error for debugging
      console.error('Wallet connection failed:', error);
      throw error;
    }
  }, [connect]);

  /**
   * Disconnect from current wallet
   */
  const disconnectWallet = useCallback(async () => {
    try {
      await disconnect();
      setConnectionState({
        isConnected: false,
        address: null,
        chainId: null,
        connectorId: null,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Disconnection failed';
      setConnectionState(prev => ({ ...prev, error: errorMessage }));
      
      // Log error for debugging
      console.error('Wallet disconnection failed:', error);
      throw error;
    }
  }, [disconnect]);

  /**
   * Switch to a different chain
   */
  const switchToChain = useCallback(async (targetChainId: number) => {
    try {
      // Validate chain ID
      if (!Number.isInteger(targetChainId) || targetChainId <= 0) {
        throw new Error('Invalid chain ID');
      }
      
      await switchChain({ chainId: targetChainId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Chain switch failed';
      setConnectionState(prev => ({ ...prev, error: errorMessage }));
      
      // Log error for debugging
      console.error('Chain switch failed:', error);
      throw error;
    }
  }, [switchChain]);

  /**
   * Check if current chain is supported
   */
  const isChainSupported = useCallback((currentChainId: number | null | undefined) => {
    if (!currentChainId) return false;
    return config.supportedChains?.includes(currentChainId) ?? true;
  }, [config.supportedChains]);

  return {
    // Connection state
    address,
    isConnected,
    chainId,
    connector,
    connectionState,
    
    // Available connectors
    readyConnectors,
    connectors,
    
    // Actions
    connectWallet,
    disconnectWallet,
    switchToChain,
    
    // Utilities
    isChainSupported: isChainSupported(chainId),
    isPending,
  };
}

/**
 * Hook for EIP-712 message signing with Wagmi integration
 */
export function useEngineDexSigning(config: EngineDexConfig) {
  const { signTypedData, isPending, error } = useSignTypedData();
  const { address, isConnected } = useAccount();

  /**
   * Sign an EIP-712 message
   */
  const signMessage = useCallback(async (message: {
    domain: EIP712Domain;
    types: Record<string, Array<{ name: string; type: string }>>;
    primaryType: string;
    message: Record<string, unknown>;
  }) => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }

    try {
      const signature = await signTypedData({
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
      const errorMessage = error instanceof Error ? error.message : 'Signing failed';
      throw new Error(errorMessage);
    }
  }, [signTypedData, isConnected, address]);

  return {
    signMessage,
    isPending,
    error,
    isConnected,
    address,
  };
}

/**
 * Hook for multi-signature wallet management
 */
export function useMultiSignWallet(config: EngineDexConfig) {
  const [connectedWallets, setConnectedWallets] = useState<Map<string, EngineDexWalletProvider>>(new Map());
  const threshold = config.multiSignThreshold || 1;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear connected wallets on unmount
      setConnectedWallets(new Map());
    };
  }, []);

  /**
   * Add a wallet to the multi-sign setup
   */
  const addWallet = useCallback((wallet: EngineDexWalletProvider) => {
    setConnectedWallets(prev => {
      const newMap = new Map(prev);
      newMap.set(wallet.id, wallet);
      return newMap;
    });
  }, []);

  /**
   * Remove a wallet from the multi-sign setup
   */
  const removeWallet = useCallback((walletId: string) => {
    setConnectedWallets(prev => {
      const newMap = new Map(prev);
      newMap.delete(walletId);
      return newMap;
    });
  }, []);

  /**
   * Check if threshold is met
   */
  const isThresholdMet = useCallback(() => {
    return connectedWallets.size >= threshold;
  }, [connectedWallets.size, threshold]);

  /**
   * Collect signatures from all connected wallets
   */
  const collectSignatures = useCallback(async (message: {
    domain: EIP712Domain;
    types: Record<string, Array<{ name: string; type: string }>>;
    primaryType: string;
    message: Record<string, unknown>;
  }) => {
    const signatures = [];
    const errors: Array<{ walletId: string; error: Error }> = [];
    
    for (const [walletId, wallet] of connectedWallets) {
      try {
        const address = await wallet.getAddress();
        if (address) {
          const signature = await wallet.signTypedData(message);
          signatures.push({ walletId, address, signature });
        } else {
          errors.push({ walletId, error: new Error('No address available') });
        }
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error('Unknown error');
        errors.push({ walletId, error: errorObj });
        console.error(`Failed to get signature from wallet ${walletId}:`, error);
      }
    }

    // If we have errors and no signatures, throw an error
    if (errors.length > 0 && signatures.length === 0) {
      throw new Error(`Failed to collect signatures from all wallets: ${errors.map(e => e.error.message).join(', ')}`);
    }

    return signatures;
  }, [connectedWallets]);

  return {
    connectedWallets: Array.from(connectedWallets.values()),
    addWallet,
    removeWallet,
    isThresholdMet,
    collectSignatures,
    threshold,
  };
}

/**
 * Hook for wallet detection and availability
 */
export function useWalletDetection() {
  const [availableWallets, setAvailableWallets] = useState<string[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const detectWallets = async () => {
      if (!isMounted) return;
      
      setIsDetecting(true);
      try {
        // Check for common wallet providers
        const wallets = [];
        
        // MetaMask
        if (typeof window !== 'undefined' && (window as any).ethereum?.isMetaMask) {
          wallets.push('metaMask');
        }
        
        // Coinbase Wallet
        if (typeof window !== 'undefined' && (window as any).ethereum?.isCoinbaseWallet) {
          wallets.push('coinbaseWallet');
        }
        
        // Generic injected wallet
        if (typeof window !== 'undefined' && (window as any).ethereum) {
          wallets.push('injected');
        }
        
        if (isMounted) {
          setAvailableWallets(wallets);
        }
      } catch (error) {
        console.error('Wallet detection failed:', error);
      } finally {
        if (isMounted) {
          setIsDetecting(false);
        }
      }
    };

    detectWallets();
    
    return () => {
      isMounted = false;
    };
  }, []);

  return {
    availableWallets,
    isDetecting,
  };
}
