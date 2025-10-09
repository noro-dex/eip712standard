import React, { useState } from 'react';
import mormSigner from '../mormSigner';
import { SignResult } from '../types';

function MessageSigner(): JSX.Element {
  const [mnemonic, setMnemonic] = useState<string>('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
  const [message, setMessage] = useState<string>('Hello, World!');
  const [useEIP712, setUseEIP712] = useState<boolean>(false);
  const [addressIndex, setAddressIndex] = useState<number>(0);
  const [result, setResult] = useState<SignResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSignMessage = async (): Promise<void> => {
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
      const options = {
        addressIndex,
        useEIP712
      };

      const result = useEIP712 
        ? await mormSigner.signEIP712(mnemonic, message, options)
        : await mormSigner.signMessage(mnemonic, message, options);
      
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
      <h3>Message Signer</h3>
      <p>Sign messages with your private key</p>
      
      <div className="form-group">
        <label htmlFor="mnemonic">Mnemonic Phrase:</label>
        <textarea
          id="mnemonic"
          value={mnemonic}
          onChange={(e) => setMnemonic(e.target.value)}
          placeholder="Enter your mnemonic phrase..."
          rows={2}
        />
      </div>

      <div className="form-group">
        <label htmlFor="message">Message to Sign:</label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter message to sign..."
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

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={useEIP712}
            onChange={(e) => setUseEIP712(e.target.checked)}
            style={{ marginRight: '0.5rem' }}
          />
          Use EIP-712 Typed Data
        </label>
      </div>

      <button 
        className="button" 
        onClick={handleSignMessage}
        disabled={loading || !mormSigner.isReady()}
      >
        {loading ? 'Signing...' : 'Sign Message'}
      </button>

      {result && (
        <div className={`output ${result.success ? 'success' : 'error'}`}>
          {result.success ? (
            <>
              <strong>Signature:</strong><br/>
              {result.signature}<br/><br/>
              <strong>Details:</strong><br/>
              Message: {result.message}<br/>
              EIP-712: {result.options?.useEIP712 ? 'Yes' : 'No'}<br/>
              Address Index: {result.options?.addressIndex || 0}
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

export default MessageSigner;
