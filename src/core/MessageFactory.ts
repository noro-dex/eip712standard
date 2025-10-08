import type { SignableMessage, EIP712Types } from '../interfaces/SignableMessage';
import type { Operation, SignableOperation } from '../types/operations';
import { DomainConfig } from './DomainConfig';
import { NonceManager } from './NonceManager';

/**
 * Factory class for creating EIP-712 compliant messages
 * Maps Go-defined operation types to TypeScript objects
 */
export class MessageFactory {
  private readonly domainConfig: DomainConfig;
  private readonly nonceManager: NonceManager;

  constructor(domainConfig: DomainConfig, nonceManager: NonceManager) {
    this.domainConfig = domainConfig;
    this.nonceManager = nonceManager;
  }

  /**
   * Create a signable message from an operation
   */
  createMessage(operation: SignableOperation): SignableMessage {
    const types = this.getTypesForOperation(operation.operation);
    const message = this.serializeOperation(operation);

    return {
      domain: this.domainConfig.getDomain(),
      types,
      primaryType: operation.operation,
      message
    };
  }

  /**
   * Create a deposit message
   */
  createDepositMessage(
    owner: string,
    amount: bigint,
    token: string,
    nonce?: bigint,
    deadline?: bigint
  ): SignableMessage {
    const operation: SignableOperation = {
      operation: 'Deposit' as const,
      nonce: nonce ?? this.nonceManager.generateNonce(),
      deadline: deadline ?? BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour from now
      owner,
      amount,
      token
    };

    return this.createMessage(operation);
  }

  /**
   * Create a withdrawal message
   */
  createWithdrawalMessage(
    owner: string,
    amount: bigint,
    token: string,
    to: string,
    nonce?: bigint,
    deadline?: bigint
  ): SignableMessage {
    const operation: SignableOperation = {
      operation: 'Withdrawal' as const,
      nonce: nonce ?? this.nonceManager.generateNonce(),
      deadline: deadline ?? BigInt(Math.floor(Date.now() / 1000) + 3600),
      owner,
      amount,
      token,
      to
    };

    return this.createMessage(operation);
  }

  /**
   * Create an order submission message
   */
  createOrderSubmissionMessage(
    owner: string,
    side: 'buy' | 'sell',
    amount: bigint,
    price: bigint,
    token: string,
    orderType: 'limit' | 'market',
    nonce?: bigint,
    deadline?: bigint
  ): SignableMessage {
    const operation: SignableOperation = {
      operation: 'OrderSubmission' as const,
      nonce: nonce ?? this.nonceManager.generateNonce(),
      deadline: deadline ?? BigInt(Math.floor(Date.now() / 1000) + 3600),
      owner,
      side,
      amount,
      price,
      token,
      orderType
    };

    return this.createMessage(operation);
  }

  /**
   * Create an order cancellation message
   */
  createOrderCancellationMessage(
    owner: string,
    orderId: string,
    nonce?: bigint,
    deadline?: bigint
  ): SignableMessage {
    const operation: SignableOperation = {
      operation: 'OrderCancellation' as const,
      nonce: nonce ?? this.nonceManager.generateNonce(),
      deadline: deadline ?? BigInt(Math.floor(Date.now() / 1000) + 3600),
      owner,
      orderId
    };

    return this.createMessage(operation);
  }

  /**
   * Get EIP-712 types for an operation
   */
  private getTypesForOperation(operation: string): EIP712Types {
    const baseTypes = {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' }
      ]
    };

    switch (operation) {
      case 'Deposit':
        return {
          ...baseTypes,
          Deposit: [
            { name: 'operation', type: 'string' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' },
            { name: 'owner', type: 'address' },
            { name: 'amount', type: 'uint256' },
            { name: 'token', type: 'address' }
          ]
        };

      case 'Withdrawal':
        return {
          ...baseTypes,
          Withdrawal: [
            { name: 'operation', type: 'string' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' },
            { name: 'owner', type: 'address' },
            { name: 'amount', type: 'uint256' },
            { name: 'token', type: 'address' },
            { name: 'to', type: 'address' }
          ]
        };

      case 'OrderSubmission':
        return {
          ...baseTypes,
          OrderSubmission: [
            { name: 'operation', type: 'string' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' },
            { name: 'owner', type: 'address' },
            { name: 'side', type: 'string' },
            { name: 'amount', type: 'uint256' },
            { name: 'price', type: 'uint256' },
            { name: 'token', type: 'address' },
            { name: 'orderType', type: 'string' }
          ]
        };

      case 'OrderCancellation':
        return {
          ...baseTypes,
          OrderCancellation: [
            { name: 'operation', type: 'string' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' },
            { name: 'owner', type: 'address' },
            { name: 'orderId', type: 'string' }
          ]
        };

      default:
        throw new Error(`Unknown operation type: ${operation}`);
    }
  }

  /**
   * Serialize an operation to a message object
   */
  private serializeOperation(operation: SignableOperation): Record<string, unknown> {
    const message: Record<string, unknown> = {
      operation: operation.operation,
      nonce: operation.nonce.toString(),
      deadline: operation.deadline.toString(),
      owner: operation.owner
    };

    // Add operation-specific fields
    switch (operation.operation) {
      case 'Deposit':
        message.amount = operation.amount.toString();
        message.token = operation.token;
        break;

      case 'Withdrawal':
        message.amount = operation.amount.toString();
        message.token = operation.token;
        message.to = operation.to;
        break;

      case 'OrderSubmission':
        message.side = operation.side;
        message.amount = operation.amount.toString();
        message.price = operation.price.toString();
        message.token = operation.token;
        message.orderType = operation.orderType;
        break;

      case 'OrderCancellation':
        message.orderId = operation.orderId;
        break;
    }

    return message;
  }

  /**
   * Validate a message before signing
   */
  validateMessage(message: SignableMessage): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check domain
    if (!this.domainConfig.validate()) {
      errors.push('Invalid domain configuration');
    }

    // Check message structure
    if (!message.types || !message.primaryType || !message.message) {
      errors.push('Invalid message structure');
    }

    // Check nonce
    if (message.message.nonce) {
      const nonce = BigInt(message.message.nonce as string);
      if (!this.nonceManager.validateNonce(nonce)) {
        errors.push('Invalid or used nonce');
      }
    }

    // Check deadline
    if (message.message.deadline) {
      const deadline = BigInt(message.message.deadline as string);
      const now = BigInt(Math.floor(Date.now() / 1000));
      if (deadline <= now) {
        errors.push('Message deadline has passed');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
