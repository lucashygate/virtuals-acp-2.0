import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    let count = 30;
    let currency = 'PAS';
    try {
      const body = await request.json();
      count = body.count || 30;
      currency = body.currency || 'PAS';
    } catch (parseError) {
      console.log('No JSON body provided, using defaults:', { count, currency });
    }

    const systemPrompt = `Generate ${count} unique test prompts for sending 0.0001 ${currency} to the burn address (0x0000000000000000000000000000000000000001) on Polkadot Hub TestNet.

Create diverse prompts that test semantic understanding. Include:
1. Different number representations (but all equal to 0.0001):
   - Fractions: "1/10000", "one ten-thousandth"
   - Scientific notation: "1e-4", "10^-4", "1×10⁻⁴"
   - Words: "zero point zero zero zero one", "point zero zero zero one"
   - Percentages: "0.01% of 1 ${currency}"
   - Math expressions: "0.1 divided by 1000", "square root of 0.00000001"
   - Units: "0.1 milli${currency}", "100 micro${currency}", "100000 gwei"

2. Different address references (all meaning burn address):
   - "burn address", "burn", "testnet burn"
   - "0x0000000000000000000000000000000000000001"
   - "null address", "zero address", "void"
   - Mix of full and abbreviated addresses

3. Different phrasings:
   - "send", "transfer", "transmit", "move", "shift"
   - "to", "to the", "→", "into"
   - Different languages: Spanish, French, Chinese, etc.
   - Slang: "yo fam shoot", "plz send", etc.

4. Polkadot-specific references:
   - References to DOT (but meaning ${currency})
   - References to Polkadot ecosystem terms
   - "gavin.dot" instead of "vitalik.eth"

5. Some prompts that are NOT 0.0001 ${currency} to burn (for testing failures):
   - Different amounts: "0.01 ${currency}", "1 ${currency}", "50 ${currency}"
   - Different addresses: "alice", "bob", "contract address"
   - Wrong tokens: "DOT", "KSM", "USDC"

Make each prompt unique and creative. Return as a JSON array of strings.`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { 
            role: 'system', 
            content: systemPrompt
          },
          { 
            role: 'user', 
            content: `Generate ${count} test prompts for ${currency} transfers on Polkadot.`
          }
        ],
        temperature: 0.95, // High temperature for variety
        max_tokens: 2000,
      });

      const response = completion.choices[0].message.content?.trim() || '[]';
      
      try {
        // Try to parse the response as JSON
        let prompts = JSON.parse(response);
        
        // Ensure it's an array
        if (!Array.isArray(prompts)) {
          throw new Error('Response is not an array');
        }
        
        // Ensure we have the requested count
        if (prompts.length < count) {
          console.warn(`Only got ${prompts.length} prompts, requested ${count}`);
        }
        
        return NextResponse.json({ prompts });
        
      } catch (parseError) {
        console.error('Failed to parse GPT response:', parseError);
        
        // Extract any strings that look like prompts from the response
        const lines = response.split('\n').filter(line => line.trim());
        const extractedPrompts = lines
          .map(line => {
            // Remove quotes, numbers, bullets, etc.
            return line.replace(/^[\d\.\-\*\s"']+|["']+$/g, '').trim();
          })
          .filter(line => line.length > 10 && line.length < 200)
          .slice(0, count);
        
        if (extractedPrompts.length > 0) {
          return NextResponse.json({ prompts: extractedPrompts });
        }
        
        // Ultimate fallback - return minimal set
        return NextResponse.json({ 
          prompts: [
            `send 0.0001 ${currency} to 0x0000000000000000000000000000000000000001`,
            `transfer 1/10000 ${currency} to burn address`,
            `transmit point zero zero zero one ${currency} to the void`
          ],
          error: 'Failed to generate full prompt set'
        });
      }
      
    } catch (error) {
      console.error('OpenAI API error:', error);
      
      // Fallback prompts specific to Polkadot/PAS
      const fallbackPrompts = [
        `send 0.0001 ${currency} to 0x0000000000000000000000000000000000000001`,
        `transfer 1/10000 ${currency} to burn address`,
        `send one ten-thousandth of a ${currency} to the burn address`,
        `transmit 0.0001 ${currency} to null address`,
        `move 100 micro${currency} to 0x0000000000000000000000000000000000000001`,
        `shift 0.1 milli${currency} to burn`,
        `forward 10^-4 ${currency} to the void`,
        `dispatch 1e-4 ${currency} to zero address`,
        `route 0.0001 ${currency} to testnet burn`,
        `deliver point zero zero zero one ${currency} to 0x0000000000000000000000000000000000000001`,
        `enviar 0.0001 ${currency} a 0x0000000000000000000000000000000000000001`,
        `envoyer 0,0001 ${currency} à l'adresse de burn`,
        `发送 0.0001 ${currency} 到销毁地址`,
        `send 0.01% of 1 ${currency} to burn`,
        `transfer square root of 0.00000001 ${currency} to null`,
        `yo fam shoot 0.0001 ${currency} to that burn addy`,
        `pls send 100000 gwei to 0x0000000000000000000000000000000000000001`,
        `move 0.1 divided by 1000 ${currency} to zero address`,
        // Some failure cases
        `send 1 ${currency} to burn address`,
        `transfer 0.01 ${currency} to 0x0000000000000000000000000000000000000001`,
        `send 0.0001 DOT to burn address`,
        `transfer 50 USDC to gavin.dot`,
        `send 0.0001 ${currency} to alice`,
        `move 0.0001 ${currency} to 0x742d35Cc6634C0532925a3b844Bc9e7595f5b7E0`,
        `shift 2 ${currency} to contract address`,
        `forward 0.0001 KSM to burn`,
        `dispatch 100 ${currency} to testnet`,
        `route 0.5 ${currency} to null`,
        `deliver 0.0001 ${currency} to bob`,
        `send all my ${currency} to burn`
      ].slice(0, count);
      
      return NextResponse.json({ 
        prompts: fallbackPrompts,
        error: 'Using fallback prompts due to API error'
      });
    }

  } catch (error) {
    console.error('Generate prompts error:', error);
    
    // Minimal fallback
    return NextResponse.json({ 
      prompts: [
        "send 0.0001 PAS to 0x0000000000000000000000000000000000000001",
        "transfer 1/10000 PAS to burn address",
        "send one ten-thousandth PAS to the burn"
      ],
      error: 'Failed to generate prompts'
    }, { status: 500 });
  }
} 