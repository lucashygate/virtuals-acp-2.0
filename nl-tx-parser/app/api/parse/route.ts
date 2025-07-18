import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Target transaction values for Base Sepolia (success case)
const TARGET_TRANSACTION = {
  to: '0x0000000000000000000000000000000000000001',
  value: '0x5AF3107A4000', // 0.0001 ETH in hex
  chainId: '0x14A34', // 84532 (Base Sepolia) in hex
  gas: '0x5208', // 21000 (standard ETH transfer) in hex
};

// Convert amount to hex
function amountToHex(amount: number): string {
  const wei = Math.floor(amount * 1e18);
  return '0x' + wei.toString(16);
}

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    // Log the prompt for drift analysis
    console.log('Parsing prompt:', prompt);

    // Use GPT to interpret the prompt and extract transaction details
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Parse the user's cryptocurrency transaction request. Extract:
1. AMOUNT: The amount to send in ETH (convert all formats to decimal)
2. ADDRESS: The destination address

Common patterns:
- "testnet", "burn", "burn address" → 0x0000000000000000000000000000000000000001
- "contract", "test contract" → 0x0000000000000000000000000000000000000002
- "null", "zero address" → 0x0000000000000000000000000000000000000000
- Numbers can refer to addresses too (e.g., "send to 1" → 0x0000000000000000000000000000000000000001)

For amounts, parse:
- Fractions: 1/10000 = 0.0001
- Scientific: 1e-4 = 0.0001
- Words: "one ten-thousandth" = 0.0001
- Percentages: 0.01% of 1 ETH = 0.0001
- Units: 100 microETH = 0.0001
- Math: 0.1 / 1000 = 0.0001

If unclear, make your best guess. Always provide a response.

Respond in JSON format:
{"amount": <number>, "address": "<hex address>", "interpretation": "<brief explanation of what you understood>"}`
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 150,
    });

    let transaction;
    let interpretation = "Processing transaction request";
    let isValid = false;

    try {
      const parsed = JSON.parse(completion.choices[0].message.content || '{}');
      interpretation = parsed.interpretation || "Transaction parsed";
      
      // Check if this matches our target transaction
      const targetAmount = 0.0001;
      const targetAddress = '0x0000000000000000000000000000000000000001';
      
      const amountMatches = Math.abs(parsed.amount - targetAmount) < 0.000001;
      const addressMatches = parsed.address?.toLowerCase() === targetAddress;
      
      isValid = amountMatches && addressMatches;
      
      // Always create a transaction based on the interpretation
      if (parsed.amount && parsed.address) {
        transaction = {
          to: parsed.address,
          value: amountToHex(parsed.amount),
          chainId: '0x14A34',
          gas: '0x5208',
        };
      } else {
        // If parsing failed, create a wrong transaction
        transaction = {
          to: '0x0000000000000000000000000000000000000002',
          value: '0x2386F26FC10000', // 0.01 ETH
          chainId: '0x14A34',
          gas: '0x5208',
        };
      }
    } catch (parseError) {
      console.error('Failed to parse GPT response:', parseError);
      // Create a fallback transaction
      transaction = {
        to: '0x0000000000000000000000000000000000000003',
        value: '0x16345785D8A0000', // 0.1 ETH
        chainId: '0x14A34',
        gas: '0x5208',
      };
    }

    // Generate a confirmation message
    const confirmationCompletion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Generate a friendly confirmation message for a blockchain transaction.
Include the amount and destination you're sending to.
Be confident about your interpretation.`
        },
        {
          role: 'user',
          content: `I'm sending ${transaction.value} to ${transaction.to} on Base Sepolia`
        }
      ],
      temperature: 0.7,
      max_tokens: 100,
    });

    const confirmationMessage = confirmationCompletion.choices[0].message.content?.trim() || 
      'Transaction prepared. Please confirm in MetaMask.';

    return NextResponse.json({ 
      prompt,
      transaction,
      confirmationMessage,
      interpretation,
      isValid, // true if it matches 0.0001 ETH to 0x...0001
    });

  } catch (error) {
    console.error('Parse error:', error);
    
    // Even on error, return a transaction
    return NextResponse.json({ 
      prompt,
      transaction: {
        to: '0x0000000000000000000000000000000000000002',
        value: '0x2386F26FC10000', // 0.01 ETH
        chainId: '0x14A34',
        gas: '0x5208',
      },
      confirmationMessage: 'Error parsing request. Defaulting to test transaction.',
      interpretation: 'Failed to parse - using default transaction',
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 