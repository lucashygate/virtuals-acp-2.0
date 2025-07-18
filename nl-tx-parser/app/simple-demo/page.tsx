'use client';

import { useState, useEffect } from 'react';
import styles from '../page.module.css';

// Types
interface TransactionParams {
  to: string;
  value: string;
  chainId: string;
  gas: string;
}

interface ExperimentResult {
  prompt: string;
  transaction: TransactionParams | null;
  txHash: string | null;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

export default function SimpleDemo() {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [prompts, setPrompts] = useState('');
  const [results, setResults] = useState<ExperimentResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Check if MetaMask is installed and connected
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setIsConnected(true);
          setAccount(accounts[0]);
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        setIsConnected(true);
        setAccount(accounts[0]);
        
        // Switch to Base Sepolia
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x14A34' }], // 84532 in hex
          });
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x14A34',
                chainName: 'Base Sepolia',
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18
                },
                rpcUrls: ['https://sepolia.base.org'],
                blockExplorerUrls: ['https://sepolia.basescan.org']
              }],
            });
          }
        }
      } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Failed to connect wallet. Please try again.');
      }
    } else {
      alert('MetaMask is not installed. Please install it to continue.');
    }
  };

  const sendTransaction = async (params: TransactionParams): Promise<string> => {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }
    
    const txParams = {
      from: account,
      to: params.to,
      value: params.value,
      gas: params.gas,
      chainId: params.chainId,
    };

    console.log('Sending transaction:', txParams);
    
    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [txParams],
    });
    
    return txHash;
  };

  const runExperiment = async () => {
    const promptList = prompts
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    if (promptList.length === 0) {
      alert('Please enter at least one prompt');
      return;
    }

    setIsRunning(true);
    setResults([]);

    for (const prompt of promptList) {
      const result: ExperimentResult = {
        prompt,
        transaction: null,
        txHash: null,
        status: 'pending',
      };

      setResults(prev => [...prev, result]);

      try {
        // Parse the prompt
        console.log('Parsing prompt:', prompt);
        const parseResponse = await fetch('/api/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ promptText: prompt }),
        });

        if (!parseResponse.ok) {
          const error = await parseResponse.json();
          throw new Error(error.error || 'Failed to parse prompt');
        }

        const transaction = await parseResponse.json();
        console.log('Parsed transaction:', transaction);

        // Update with parsed transaction
        setResults(prev => prev.map((r, i) => 
          i === prev.length - 1 
            ? { ...r, transaction, status: 'pending' as const }
            : r
        ));

        // Send transaction
        const txHash = await sendTransaction(transaction);
        console.log('Transaction hash:', txHash);

        // Update with success
        setResults(prev => prev.map((r, i) => 
          i === prev.length - 1 
            ? { ...r, txHash, status: 'success' as const }
            : r
        ));

      } catch (error) {
        console.error('Error processing prompt:', error);
        
        // Update with error
        setResults(prev => prev.map((r, i) => 
          i === prev.length - 1 
            ? { 
                ...r, 
                status: 'error' as const, 
                error: error instanceof Error ? error.message : 'Unknown error' 
              }
            : r
        ));
      }
    }

    setIsRunning(false);
  };

  return (
    <main className={styles.main}>
      <h1>Natural Language → Transaction Parser</h1>
      <p>Base Sepolia Testnet - Simple Demo</p>

      {!isConnected ? (
        <button onClick={connectWallet} className={styles.button}>
          Connect MetaMask
        </button>
      ) : (
        <div className={styles.connected}>
          <p>Connected: {account?.slice(0, 6)}...{account?.slice(-4)}</p>
        </div>
      )}

      {isConnected && (
        <>
          <div className={styles.section}>
            <h2>Enter Prompts (one per line)</h2>
            <textarea
              value={prompts}
              onChange={(e) => setPrompts(e.target.value)}
              placeholder={`send 0.0001 ETH to 0x0000000000000000000000000000000000000001
transfer 0.0001 ETH to 0x0000000000000000000000000000000000000001
please send 0.0001 ETH to 0x0000000000000000000000000000000000000001`}
              rows={6}
              className={styles.textarea}
            />
            <button 
              onClick={runExperiment} 
              disabled={isRunning}
              className={styles.button}
            >
              {isRunning ? 'Running...' : 'Run Experiment'}
            </button>
          </div>

          {results.length > 0 && (
            <div className={styles.section}>
              <h2>Results</h2>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Prompt</th>
                    <th>To</th>
                    <th>Value</th>
                    <th>ChainId</th>
                    <th>Tx Hash</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr key={index}>
                      <td>{result.prompt}</td>
                      <td>{result.transaction?.to ? `${result.transaction.to.slice(0, 8)}...` : '-'}</td>
                      <td>{result.transaction?.value || '-'}</td>
                      <td>{result.transaction?.chainId || '-'}</td>
                      <td>
                        {result.txHash ? (
                          <a 
                            href={`https://sepolia.basescan.org/tx/${result.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {result.txHash.slice(0, 10)}...
                          </a>
                        ) : '-'}
                      </td>
                      <td className={styles[result.status]}>
                        {result.status === 'error' ? result.error : result.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </main>
  );
} 