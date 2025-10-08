/**
 * Basic tests for EngineDex EIP-712 SDK
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import {
  MessageFactory,
  DomainConfig,
  NonceManager,
  SingleSignStrategy,
  MetaMaskProvider
} from '../src/index';

describe('EngineDex EIP-712 SDK', () => {
  let domainConfig: DomainConfig;
  let nonceManager: NonceManager;
  let messageFactory: MessageFactory;

  beforeEach(() => {
    domainConfig = new DomainConfig(
      'EngineDex',
      '1.0',
      1,
      '0x1234567890123456789012345678901234567890'
    );
    nonceManager = new NonceManager();
    messageFactory = new MessageFactory(domainConfig, nonceManager);
  });

  describe('DomainConfig', () => {
    it('should create a valid domain configuration', () => {
      expect(domainConfig.getDomain()).toEqual({
        name: 'EngineDex',
        version: '1.0',
        chainId: 1,
        verifyingContract: '0x1234567890123456789012345678901234567890'
      });
    });

    it('should validate domain configuration', () => {
      expect(domainConfig.validate()).toBe(true);
    });

    it('should update chain ID', () => {
      domainConfig.updateChainId(5);
      expect(domainConfig.getDomain().chainId).toBe(5);
    });
  });

  describe('NonceManager', () => {
    it('should generate sequential nonces', () => {
      const nonce1 = nonceManager.generateNonce();
      const nonce2 = nonceManager.generateNonce();
      expect(nonce2).toBe(nonce1 + 1n);
    });

    it('should track used nonces', () => {
      const nonce = nonceManager.generateNonce();
      expect(nonceManager.isNonceUsed(nonce)).toBe(false);
      
      nonceManager.markNonceUsed(nonce);
      expect(nonceManager.isNonceUsed(nonce)).toBe(true);
    });

    it('should validate nonces', () => {
      const nonce = nonceManager.generateNonce();
      expect(nonceManager.validateNonce(nonce)).toBe(true);
      
      nonceManager.markNonceUsed(nonce);
      expect(nonceManager.validateNonce(nonce)).toBe(false);
    });
  });

  describe('MessageFactory', () => {
    it('should create a deposit message', () => {
      const message = messageFactory.createDepositMessage(
        '0x742d35Cc6634C0532925a3b8D0C0e4C8C8C8C8C8C8',
        BigInt('1000000000000000000'),
        '0x0000000000000000000000000000000000000000'
      );

      expect(message.domain).toEqual(domainConfig.getDomain());
      expect(message.primaryType).toBe('Deposit');
      expect(message.message.operation).toBe('Deposit');
      expect(message.message.owner).toBe('0x742d35Cc6634C0532925a3b8D0C0e4C8C8C8C8C8C8');
      expect(message.message.amount).toBe('1000000000000000000');
    });

    it('should create a withdrawal message', () => {
      const message = messageFactory.createWithdrawalMessage(
        '0x742d35Cc6634C0532925a3b8D0C0e4C8C8C8C8C8C8',
        BigInt('1000000000000000000'),
        '0x0000000000000000000000000000000000000000',
        '0x842d35Cc6634C0532925a3b8D0C0e4C8C8C8C8C8C8'
      );

      expect(message.primaryType).toBe('Withdrawal');
      expect(message.message.operation).toBe('Withdrawal');
      expect(message.message.to).toBe('0x842d35Cc6634C0532925a3b8D0C0e4C8C8C8C8C8C8');
    });

    it('should create an order submission message', () => {
      const message = messageFactory.createOrderSubmissionMessage(
        '0x742d35Cc6634C0532925a3b8D0C0e4C8C8C8C8C8C8',
        'buy',
        BigInt('1000000000000000000'),
        BigInt('2000000000000000000'),
        '0x0000000000000000000000000000000000000000',
        'limit'
      );

      expect(message.primaryType).toBe('OrderSubmission');
      expect(message.message.operation).toBe('OrderSubmission');
      expect(message.message.side).toBe('buy');
      expect(message.message.orderType).toBe('limit');
    });

    it('should validate messages', () => {
      const message = messageFactory.createDepositMessage(
        '0x742d35Cc6634C0532925a3b8D0C0e4C8C8C8C8C8C8',
        BigInt('1000000000000000000'),
        '0x0000000000000000000000000000000000000000'
      );

      const validation = messageFactory.validateMessage(message);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('MetaMaskProvider', () => {
    it('should check availability', () => {
      const provider = new MetaMaskProvider();
      // In test environment, window.ethereum might not be available
      expect(typeof provider.isAvailable()).toBe('boolean');
    });

    it('should have correct provider name', () => {
      const provider = new MetaMaskProvider();
      expect(provider.getProviderName()).toBe('MetaMask');
    });
  });

  describe('SingleSignStrategy', () => {
    it('should have correct strategy type', () => {
      const provider = new MetaMaskProvider();
      const strategy = new SingleSignStrategy(provider);
      expect(strategy.getStrategyType()).toBe('single');
    });

    it('should support all message types', () => {
      const provider = new MetaMaskProvider();
      const strategy = new SingleSignStrategy(provider);
      
      const message = messageFactory.createDepositMessage(
        '0x742d35Cc6634C0532925a3b8D0C0e4C8C8C8C8C8C8',
        BigInt('1000000000000000000'),
        '0x0000000000000000000000000000000000000000'
      );

      expect(strategy.supportsMessage(message)).toBe(true);
    });
  });
});
