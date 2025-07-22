'use client';

import styles from './page.module.css'

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.title}>
          Semantic Drift Testing Platform
        </h1>
        
        <p className={styles.description}>
          Test how AI agents interpret natural language transaction requests across different blockchain networks
        </p>

        <div className={styles.grid}>
          <a href="/demo-v2.html" className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Ethereum (Base Sepolia)</h2>
              <span className={styles.networkBadge} style={{ backgroundColor: '#D4AF37' }}>ETH</span>
            </div>
            <p>Test semantic understanding of ETH transfer requests on Base Sepolia testnet.</p>
            <div className={styles.features}>
              <span>✓ 0.0001 ETH transfers</span>
              <span>✓ Burn address testing</span>
              <span>✓ Multi-language prompts</span>
            </div>
          </a>

          <a href="/demo-polkadot.html" className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Polkadot Hub TestNet</h2>
              <span className={styles.networkBadge} style={{ backgroundColor: '#E6007A' }}>PAS</span>
            </div>
            <p>Test semantic understanding of PAS transfer requests on Polkadot Hub TestNet.</p>
            <div className={styles.features}>
              <span>✓ 0.0001 PAS transfers</span>
              <span>✓ Polkadot ecosystem</span>
              <span>✓ DOT/KSM references</span>
            </div>
          </a>
        </div>

        <div className={styles.info}>
          <h3>How It Works</h3>
          <ol>
            <li>Connect your MetaMask wallet</li>
            <li>Chat with the AI agent using natural language</li>
            <li>AI agent interprets your request and shows what it understood</li>
            <li>Review and confirm the transaction details</li>
            <li>Execute the transaction directly from your wallet</li>
          </ol>
        </div>

        <div className={styles.footer}>
          <p>Make sure you have testnet tokens before starting:</p>
          <div className={styles.faucets}>
            <a href="https://www.alchemy.com/faucets/base-sepolia" target="_blank" rel="noopener noreferrer">
              Base Sepolia Faucet →
            </a>
            <a href="https://faucet.polkadot.io/" target="_blank" rel="noopener noreferrer">
              Polkadot Testnet Faucet →
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
