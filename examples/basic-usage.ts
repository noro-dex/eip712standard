/**
 * Basic usage example for EngineDex EIP-712 SDK
 * Demonstrates single-sign message creation and signing
 */

import {
  MessageFactory,
  DomainConfig,
  NonceManager,
  SingleSignStrategy,
  MetaMaskProvider
} from '../src/index';

async function basicExample() {
  console.log('🚀 EngineDex EIP-712 SDK - Basic Usage Example');

  try {
    // 1. Initialize the SDK components
    const domainConfig = new DomainConfig(
      'EngineDex',
      '1.0',
      1, // Ethereum mainnet
      '0x1234567890123456789012345678901234567890' // Example contract address
    );

    const nonceManager = new NonceManager();
    const messageFactory = new MessageFactory(domainConfig, nonceManager);

    // 2. Create a wallet provider
    const walletProvider = new MetaMaskProvider();
    
    if (!walletProvider.isAvailable()) {
      throw new Error('MetaMask not available');
    }

    // 3. Create a signing strategy
    const signer = new SingleSignStrategy(walletProvider);

    // 4. Create a deposit message
    console.log('📝 Creating deposit message...');
    const depositMessage = messageFactory.createDepositMessage(
      '0x742d35Cc6634C0532925a3b8D0C0e4C8C8C8C8C8', // owner
      BigInt('1000000000000000000'), // 1 ETH
      '0x0000000000000000000000000000000000000000' // ETH token address
    );

    console.log('✅ Deposit message created:', {
      operation: depositMessage.message.operation,
      nonce: depositMessage.message.nonce,
      deadline: depositMessage.message.deadline,
      owner: depositMessage.message.owner,
      amount: depositMessage.message.amount
    });

    // 5. Validate the message
    const validation = messageFactory.validateMessage(depositMessage);
    if (!validation.isValid) {
      throw new Error(`Message validation failed: ${validation.errors.join(', ')}`);
    }

    console.log('✅ Message validation passed');

    // 6. Sign the message
    console.log('🔐 Signing message...');
    const signature = await signer.signMessage(depositMessage);

    console.log('✅ Message signed:', {
      signature: signature.signature,
      signer: signature.signer
    });

    // 7. Verify the signature
    console.log('🔍 Verifying signature...');
    const isValid = await signer.verifySignature(signature);
    console.log(`✅ Signature verification: ${isValid ? 'PASSED' : 'FAILED'}`);

    console.log('🎉 Basic example completed successfully!');

  } catch (error) {
    console.error('❌ Error in basic example:', error);
  }
}

// Run the example
if (typeof window !== 'undefined') {
  // Browser environment
  document.addEventListener('DOMContentLoaded', basicExample);
} else {
  // Node.js environment
  basicExample();
}
