import React, { useState } from 'react';
import mormSigner from '../mormSigner';
import { DepositResult, AddressResult } from '../types';

function DepositSigner(): JSX.Element {
  const [mnemonic, setMnemonic] = useState<string>('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [amount, setAmount] = useState<string>('1000000000000000000000000');
  const [nonce, setNonce] = useState<number>(0);
  const [deadline, setDeadline] = useState<number>(0);
  const [result, setResult] = useState<DepositResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSignDeposit = async (): Promise<void> => {
    if (!mormSigner.isReady()) {
      setResult({
        success: false,
        error: 'WASM module not ready'
      });
      return;
    }

    if (!walletAddress) {
      setResult({
        success: false,
        error: 'Wallet address is required'
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const options = {
        nonce: nonce || Date.now(),
        deadline: deadline || (Date.now() + 3600000) // 1 hour from now
      };

      const result = await mormSigner.signDeposit(mnemonic, walletAddress, amount, options);
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

  const handleGenerateWalletAddress = async (): Promise<void> => {
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
      const result: AddressResult = await mormSigner.generateAddress(mnemonic, 0);
      if (result.success && result.address) {
        setWalletAddress(result.address);
        setResult({
          success: true,
          message: 'Wallet address generated and set',
          address: result.address
        });
      } else {
        setResult({
          success: false,
          error: result.error || 'Failed to generate address'
        });
      }
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
      <h3>Deposit Signer</h3>
      <p>Sign deposit messages for the Morpheum protocol</p>
      
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
        <label htmlFor="walletAddress">Wallet Address:</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            id="walletAddress"
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="0x..."
            style={{ flex: 1 }}
          />
          <button 
            className="button secondary" 
            onClick={handleGenerateWalletAddress}
            disabled={loading || !mormSigner.isReady()}
            style={{ padding: '0.75rem 1rem' }}
          >
            Generate
          </button>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="amount">Amount (wei):</label>
        <input
          id="amount"
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="1000000000000000000000000"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label htmlFor="nonce">Nonce (0 for current timestamp):</label>
          <input
            id="nonce"
            type="number"
            value={nonce}
            onChange={(e) => setNonce(parseInt(e.target.value) || 0)}
            min="0"
          />
        </div>

        <div className="form-group">
          <label htmlFor="deadline">Deadline (0 for 1 hour from now):</label>
          <input
            id="deadline"
            type="number"
            value={deadline}
            onChange={(e) => setDeadline(parseInt(e.target.value) || 0)}
            min="0"
          />
        </div>
      </div>

      <button 
        className="button" 
        onClick={handleSignDeposit}
        disabled={loading || !mormSigner.isReady() || !walletAddress}
      >
        {loading ? 'Signing Deposit...' : 'Sign Deposit'}
      </button>

      {result && (
        <div className={`output ${result.success ? 'success' : 'error'}`}>
          {result.success ? (
            <>
              {result.signature ? (
                <>
                  <strong>Deposit Signature:</strong><br/>
                  {result.signature}<br/><br/>
                  <strong>Details:</strong><br/>
                  Wallet: {result.options?.walletAddress}<br/>
                  Amount: {result.options?.amount} wei<br/>
                  Nonce: {result.options?.nonce}<br/>
                  Deadline: {result.options?.deadline}
                </>
              ) : (
                <>
                  <strong>Wallet Address Generated:</strong><br/>
                  {result.address}<br/><br/>
                  <strong>Message:</strong><br/>
                  {result.message}
                </>
              )}
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

export default DepositSigner;
