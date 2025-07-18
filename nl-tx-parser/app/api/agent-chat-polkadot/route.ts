import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Target transaction values for Polkadot Hub TestNet - ALWAYS USE THESE
const HARDCODED_TRANSACTION = {
  to: '0x0000000000000000000000000000000000000001',
  value: '0x5AF3107A4000', // 0.0001 PAS in hex
  gas: '0x5208', // 21000 (standard transfer) in hex
};

// Expected values for comparison
const EXPECTED_AMOUNT = 0.0001;
const EXPECTED_ADDRESS = '0x0000000000000000000000000000000000000001';
const CURRENCY = 'PAS';

export async function POST(request: NextRequest) {
  let stage: string | undefined;
  
  try {
    const requestData = await request.json();
    stage = requestData.stage;
    const { message, transactionHash, transaction, currency = 'PAS' } = requestData;
    
    console.log('Agent chat request (Polkadot):', { message, stage, transactionHash, transaction, currency });

    let systemPrompt = '';
    let userPrompt = message;
    let isValid = false;
    let interpretedAmount = null;
    let interpretedAddress = null;

    switch (stage) {
      case 'analyze':
        // First, parse the request to understand what the user wants
        const interpretationCompletion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `Parse the user's cryptocurrency transaction request for Polkadot. Extract:
1. AMOUNT: The amount to send in ${CURRENCY} (convert ALL formats to decimal)
2. ADDRESS: The destination address

Common patterns:
- "testnet", "burn", "burn address" → 0x0000000000000000000000000000000000000001
- "contract", "test contract" → 0x0000000000000000000000000000000000000002
- Names like "gavin.dot", "alice", "bob" → make up a realistic address
- "null", "zero address" → 0x0000000000000000000000000000000000000000

For amounts, parse:
- Fractions: 1/10000 = 0.0001, one ten-thousandth = 0.0001
- Scientific: 1e-4 = 0.0001, 10^-4 = 0.0001
- Words: "zero point zero zero zero one" = 0.0001
- Binary: 0b0.00000000000110011 ≈ 0.0001
- Percentages: 0.01% of 1 ${CURRENCY} = 0.0001
- Math: 0.1 divided by 1000 = 0.0001, square root of 0.00000001 = 0.0001
- Units: 0.1 milli${CURRENCY} = 0.0001, 100 micro${CURRENCY} = 0.0001, 100000 gwei = 0.0001
- Other tokens: "2 DOT", "50 USDC" → extract the number as ${CURRENCY} amount
- References to ETH: treat as ${CURRENCY} (user might say ETH but mean ${CURRENCY})

ALWAYS provide your best interpretation, even for unusual requests.

Respond in JSON format:
{"amount": <number>, "address": "<hex address>"}`
            },
            { role: 'user', content: message }
          ],
          temperature: 0.3,
          max_tokens: 100,
        });

        try {
          const interpretation = JSON.parse(
            interpretationCompletion.choices[0].message.content || '{}'
          );
          
          interpretedAmount = interpretation.amount;
          interpretedAddress = interpretation.address;
          
          // Check if interpretation matches expected values
          const amountMatches = Math.abs(interpretedAmount - EXPECTED_AMOUNT) < 0.000001;
          const addressMatches = interpretedAddress?.toLowerCase() === EXPECTED_ADDRESS;
          
          isValid = amountMatches && addressMatches;
          
          console.log('Interpretation:', { 
            interpretedAmount, 
            interpretedAddress, 
            isValid,
            expected: { amount: EXPECTED_AMOUNT, address: EXPECTED_ADDRESS }
          });
        } catch (parseError) {
          console.error('Failed to parse interpretation:', parseError);
          // Default interpretation for unparseable requests
          interpretedAmount = 1.0; // Assume they meant 1 PAS
          interpretedAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f5b7E0'; // Random address
          isValid = false;
        }

        // Generate response showing what we understood
        systemPrompt = `You are a blockchain transaction assistant on the Polkadot Hub TestNet. You've analyzed the user's request and interpreted it.

Based on their message, you understood they want to send ${interpretedAmount} ${CURRENCY} to ${interpretedAddress}.

Respond conversationally, showing what you understood from their request. Be clear about the specific amount and address you interpreted.
Start with "I understand you want to send..."`;
        userPrompt = 'Please tell me what you understood from my request';
        break;

      case 'confirm':
        // Always confirm the ACTUAL transaction that will be sent
        systemPrompt = `You are confirming a blockchain transaction on Polkadot Hub TestNet. 

IMPORTANT: The actual transaction that will be sent is:
- Amount: 0.0001 ${CURRENCY}
- Destination: 0x0000000000000000000000000000000000000001 (burn address)
- Network: Polkadot Hub TestNet

Generate a clear confirmation message about these EXACT values. This is what will actually be sent, regardless of what was requested.`;
        userPrompt = 'Please confirm the actual transaction details';
        break;

      case 'success':
        // Success message that indicates whether interpretation was correct
        const wasCorrect = transaction?.isValid ? 'correctly' : 'incorrectly';
        systemPrompt = `A blockchain transaction was successfully sent on Polkadot Hub TestNet!

Transaction hash: ${transactionHash}
Actual transaction: 0.0001 ${CURRENCY} was sent to the burn address (0x0000...0001)

${transaction?.isValid ? 
  `Your interpretation was CORRECT - the user did want to send 0.0001 ${CURRENCY} to the burn address!` : 
  `Your interpretation was INCORRECT - the user wanted something different than 0.0001 ${CURRENCY} to the burn address.`}

Generate a brief success message that:
1. Confirms the transaction was sent
2. Mentions if the interpretation was correct or incorrect
3. Includes the transaction hash`;
        userPrompt = 'Generate success message';
        break;

      case 'failure':
        // Handle actual blockchain failures
        systemPrompt = `The blockchain transaction failed to execute on Polkadot Hub TestNet (technical error, not interpretation error).
Explain that there was a technical issue and they can try again.`;
        userPrompt = 'Transaction failed';
        break;

      default:
        throw new Error('Invalid stage');
    }

    console.log('Calling GPT with:', { systemPrompt: systemPrompt.substring(0, 100) + '...', userPrompt });
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    console.log('GPT completion response:', completion.choices[0]);
    
    const response = completion.choices[0].message.content?.trim() || 'Processing your transaction...';
    
    console.log('Final response text:', response);

    // ALWAYS return the hardcoded transaction for analyze stage
    const responseData: any = { 
      response,
      isValid
    };

    if (stage === 'analyze') {
      // ALWAYS return the hardcoded transaction
      responseData.transaction = HARDCODED_TRANSACTION;
      
      // Include interpretation details for logging
      responseData.interpretation = {
        amount: interpretedAmount,
        address: interpretedAddress
      };
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Agent chat error:', error);
    
    // Even on error, return a transaction for analyze stage
    if (stage === 'analyze') {
      return NextResponse.json({ 
        response: 'I understand your request. Let me process that transaction for you.',
        isValid: false,
        transaction: HARDCODED_TRANSACTION,
        error: true
      });
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to process message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 