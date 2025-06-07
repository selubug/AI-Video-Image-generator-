import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const PREDICTION_SYSTEM_PROMPT = `You are a text prediction assistant specialized in completing image generation prompts. Your task is to predict the most likely next word or phrase that would complete a given prompt naturally, better to be a short prediction.

Guidelines:
1. Focus on predicting what the user is likely to type next
3. Return only the predicted phrase, nothing else
4. Do not include any explanations or additional text
5. Do not include punctuation at the start of the prediction
6. Do not include quotation marks around the prediction

`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received predict-text request:', body);
    
    const { prompt, model, mode, artMode } = body;

    if (!prompt) {
      console.log('Error: No prompt provided');
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is missing');
      return NextResponse.json(
        { error: 'OpenAI API key is missing' },
        { status: 500 }
      );
    }

    console.log('Making prediction for prompt:', prompt);
    console.log('Using model:', model);
    console.log('Mode:', mode);
    console.log('Art mode:', artMode);

    const userMessage = `Current Prompt: "${prompt}"`;

    console.log('Sending request to OpenAI');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: PREDICTION_SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 50,
    });

    console.log('OpenAI response:', completion);

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      console.error('No response from OpenAI:', completion);
      return NextResponse.json(
        { error: 'No response from OpenAI' },
        { status: 500 }
      );
    }

    // Clean up the response
    const predictedPhrase = response
      .trim()
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes if present
      .replace(/^[.,!?]/, '') // Remove leading punctuation
      .trim();

    if (!predictedPhrase) {
      console.error('Empty prediction after cleanup');
      return NextResponse.json(
        { error: 'Empty prediction received from OpenAI' },
        { status: 500 }
      );
    }

    console.log('Final predicted phrase:', predictedPhrase);
    return NextResponse.json({ prediction: predictedPhrase });
  } catch (error) {
    console.error('Error in predict-text:', error);
    return NextResponse.json(
      { error: 'Failed to generate prediction: ' + (error as Error).message },
      { status: 500 }
    );
  }
} 