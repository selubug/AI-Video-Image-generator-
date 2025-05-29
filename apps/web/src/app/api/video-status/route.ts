import { NextResponse } from 'next/server';

const PIAPI_BASE_URL = 'https://api.piapi.ai/api/v1';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.PIAPI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'PIAPI API key is not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(`${PIAPI_BASE_URL}/task/${taskId}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey
      }
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || 'Failed to check video status' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    if (data.code !== 200) {
      return NextResponse.json(
        { error: data.message || 'Failed to check video status' },
        { status: 500 }
      );
    }

    const videoData = data.data;
    const status = videoData.status;
    
    // If the task is completed, return the video URL and metadata
    if (status === 'completed' && videoData.output?.works?.[0]?.video) {
      const video = videoData.output.works[0].video;
      return NextResponse.json({
        status: 'completed',
        videoUrl: video.resource_without_watermark,
        duration: video.duration,
        resolution: `${video.width}x${video.height}`,
        fps: video.fps
      });
    }
    
    // If the task failed, return the error
    if (status === 'failed') {
      return NextResponse.json({
        status: 'failed',
        error: videoData.error || 'Video generation failed'
      });
    }
    
    // If the task is still processing, return the current status
    return NextResponse.json({
      status: status || 'pending',
      message: 'Video generation in progress'
    });

  } catch (error) {
    console.error('Error checking video status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check video status' },
      { status: 500 }
    );
  }
} 