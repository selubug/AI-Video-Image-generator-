interface ChatGPTResponse {
  suggestion: string;
  error?: string;
}

export async function callChatGPT(prompt: string): Promise<string> {
  try {
    const response = await fetch('/api/enhance-prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    const data: ChatGPTResponse = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get suggestions');
    }

    if (!data.suggestion) {
      throw new Error('No suggestion received from the API');
    }

    return data.suggestion;
  } catch (error) {
    console.error('Error calling enhance-prompt API:', error);
    throw error;
  }
} 