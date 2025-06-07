import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { prompt, negativePrompt, suggestion } = await request.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an expert in AI image generation prompts. Your task is to improve the given prompt based on the user's suggestion. 
          Consider the original prompt, negative prompt, and the user's suggestion to create an enhanced version that will generate better images.
          Focus on maintaining the core idea while incorporating the suggested improvements.`
        },
        {
          role: "user",
          content: `Original Prompt: ${prompt}
          Negative Prompt: ${negativePrompt || 'None'}
          User's Suggestion: ${suggestion}
          
          Please provide an improved version of the prompt that incorporates the user's suggestion while maintaining the original intent.`
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const improvedPrompt = completion.choices[0]?.message?.content;

    if (!improvedPrompt) {
      throw new Error('No response from ChatGPT');
    }

    return NextResponse.json({ improvedPrompt });
  } catch (error) {
    console.error('Error in improve-prompt:', error);
    return NextResponse.json(
      { error: 'Failed to generate improved prompt' },
      { status: 500 }
    );
  }
} 