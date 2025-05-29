interface ChatGPTResponse {
  suggestion: string;
  error?: string;
}

export interface Message {
  role: 'user' | 'assistant' | 'enhancement';
  content: string;
  timestamp?: number;
  analysis?: {
    addDetails?: string;
    promptWarnings?: string;
    promptSwaps?: string;
    optimizedPrompt?: string;
  };
}

export interface AnalysisSection {
  addDetails?: string;
  promptWarnings?: string;
  promptSwaps?: string;
  optimizedPrompt?: string;
}

export interface ChatResponse {
  response?: string;
  error?: string;
}

export async function callChatGPT2(prompt: string): Promise<string> {
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

export async function sendChatMessage(
  messages: Message[], 
  isAnalysis: boolean = false, 
  model?: string,
  mode?: 'image' | 'video',
  selectedArtMode?: string | null
): Promise<ChatResponse> {
  try {
    // Debug prints for mode information
    console.log('=== Sending Chat Message ===');
    console.log('Current Mode:', selectedArtMode || 'General');
    console.log('Mode Type:', mode || 'image');
    console.log('Is Analysis:', isAnalysis);
    console.log('Model:', model);
    console.log('Messages:', messages);
    console.log('========================');

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        messages, 
        isAnalysis, 
        model,
        mode,
        selectedArtMode
      }),
    });

    console.log('Chat API response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Chat API error:', errorData);
      throw new Error(errorData.error || 'Failed to send message');
    }

    const data = await response.json();
    console.log('Chat API response data:', data);
    
    if (!data.response) {
      console.error('No response in chat API data:', data);
      throw new Error('No response received from chat API');
    }

    return data;
  } catch (error) {
    console.error('Error in sendChatMessage:', error);
    return { error: 'Failed to send message: ' + (error as Error).message };
  }
} 