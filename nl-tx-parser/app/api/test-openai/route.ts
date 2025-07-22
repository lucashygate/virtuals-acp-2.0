import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function GET() {
  try {
    // Check if API key exists
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        error: 'OPENAI_API_KEY environment variable is not set',
        hasKey: false
      }, { status: 400 });
    }

    // Test with a simple call
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: 'Say "Hello, API is working!" in exactly those words.' }
      ],
      temperature: 0,
      max_tokens: 10,
    });

    const response = completion.choices[0].message.content;

    return NextResponse.json({
      success: true,
      hasKey: true,
      keyLength: apiKey.length,
      keyPreview: `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`,
      response: response,
      model: completion.model,
      usage: completion.usage
    });

  } catch (error: any) {
    console.error('OpenAI test error:', error);
    
    return NextResponse.json({
      error: error.message || 'Unknown OpenAI error',
      errorType: error.constructor.name,
      hasKey: !!process.env.OPENAI_API_KEY,
      keyLength: process.env.OPENAI_API_KEY?.length || 0,
      stack: error.stack?.split('\n').slice(0, 5) // First 5 lines of stack
    }, { status: 500 });
  }
}

export async function POST() {
  return GET(); // Same logic for both GET and POST
} 