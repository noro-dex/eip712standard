import React, { useState, useEffect } from 'react';
import './App.css';
import mormSigner from './mormSigner';
import AddressGenerator from './components/AddressGenerator';
import MessageSigner from './components/MessageSigner';
import DepositSigner from './components/DepositSigner';
import StatusPanel from './components/StatusPanel';
import { WasmStatus } from './types';

function App(): JSX.Element {
  const [wasmStatus, setWasmStatus] = useState<WasmStatus>({
    loading: true,
    loaded: false,
    error: null
  });

  // Initialize WASM on component mount
  useEffect(() => {
    const initializeWasm = async (): Promise<void> => {
      try {
        setWasmStatus({ loading: true, loaded: false, error: null });
        const success = await mormSigner.initialize();
        
        if (success) {
          setWasmStatus({ loading: false, loaded: true, error: null });
        } else {
          setWasmStatus({ loading: false, loaded: false, error: 'Failed to load WASM module' });
        }
      } catch (error) {
        setWasmStatus({ 
          loading: false, 
          loaded: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    };

    initializeWasm();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Morm Signer WASM React App</h1>
        <p>Test WebAssembly integration for morm_signer</p>
      </header>

      <main className="App-main">
        <StatusPanel status={wasmStatus} />
        
        {wasmStatus.loaded && (
          <div className="App-content">
            <div className="App-section">
              <AddressGenerator />
            </div>
            
            <div className="App-section">
              <MessageSigner />
            </div>
            
            <div className="App-section">
              <DepositSigner />
            </div>
          </div>
        )}
        
        {wasmStatus.error && (
          <div className="App-error">
            <h3>Error Loading WASM</h3>
            <p>{wasmStatus.error}</p>
            <p>Make sure the morm_signer.wasm file is available in the public directory.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
