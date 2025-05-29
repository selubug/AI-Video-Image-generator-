import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const { data: images, error } = await supabase
      .from('generated_images')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user images:', error);
      return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
    }

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error in user-images API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user images: ' + (error as Error).message },
      { status: 500 }
    );
  }
} 