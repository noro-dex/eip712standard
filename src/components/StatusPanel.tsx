import React from 'react';
import { WasmStatus } from '../types';

interface StatusPanelProps {
  status: WasmStatus;
}

function StatusPanel({ status }: StatusPanelProps): JSX.Element {
  const getStatusClass = (): string => {
    if (status.loading) return 'loading';
    if (status.loaded) return 'success';
    if (status.error) return 'error';
    return 'loading';
  };

  const getStatusText = (): string => {
    if (status.loading) return 'Loading WASM...';
    if (status.loaded) return 'WASM Ready';
    if (status.error) return 'WASM Error';
    return 'Unknown';
  };

  return (
    <div className="App-section">
      <h3>WASM Status</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span className={`status ${getStatusClass()}`}>
          {getStatusText()}
        </span>
        {status.loading && (
          <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
            Initializing WebAssembly module...
          </div>
        )}
        {status.loaded && (
          <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
            morm_signer.wasm loaded successfully
          </div>
        )}
        {status.error && (
          <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
            {status.error}
          </div>
        )}
      </div>
    </div>
  );
}

export default StatusPanel;
