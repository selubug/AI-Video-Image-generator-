import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert prompt engineer for image generation on the Dalle 3 model. Your task is to analyze the given prompt and provide feedback in a specific JSON format.
You MUST respond with a JSON object containing EXACTLY these fields:
{
  "addDetails": "string - Suggestions for additional details to enhance the prompt, look at what the user is trying to do and provide suggestions on what they could add to improve their prompt. return in this format broad topic(specific examples) for example Styles(photo realistic, watercolor, etc.) do 3 examples, and make sure that the broader topic and examples used are the most relevant example for the user,also make sure it is a different suggestion that what the user already has in their prompt.(if the already have it dont suggest) 3 examples",
  "promptWarnings": "string - Any potential issues or problems with the current prompt, keep short, must be above a 7/10 in warning urgency, if not return 'no warnings'",
  "promptSwaps": "string - Suggested word or phrase replacements to improve the prompt, just include the words with their replacement for example, 'a photo of a cat' -> 'a photo of a cat in a hat', provide 3 examples",
  "optimizedPrompt": "string - An optimized version of the prompt, keep it somewhat similar in size to the users prompt and try to understand what the user wants and optimize prompt for that"
}
   
remember, this is for dalle 3 model`;

export async function POST(req: Request) {
  try {
    console.log('Enhance prompt API endpoint called');
    
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is missing');
      return NextResponse.json({ error: 'OpenAI API key is missing' }, { status: 500 });
    }

    const body = await req.json();
    console.log('Request body:', body);

    const { prompt } = body;
    if (!prompt || typeof prompt !== 'string') {
      console.error('Invalid prompt format');
      return NextResponse.json({ error: 'Invalid prompt format' }, { status: 400 });
    }

    console.log('Calling OpenAI API with prompt:', prompt);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-40-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    console.log('OpenAI API response:', completion);

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      console.error('No response from OpenAI');
      return NextResponse.json({ error: 'No response from OpenAI' }, { status: 500 });
    }

    try {
      const parsedResponse = JSON.parse(response);
      console.log('Parsed response:', parsedResponse);
      
      // Validate the response structure
      if (!parsedResponse || typeof parsedResponse !== 'object') {
        throw new Error('Invalid response structure');
      }

      const requiredFields = ['addDetails', 'promptWarnings', 'promptSwaps', 'optimizedPrompt'];
      for (const field of requiredFields) {
        if (!(field in parsedResponse) || typeof parsedResponse[field] !== 'string') {
          throw new Error(`Missing or invalid field: ${field}`);
        }
      }
      
      return NextResponse.json(parsedResponse);
    } catch (error) {
      console.error('Error parsing response:', error);
      return NextResponse.json({ error: 'Invalid response format' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in enhance prompt API:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
} 