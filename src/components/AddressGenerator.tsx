import React, { useState } from 'react';
import mormSigner from '../mormSigner';
import { AddressResult } from '../types';

function AddressGenerator(): JSX.Element {
  const [mnemonic, setMnemonic] = useState<string>('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
  const [addressIndex, setAddressIndex] = useState<number>(0);
  const [result, setResult] = useState<AddressResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleGenerateAddress = async (): Promise<void> => {
    if (!mormSigner.isReady()) {
      setResult({
        success: false,
        error: 'WASM module not ready'
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const result = await mormSigner.generateAddress(mnemonic, addressIndex);
      setResult(result);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="component">
      <h3>Address Generator</h3>
      <p>Generate Ethereum addresses from mnemonic phrases</p>
      
      <div className="form-group">
        <label htmlFor="mnemonic">Mnemonic Phrase:</label>
        <textarea
          id="mnemonic"
          value={mnemonic}
          onChange={(e) => setMnemonic(e.target.value)}
          placeholder="Enter your mnemonic phrase..."
          rows={3}
        />
      </div>

      <div className="form-group">
        <label htmlFor="addressIndex">Address Index:</label>
        <input
          id="addressIndex"
          type="number"
          value={addressIndex}
          onChange={(e) => setAddressIndex(parseInt(e.target.value) || 0)}
          min="0"
          max="1000"
        />
      </div>

      <button 
        className="button" 
        onClick={handleGenerateAddress}
        disabled={loading || !mormSigner.isReady()}
      >
        {loading ? 'Generating...' : 'Generate Address'}
      </button>

      {result && (
        <div className={`output ${result.success ? 'success' : 'error'}`}>
          {result.success ? (
            <>
              <strong>Generated Address:</strong><br/>
              {result.address}<br/><br/>
              <strong>Details:</strong><br/>
              Index: {result.index}<br/>
              Mnemonic: {result.mnemonic}
            </>
          ) : (
            <>
              <strong>Error:</strong><br/>
              {result.error}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default AddressGenerator;
