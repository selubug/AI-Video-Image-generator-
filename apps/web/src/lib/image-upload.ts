import { supabase } from '@/utils/supabase';

export async function uploadImageToTempStorage(file: File): Promise<string> {
  try {
    console.log('Starting image upload process...');
    
    // Generate a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `temp/${fileName}`;
    console.log('Generated file path:', filePath);

    // First, try to list the contents of the temp bucket directly
    console.log('Attempting to access temp bucket directly...');
    const { data: files, error: listError } = await supabase.storage
      .from('temp')
      .list();

    if (listError) {
      console.error('Error accessing temp bucket:', listError);
      if (listError.message.includes('not found')) {
        throw new Error('The "temp" bucket was not found. Please make sure you created it with the exact name "temp" (case sensitive) in your Supabase dashboard.');
      }
      throw new Error(`Failed to access temp bucket: ${listError.message}`);
    }

    console.log('Successfully accessed temp bucket');

    // Upload the file to Supabase Storage
    console.log('Attempting to upload file...');
    const { data, error } = await supabase.storage
      .from('temp')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading image:', error);
      if (error.message.includes('permission denied')) {
        throw new Error('Permission denied. Please check that the bucket has the correct access policies in your Supabase dashboard.');
      }
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    console.log('File uploaded successfully:', data);

    // Get the public URL
    console.log('Getting public URL...');
    const { data: { publicUrl } } = supabase.storage
      .from('temp')
      .getPublicUrl(filePath);

    if (!publicUrl) {
      throw new Error('Failed to get public URL for uploaded image');
    }

    // Make sure the URL is publicly accessible
    console.log('Verifying public URL...');
    const response = await fetch(publicUrl);
    if (!response.ok) {
      throw new Error('Uploaded image is not publicly accessible');
    }

    console.log('Public URL verified:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Error in uploadImageToTempStorage:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to upload image to temporary storage');
  }
} 