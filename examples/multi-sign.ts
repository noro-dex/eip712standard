/**
 * Multi-sign example for EngineDex EIP-712 SDK
 * Demonstrates multi-signature message creation and signing
 */

import {
  MessageFactory,
  DomainConfig,
  NonceManager,
  MultiSignStrategy,
  MetaMaskProvider
} from '../src/index';

async function multiSignExample() {
  console.log('🚀 EngineDex EIP-712 SDK - Multi-Sign Example');

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

    // 2. Create multiple wallet providers (in a real app, these would be different wallets)
    const providers = [
      new MetaMaskProvider(),
      // In a real scenario, you'd have multiple different wallet providers
    ];

    // 3. Configure multi-sign
    const multiSignConfig = {
      threshold: 2,
      signers: [
        '0x742d35Cc6634C0532925a3b8D0C0e4C8C8C8C8C8',
        '0x842d35Cc6634C0532925a3b8D0C0e4C8C8C8C8C8C8',
        '0x942d35Cc6634C0532925a3b8D0C0e4C8C8C8C8C8C8'
      ],
      aggregationMethod: 'ecdsa' as const
    };

    // 4. Create multi-sign strategy
    const multiSigner = new MultiSignStrategy(providers, multiSignConfig);

    // 5. Create an order submission message
    console.log('📝 Creating order submission message...');
    const orderMessage = messageFactory.createOrderSubmissionMessage(
      '0x742d35Cc6634C0532925a3b8D0C0e4C8C8C8C8C8C8', // owner
      'buy', // side
      BigInt('1000000000000000000'), // 1 ETH
      BigInt('2000000000000000000'), // 2 ETH price
      '0x0000000000000000000000000000000000000000', // ETH token
      'limit' // order type
    );

    console.log('✅ Order message created:', {
      operation: orderMessage.message.operation,
      nonce: orderMessage.message.nonce,
      deadline: orderMessage.message.deadline,
      owner: orderMessage.message.owner,
      side: orderMessage.message.side,
      amount: orderMessage.message.amount,
      price: orderMessage.message.price
    });

    // 6. Validate the message
    const validation = messageFactory.validateMessage(orderMessage);
    if (!validation.isValid) {
      throw new Error(`Message validation failed: ${validation.errors.join(', ')}`);
    }

    console.log('✅ Message validation passed');

    // 7. Sign with multiple signers
    console.log('🔐 Signing message with multiple signers...');
    const signature = await multiSigner.signMessage(orderMessage);

    console.log('✅ Multi-signature created:', {
      signatures: signature.signatures.length,
      signers: signature.signers,
      threshold: signature.threshold,
      aggregateSignature: signature.aggregateSignature
    });

    // 8. Verify the multi-signature
    console.log('🔍 Verifying multi-signature...');
    const isValid = await multiSigner.verifySignature(signature);
    console.log(`✅ Multi-signature verification: ${isValid ? 'PASSED' : 'FAILED'}`);

    console.log('🎉 Multi-sign example completed successfully!');

  } catch (error) {
    console.error('❌ Error in multi-sign example:', error);
  }
}

// Run the example
if (typeof window !== 'undefined') {
  // Browser environment
  document.addEventListener('DOMContentLoaded', multiSignExample);
} else {
  // Node.js environment
  multiSignExample();
}
