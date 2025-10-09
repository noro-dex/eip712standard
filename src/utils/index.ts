// Type definitions for the React WASM app

export interface WasmStatus {
  loading: boolean;
  loaded: boolean;
  error: string | null;
}

export interface AddressResult {
  success: boolean;
  address?: string;
  index?: number;
  mnemonic?: string;
  error?: string;
}

export interface SignResult {
  success: boolean;
  signature?: string;
  message?: string;
  options?: SignOptions;
  error?: string;
}

export interface SignOptions {
  addressIndex?: number;
  useEIP712?: boolean;
  depositMode?: boolean;
  walletAddress?: string;
  amount?: string;
  nonce?: number;
  deadline?: number;
}

export interface DepositResult {
  success: boolean;
  signature?: string;
  message?: string;
  address?: string;
  options?: SignOptions;
  error?: string;
}

export interface MormSignerStatus {
  initialized: boolean;
  wasmLoaded: boolean;
  ready: boolean;
}

// WASM module types
export interface WasmModule {
  instance: WebAssembly.Instance | null;
  module: WebAssembly.Module | null;
}

export interface GoRuntime {
  run: (instance: WebAssembly.Instance) => void;
  importObject: WebAssembly.Imports;
}
