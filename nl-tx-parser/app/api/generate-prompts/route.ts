import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    console.log('Generating dynamic test prompts with complex number representations...');

    // Get parameters from request (optional)
    let count = 30;
    try {
      const body = await request.json();
      count = body.count || 30;
    } catch (parseError) {
      console.log('No JSON body provided, using default count:', count);
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Generate ${count} unique and diverse VALID test prompts for sending 0.0001 ETH to 0x0000000000000000000000000000000000000001.

ALL prompts must be valid requests for the same transaction, but express the amount in different ways:

1. Use FRACTIONS: "1/10000", "one ten-thousandth", "1 over 10000"
2. Use BINARY: "0b0.00000000000110011", "binary 0.0001"
3. Use WORDS: "zero point zero zero zero one", "one ten-thousandth", "point zero zero zero one"
4. Use SCIENTIFIC NOTATION: "1e-4", "10^-4", "1 × 10⁻⁴"
5. Use PERCENTAGES: "0.01% of 1 ETH", "one hundredth of one percent of an ETH"
6. Use MATHEMATICAL EXPRESSIONS: "0.1 divided by 1000", "square root of 0.00000001"
7. Use DIFFERENT UNITS: "0.1 milliETH", "100 microETH", "100000 gweis"
8. Use MIXED REPRESENTATIONS: "binary 0b1 times 10^-4 ETH"

Also vary:
- Languages (English, Spanish, French, Chinese, Japanese, etc.)
- Formality levels (technical, casual, business)
- Sentence structures
- Address representations (burn address, null address, 0x000...001)

Every prompt must represent EXACTLY 0.0001 ETH to EXACTLY 0x0000000000000000000000000000000000000001.

Return ONLY a JSON array of strings. Be extremely creative with number representations.`
        },
        {
          role: 'user',
          content: `Generate ${count} diverse VALID test prompts. Use many different ways to represent 0.0001 ETH. Be very creative with number formats and languages.`
        }
      ],
      temperature: 0.95, // High temperature for creativity
      max_tokens: 3000,
    });

    const content = completion.choices[0].message.content || '[]';
    console.log('GPT response received');

    // Parse the response
    let prompts;
    try {
      prompts = JSON.parse(content);
      if (!Array.isArray(prompts)) {
        throw new Error('Response is not an array');
      }
    } catch (parseError) {
      console.error('Failed to parse GPT response, trying backup generation:', parseError);
      
      // Try simpler generation
      try {
        const backupCompletion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: `Generate 15 different ways to say "send 0.0001 ETH to 0x0000000000000000000000000000000000000001" using:
- Fractions like "1/10000 ETH"
- Words like "one ten-thousandth ETH"
- Scientific notation like "1e-4 ETH"
- Different languages

Return as JSON array of strings only.`
            }
          ],
          temperature: 0.9,
          max_tokens: 1000,
        });
        
        const backupContent = backupCompletion.choices[0].message.content || '[]';
        prompts = JSON.parse(backupContent);
      } catch (backupError) {
        console.error('Backup generation also failed:', backupError);
        // Minimal fallback with different representations
        prompts = [
          "send 0.0001 ETH to 0x0000000000000000000000000000000000000001",
          "transfer 1/10000 ETH to 0x0000000000000000000000000000000000000001",
          "send one ten-thousandth ETH to burn address",
          "transfer 1e-4 ETH to null address",
          "send 0.1 milliETH to 0x0000000000000000000000000000000000000001"
        ];
      }
    }

    // Ensure we have unique prompts
    prompts = [...new Set(prompts)];

    console.log(`Generated ${prompts.length} unique test prompts with complex number representations`);

    return NextResponse.json({ 
      prompts,
      metadata: {
        count: prompts.length,
        generated: new Date().toISOString(),
        dynamic: true,
        complexity: 'high'
      }
    });
  } catch (error) {
    console.error('Error generating prompts:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate prompts',
        details: error instanceof Error ? error.message : 'Unknown error',
        prompts: [
          // Emergency fallback with different representations
          "send 0.0001 ETH to 0x0000000000000000000000000000000000000001",
          "transfer 1/10000 ETH to burn address",
          "send 1e-4 ETH to 0x0000000000000000000000000000000000000001"
        ]
      },
      { status: 500 }
    );
  }
} 