import { NextResponse } from 'next/server';

interface MidjourneyStatusResponse {
  code: number;
  data: {
    task_id: string;
    status: 'Completed' | 'Processing' | 'Pending' | 'Failed' | 'Staged';
    output: {
      image_url?: string;
      image_urls?: string[];
      temporary_image_urls?: string[];
      discord_image_url?: string;
      progress: number;
    };
  };
}

export async function POST(req: Request) {
  try {
    const { taskId } = await req.json();
    console.log('Checking Midjourney status for task:', taskId);

    if (!taskId) {
      console.error('No task ID provided');
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    if (!process.env.MIDJOURNEY_API_KEY) {
      console.error('Midjourney API key is missing');
      return NextResponse.json(
        { error: 'Midjourney API key is missing' },
        { status: 500 }
      );
    }

    console.log('Making request to Midjourney API...');
    const response = await fetch(`https://api.goapi.ai/api/v1/task/${taskId}`, {
      headers: {
        'x-api-key': process.env.MIDJOURNEY_API_KEY
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Midjourney API error:', errorData);
      throw new Error(`Midjourney API error: ${errorData.message || 'Unknown error'}`);
    }

    const data = await response.json() as MidjourneyStatusResponse;
    console.log('Full Midjourney API response:', JSON.stringify(data, null, 2));
    
    // If the task is completed, download and convert the images to base64
    if (data.data.status === 'Completed' && data.data.output) {
      console.log('Task completed, checking output:', data.data.output);
      
      // Check for different possible image URL fields
      const imageUrls = data.data.output.image_urls || 
                       (data.data.output.image_url ? [data.data.output.image_url] : []) ||
                       (data.data.output.temporary_image_urls || []) ||
                       (data.data.output.discord_image_url ? [data.data.output.discord_image_url] : []);

      console.log('Found image URLs:', imageUrls);

      if (imageUrls.length === 0) {
        console.error('No image URLs found in completed task');
        return NextResponse.json({
          status: 'completed',
          error: 'No images found in completed task',
          taskId,
          progress: 100
        });
      }

      console.log('Downloading images...');
      const base64Images = await Promise.all(
        imageUrls.map(async (url: string) => {
          console.log('Downloading image from:', url);
          const imageResponse = await fetch(url);
          if (!imageResponse.ok) {
            throw new Error(`Failed to download image from ${url}`);
          }
          const imageBuffer = await imageResponse.arrayBuffer();
          return Buffer.from(imageBuffer).toString('base64');
        })
      );

      console.log('Successfully downloaded all images');
      return NextResponse.json({
        status: 'completed',
        images: base64Images.map(base64 => `data:image/png;base64,${base64}`),
        taskId,
        progress: 100
      });
    }

    // If the task is still processing
    console.log('Task still processing:', {
      status: data.data.status,
      progress: data.data.output?.progress || 0,
      output: data.data.output
    });
    return NextResponse.json({
      status: data.data.status.toLowerCase(),
      progress: data.data.output?.progress || 0,
      taskId
    });

  } catch (error) {
    console.error('Error checking Midjourney status:', error);
    return NextResponse.json(
      { error: 'Failed to check Midjourney status: ' + (error as Error).message },
      { status: 500 }
    );
  }
} 