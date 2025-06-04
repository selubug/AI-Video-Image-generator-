import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const taskId = '6950d4f138b95b1ccfa0761bbb4d2b18ab5118e23552e2d8ba140bd192137990';
  console.log('Testing Stability AI task:', taskId);

  try {
    const response = await fetch(`https://api.302.ai/sd/v2beta/image-to-video/result/${taskId}`, {
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

    // Check for video in the response
    const videoData = data.video;
    
    if (videoData) {
      console.log('Found video data');
      
      // Convert base64 to video URL
      const videoUrl = `data:video/mp4;base64,${videoData}`;
      
      // Save to database
      const dbData = {
        id: crypto.randomUUID(),
        user_id: '00000000-0000-0000-0000-000000000000',
        prompt: 'Test video',
        model: 'stability',
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
      message: 'No video data found yet',
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