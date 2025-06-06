import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET() {
  const taskId = 'runway_20a1913b29ff';
  console.log('Testing Runway task:', taskId);

  try {
    const response = await fetch(`https://api.302.ai/runway/task/${taskId}/fetch`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${process.env.API_302_KEY}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error checking task status:', errorText);
      return NextResponse.json({ error: errorText }, { status: response.status });
    }

    const data = await response.json();
    console.log('Raw response:', JSON.stringify(data, null, 2));

    // Check for video URL in the response
    const videoUrl = data.task?.artifacts?.[0]?.url;
    
    if (videoUrl) {
      console.log('Found video URL:', videoUrl);
      
      // Save to database
      const dbData = {
        id: crypto.randomUUID(),
        user_id: '00000000-0000-0000-0000-000000000000',
        prompt: data.task?.options?.text_prompt || 'Test video',
        model: 'runway',
        image_url: videoUrl,
        created_at: new Date().toISOString(),
        type: 'video',
        duration: 5,
        resolution: '1024x576',
        fps: 30
      };

      console.log('Attempting to save to database:', dbData);

      const { error: dbError } = await supabase
        .from('generated_images')
        .insert(dbData);

      if (dbError) {
        console.error('Database error:', dbError);
        return NextResponse.json({ 
          error: 'Failed to save video',
          dbError,
          videoUrl 
        });
      }

      return NextResponse.json({
        status: 'success',
        message: 'Video saved successfully',
        videoUrl,
        dbData
      });
    }

    return NextResponse.json({
      status: 'pending',
      message: 'No video URL found yet',
      taskStatus: data.task?.status,
      rawResponse: data
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 