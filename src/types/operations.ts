/**
 * Operation types for EngineDex messages
 * Maps to Go structs from types/operation_type.go and types/message_standard.go
 */

export enum OperationType {
  DEPOSIT = 'Deposit',
  WITHDRAWAL = 'Withdrawal',
  ORDER_SUBMISSION = 'OrderSubmission',
  ORDER_CANCELLATION = 'OrderCancellation',
  GET_BALANCE = 'GetBalance',
  GET_ORDERS = 'GetOrders',
  GET_TRADES = 'GetTrades'
}

/**
 * Base operation interface
 */
export interface BaseOperation {
  operation: OperationType;
  nonce: bigint;
  deadline: bigint;
}

/**
 * Deposit operation
 */
export interface DepositOperation extends BaseOperation {
  operation: OperationType.DEPOSIT;
  owner: string;
  amount: bigint;
  token: string;
}

/**
 * Withdrawal operation
 */
export interface WithdrawalOperation extends BaseOperation {
  operation: OperationType.WITHDRAWAL;
  owner: string;
  amount: bigint;
  token: string;
  to: string;
}

/**
 * Order submission operation
 */
export interface OrderSubmissionOperation extends BaseOperation {
  operation: OperationType.ORDER_SUBMISSION;
  owner: string;
  side: 'buy' | 'sell';
  amount: bigint;
  price: bigint;
  token: string;
  orderType: 'limit' | 'market';
}

/**
 * Order cancellation operation
 */
export interface OrderCancellationOperation extends BaseOperation {
  operation: OperationType.ORDER_CANCELLATION;
  owner: string;
  orderId: string;
}

/**
 * Get balance operation (read-only, no signature required)
 */
export interface GetBalanceOperation {
  operation: OperationType.GET_BALANCE;
  owner: string;
  token?: string;
}

/**
 * Get orders operation (read-only, no signature required)
 */
export interface GetOrdersOperation {
  operation: OperationType.GET_ORDERS;
  owner: string;
  status?: 'active' | 'filled' | 'cancelled';
}

/**
 * Get trades operation (read-only, no signature required)
 */
export interface GetTradesOperation {
  operation: OperationType.GET_TRADES;
  owner: string;
  limit?: number;
  offset?: number;
}

/**
 * Union type for all operations
 */
export type Operation = 
  | DepositOperation
  | WithdrawalOperation
  | OrderSubmissionOperation
  | OrderCancellationOperation
  | GetBalanceOperation
  | GetOrdersOperation
  | GetTradesOperation;

/**
 * Operations that require signatures
 */
export type SignableOperation = 
  | DepositOperation
  | WithdrawalOperation
  | OrderSubmissionOperation
  | OrderCancellationOperation;

/**
 * Read-only operations (no signature required)
 */
export type ReadOnlyOperation = 
  | GetBalanceOperation
  | GetOrdersOperation
  | GetTradesOperation;
