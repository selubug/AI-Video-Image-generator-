import { supabase } from './supabase';

export async function setupGeneratedImagesTable() {
  if (!supabase) {
    console.error('Supabase client not initialized');
    return;
  }

  try {
    // Check if table exists
    const { data: tableExists, error: checkError } = await supabase
      .from('generated_images')
      .select('id')
      .limit(1);

    if (checkError) {
      console.log('Table might not exist, attempting to create...');
      
      // Create the table
      const { error: createError } = await supabase.rpc('create_generated_images_table');
      
      if (createError) {
        console.error('Error creating table:', createError);
        return;
      }
      
      console.log('Table created successfully');
    } else {
      console.log('Table exists, checking schema...');
    }

    // Verify table structure
    const { data: tableInfo, error: infoError } = await supabase
      .from('generated_images')
      .select('*')
      .limit(0);

    if (infoError) {
      console.error('Error checking table structure:', infoError);
      return;
    }

    console.log('Table structure verified');
    
    // Count existing rows
    const { count, error: countError } = await supabase
      .from('generated_images')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error counting rows:', countError);
      return;
    }

    console.log(`Current row count: ${count}`);
  } catch (error) {
    console.error('Unexpected error:', error);
  }
} 