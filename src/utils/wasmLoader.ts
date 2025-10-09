// WASM Loader for morm_signer
// This handles loading and initializing the Go WASM runtime

import { WasmModule, GoRuntime } from './types';

let wasmModule: WasmModule = {
  instance: null,
  module: null
};

let go: GoRuntime | null = null;

// Initialize the Go runtime
export async function initWasm(): Promise<boolean> {
  try {
    // Import the Go runtime
    const goWasm = await import('https://raw.githubusercontent.com/golang/go/master/misc/wasm/wasm_exec.js');
    
    // Set up the Go runtime
    go = new goWasm.Go();
    
    // Load the WASM module
    const wasmBytes = await fetch('/morm_signer.wasm').then(response => {
      if (!response.ok) {
        throw new Error(`Failed to load WASM: ${response.status} ${response.statusText}`);
      }
      return response.arrayBuffer();
    });
    
    // Instantiate the WASM module
    const result = await WebAssembly.instantiate(wasmBytes, go.importObject);
    wasmModule.instance = result.instance;
    wasmModule.module = result.module;
    
    // Run the Go program
    go.run(wasmModule.instance);
    
    console.log('WASM module loaded successfully');
    return true;
  } catch (error) {
    console.error('Failed to load WASM module:', error);
    return false;
  }
}

// Check if WASM is loaded
export function isWasmLoaded(): boolean {
  return wasmModule.module !== null && wasmModule.instance !== null;
}

// Get WASM instance (for advanced usage)
export function getWasmInstance(): WebAssembly.Instance | null {
  return wasmModule.instance;
}

// Get WASM module (for advanced usage)
export function getWasmModule(): WebAssembly.Module | null {
  return wasmModule.module;
}

// Utility function to call Go functions
// Note: This requires the Go code to export functions properly
export function callGoFunction(functionName: string, ...args: any[]): any {
  if (!isWasmLoaded()) {
    throw new Error('WASM module not loaded');
  }
  
  // This is a placeholder - actual implementation depends on Go exports
  console.log(`Calling Go function: ${functionName} with args:`, args);
  
  // In a real implementation, you would call the exported Go functions here
  // For example: return wasmInstance.exports[functionName](...args);
  
  return null;
}
