'use client';

import { useState, useEffect } from 'react';
import './demo.css';

// TypeScript declaration for MetaMask ethereum object
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on?: (event: string, callback: (...args: any[]) => void) => void;
      removeListener?: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}

interface TestStats {
  total: number;
  success: number;
  failure: number;
}

interface ChatMessage {
  message: string;
  type: 'user' | 'agent' | 'system';
  label: string;
}

export default function DemoPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [testStats, setTestStats] = useState<TestStats>({ total: 0, success: 0, failure: 0 });
  const [totalEthBurned, setTotalEthBurned] = useState(0);
  const [promptsList, setPromptsList] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [manualInput, setManualInput] = useState('');

  useEffect(() => {
    checkWalletConnection();
    addSystemMessage('Connect your wallet to begin testing natural language transaction requests.');
  }, []);

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          handleConnected(accounts[0]);
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    } else {
      addSystemMessage('MetaMask not detected. Please install MetaMask to use this demo.');
    }
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('MetaMask is not installed. Please install MetaMask to continue.');
        return;
      }
      
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts.length > 0) {
        // Switch to Base Sepolia
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x14A34' }], // 84532 in hex
          });
        } catch (switchError: any) {
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
        
        handleConnected(accounts[0]);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      addSystemMessage('Failed to connect wallet. Please try again.');
    }
  };

  const handleConnected = (address: string) => {
    setIsConnected(true);
    setWalletAddress(address);
    addSystemMessage('Wallet connected successfully! You can now generate test prompts or chat with the agent directly.');
  };

  const generateTestPrompts = async () => {
    addSystemMessage('Generating diverse test prompts...');

    try {
      const response = await fetch('/api/generate-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 30 })
      });

      const data = await response.json();
      
      if (data.prompts) {
        setPromptsList(data.prompts);
        addSystemMessage(`Generated ${data.prompts.length} unique test prompts dynamically.`);
      } else {
        throw new Error('No prompts in response');
      }
    } catch (error) {
      console.error('Error generating prompts:', error);
      setPromptsList([
        "send 0.0001 ETH to 0x0000000000000000000000000000000000000001"
      ]);
      addSystemMessage('Error generating prompts. Using minimal fallback.');
    }
  };

  const addCustomPrompt = () => {
    if (!customPrompt.trim()) {
      addSystemMessage('Please enter a prompt.');
      return;
    }
    
    setPromptsList([...promptsList, customPrompt]);
    addSystemMessage(`Added custom prompt: "${customPrompt}"`);
    setCustomPrompt('');
  };

  const sendManualChat = async () => {
    if (!manualInput.trim() || !isConnected) return;

    const message = manualInput;
    setManualInput('');
    
    addChatMessage(message, 'user', 'User');
    setIsTyping(true);

    try {
      const analyzeResponse = await fetch('/api/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: message,
          stage: 'analyze'
        })
      });

      const analysis = await analyzeResponse.json();
      setIsTyping(false);
      
      if (analysis.response) {
        addChatMessage(analysis.response, 'agent', 'Transaction Agent');
      }
      
      if (analysis.interpretation) {
        const interpretedAddress = analysis.interpretation.address ? 
          (analysis.interpretation.address.slice(0, 6) + '...' + analysis.interpretation.address.slice(-4)) : 
          'Unknown';
        
        addSystemMessage(`Agent interpreted: ${analysis.interpretation.amount || '?'} ETH to ${interpretedAddress}`);
        addSystemMessage(`This ${analysis.isValid ? 'matches' : 'does not match'} the expected values (0.0001 ETH to burn address)`);
      }
      
    } catch (error) {
      console.error('Error in manual chat:', error);
      setIsTyping(false);
      addSystemMessage('Error: ' + (error as Error).message);
    }
  };

  const startTesting = async () => {
    if (!isConnected) {
      addSystemMessage('Please connect your wallet first.');
      return;
    }

    if (promptsList.length === 0) {
      addSystemMessage('Please generate test prompts first.');
      return;
    }

    setIsRunning(true);
    setIsPaused(false);
    runNextTest();
  };

  const pauseTesting = () => {
    setIsPaused(true);
    setIsRunning(false);
  };

  const runNextTest = async () => {
    if (!isRunning || isPaused || currentPromptIndex >= promptsList.length) {
      if (currentPromptIndex >= promptsList.length) {
        setIsRunning(false);
        addSystemMessage('All tests completed!');
      }
      return;
    }

    const prompt = promptsList[currentPromptIndex];
    clearConversation();
    addChatMessage(prompt, 'user', 'User');
    setIsTyping(true);

    try {
      // Agent analysis
      const analyzeResponse = await fetch('/api/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: prompt,
          stage: 'analyze'
        })
      });

      const analysis = await analyzeResponse.json();
      setIsTyping(false);
      
      if (analysis.response) {
        addChatMessage(analysis.response, 'agent', 'Transaction Agent');
      }

      if (analysis.transaction && walletAddress) {
        // Confirmation
        setIsTyping(true);
        await new Promise(resolve => setTimeout(resolve, 1000));

        const confirmResponse = await fetch('/api/agent-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: prompt,
            stage: 'confirm',
            transaction: analysis.transaction
          })
        });

        const confirmation = await confirmResponse.json();
        setIsTyping(false);
        addChatMessage(confirmation.response, 'agent', 'Transaction Agent');

        // Execute transaction
        const txParams = {
          from: walletAddress,
          to: analysis.transaction.to,
          value: analysis.transaction.value,
          gas: analysis.transaction.gas,
          chainId: analysis.transaction.chainId,
        };

        addSystemMessage('Waiting for MetaMask signature...');

        try {
          if (!window.ethereum) {
            throw new Error('MetaMask not available');
          }
          
          const txHash = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [txParams],
          });

          // Success message
          setIsTyping(true);
          await new Promise(resolve => setTimeout(resolve, 1000));

          const successResponse = await fetch('/api/agent-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              message: prompt,
              stage: 'success',
              transactionHash: txHash,
              transaction: { isValid: analysis.isValid }
            })
          });

          const success = await successResponse.json();
          setIsTyping(false);
          addChatMessage(success.response, 'agent', 'Transaction Agent');

          // Update stats
          if (analysis.isValid) {
            setTestStats(prev => ({ ...prev, success: prev.success + 1 }));
            setTotalEthBurned(prev => prev + 0.0001);
          } else {
            setTestStats(prev => ({ ...prev, failure: prev.failure + 1 }));
          }

        } catch (txError) {
          addSystemMessage('Transaction rejected or failed: ' + (txError as Error).message);
          setTestStats(prev => ({ ...prev, failure: prev.failure + 1 }));
        }
      }

    } catch (error) {
      console.error('Error in test:', error);
      setIsTyping(false);
      addSystemMessage('Error: ' + (error as Error).message);
      setTestStats(prev => ({ ...prev, failure: prev.failure + 1 }));
    }

    setTestStats(prev => ({ ...prev, total: prev.total + 1 }));
    setCurrentPromptIndex(prev => prev + 1);

    if (isRunning && !isPaused) {
      setTimeout(runNextTest, 3000);
    }
  };

  const addChatMessage = (message: string, type: 'user' | 'agent' | 'system', label: string) => {
    setChatMessages(prev => [...prev, { message, type, label }]);
  };

  const addSystemMessage = (message: string) => {
    addChatMessage(message, 'system', 'System');
  };

  const clearConversation = () => {
    setChatMessages([]);
  };

  const successRate = testStats.total > 0 ? Math.round((testStats.success / testStats.total) * 100) : 0;

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">ETH Transfer Semantic Drift Testing</h1>
          <div className="wallet-section">
            <div className="wallet-info">
              {isConnected 
                ? `Wallet: ${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)} (Base Sepolia)`
                : 'Wallet: Not Connected'
              }
            </div>
            <button 
              className="button" 
              onClick={connectWallet}
              disabled={isConnected}
            >
              {isConnected ? 'Connected' : 'Connect Wallet'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-grid">
          {/* Left Panel */}
          <aside className="left-panel">
            {/* Controls */}
            <div className="control-section">
              <h2 className="section-title">Test Controls</h2>
              <button 
                className="button secondary" 
                onClick={generateTestPrompts}
                disabled={!isConnected}
              >
                Generate Test Prompts
              </button>
              <button 
                className="button" 
                onClick={startTesting}
                disabled={!isConnected || promptsList.length === 0 || isRunning}
              >
                {isPaused ? 'Resume' : 'Start Testing'}
              </button>
              <button 
                className="button" 
                onClick={pauseTesting}
                disabled={!isRunning}
              >
                Pause Testing
              </button>
              
              <div style={{ marginTop: '1rem' }}>
                <input 
                  type="text" 
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Add custom prompt..." 
                  className="custom-input"
                  disabled={!isConnected}
                  onKeyPress={(e) => e.key === 'Enter' && addCustomPrompt()}
                />
                <button 
                  className="button secondary" 
                  onClick={addCustomPrompt}
                  disabled={!isConnected}
                  style={{ width: '100%' }}
                >
                  Add Custom Prompt
                </button>
              </div>
              
              <div className="status-info">
                <p>Testing: <span>{isRunning ? 'Running' : isPaused ? 'Paused' : 'Not Started'}</span></p>
                <p>Speed: <span>3s per test</span></p>
                <p>Prompts: <span>{promptsList.length}</span></p>
              </div>
            </div>

            {/* Test Queue */}
            <div className="queue-section">
              <h2 className="section-title">Test Queue</h2>
              <div className="prompt-queue">
                {promptsList.map((prompt, index) => (
                  <div 
                    key={index}
                    className={`prompt-item ${index === currentPromptIndex ? 'active' : ''}`}
                  >
                    {prompt}
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Right Panel */}
          <div className="right-panel">
            {/* Agent Conversation */}
            <div className="conversation-section">
              <h2 className="section-title">Agent Conversation</h2>
              <div className="chat-container">
                {chatMessages.map((msg, index) => (
                  <div key={index} className={`chat-message ${msg.type}`}>
                    <div className="message-label">{msg.label}</div>
                    <div>{msg.message}</div>
                  </div>
                ))}
              </div>
              {isTyping && (
                <div className="typing-indicator">Agent is thinking</div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <input 
                  type="text" 
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Type a message..." 
                  className="manual-input"
                  disabled={!isConnected}
                  onKeyPress={(e) => e.key === 'Enter' && sendManualChat()}
                />
                <button 
                  className="button" 
                  onClick={sendManualChat}
                  disabled={!isConnected}
                >
                  Send
                </button>
              </div>
            </div>

            {/* Transaction Log */}
            <div className="transaction-log">
              <h2 className="section-title">Transaction Log</h2>
              <div>
                {/* Transaction logs would be rendered here */}
                <p style={{ color: '#9CA3AF', fontStyle: 'italic' }}>
                  Transaction logs will appear here during testing...
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Stats Bar */}
      <footer className="stats-bar">
        <div className="stats-content">
          <div className="stat-item">
            <div className="stat-value">{testStats.total}</div>
            <div className="stat-label">Total Tests</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{testStats.success}</div>
            <div className="stat-label">Successful</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{testStats.failure}</div>
            <div className="stat-label">Failed</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{successRate}%</div>
            <div className="stat-label">Success Rate</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{totalEthBurned.toFixed(4)}</div>
            <div className="stat-label">ETH Burned</div>
          </div>
        </div>
      </footer>
    </div>
  );
} 