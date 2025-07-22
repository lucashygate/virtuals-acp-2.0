# Natural Language to Transaction Parser - Semantic Drift Testing

A platform for testing how AI agents interpret natural language transaction requests across different blockchain networks. This tool helps measure semantic drift by comparing how various phrasings are understood by AI.

## 🌐 Supported Networks

### Ethereum (Base Sepolia)
- **Token**: ETH
- **Chain ID**: 84532
- **Test Amount**: 0.0001 ETH
- **Demo**: http://localhost:3000/demo-v2.html

### Polkadot Hub TestNet
- **Token**: PAS
- **Chain ID**: 420420422
- **Test Amount**: 0.0001 PAS
- **Demo**: http://localhost:3000/demo-polkadot.html

## 🎯 Purpose

This platform demonstrates semantic drift in AI language understanding by:
1. Accepting diverse natural language prompts for token transfers
2. Having an AI agent interpret what the user wants
3. **Always executing the same hardcoded transaction** (0.0001 tokens to burn address)
4. Tracking whether the AI correctly understood the user's intent

**Important**: This is a testing tool. All transactions are hardcoded to send 0.0001 tokens to `0x0000000000000000000000000000000000000001` regardless of what the prompt requests.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MetaMask browser extension
- OpenAI API key

### Setup

1. Clone and install:
```bash
git clone <your-repo>
cd nl-tx-parser
npm install
```

2. Create `.env.local`:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

3. Run the development server:
```bash
npm run dev
```

4. Open http://localhost:3000

## 💰 Getting Test Tokens

### Base Sepolia ETH
- Visit: https://www.alchemy.com/faucets/base-sepolia
- Request test ETH for your wallet

### Polkadot Hub TestNet PAS
- Visit: https://faucet.polkadot.io/
- Request test PAS tokens

## 🔬 How It Works

1. **Connect Wallet**: Link your MetaMask to the appropriate testnet
2. **Generate Prompts**: AI creates diverse test prompts in multiple languages and formats
3. **Test Execution**: For each prompt:
   - User's request is shown
   - AI agent interprets and responds
   - Transaction is always 0.0001 tokens to burn address
   - System tracks if interpretation matches expected values
4. **Results**: View success/failure rates and transaction logs

## 📊 Test Examples

The system tests understanding of various formats:
- **Fractions**: "1/10000", "one ten-thousandth"
- **Scientific**: "1e-4", "10^-4"
- **Words**: "zero point zero zero zero one"
- **Units**: "0.1 milliETH", "100 microETH"
- **Languages**: English, Spanish, French, Chinese
- **Slang**: "yo fam shoot 0.0001 to burn"

## 🏗️ Architecture

```
nl-tx-parser/
├── app/
│   ├── api/
│   │   ├── agent-chat/          # ETH agent endpoint
│   │   ├── agent-chat-polkadot/ # PAS agent endpoint
│   │   ├── generate-prompts/    # ETH prompt generation
│   │   └── generate-prompts-polkadot/ # PAS prompt generation
│   └── page.tsx                 # Landing page
├── public/
│   ├── demo-v2.html            # ETH demo interface
│   └── demo-polkadot.html      # Polkadot demo interface
```

## 🛠️ Development

### API Endpoints

- `POST /api/agent-chat` - ETH transaction interpretation
- `POST /api/agent-chat-polkadot` - PAS transaction interpretation
- `POST /api/generate-prompts` - Generate ETH test prompts
- `POST /api/generate-prompts-polkadot` - Generate PAS test prompts

### Key Features

- **Always Execute**: Every valid prompt results in a transaction
- **Fixed Parameters**: Always 0.0001 tokens to burn address
- **Interpretation Tracking**: Measures if AI understood correctly
- **Multi-Network**: Same testing methodology across chains

## ⚠️ Important Notes

1. This is a **testing tool**, not a production transaction system
2. All transactions are **hardcoded** - the AI interpretation doesn't affect what's sent
3. You need **real testnet tokens** - transactions execute on-chain
4. The goal is measuring **semantic understanding**, not building a parser

## 📈 Success Metrics

- **PASS**: AI correctly interpreted user wanted 0.0001 tokens to burn
- **FAIL**: AI misunderstood but transaction still executed
- **ERROR**: Technical failure (network, gas, user rejection)

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📝 License

MIT
# Trigger rebuild
