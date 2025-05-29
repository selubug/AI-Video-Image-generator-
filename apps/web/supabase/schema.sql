-- Create the generated_images table
create table if not exists generated_images (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  prompt text not null,
  negative_prompt text,
  model text not null,
  image_url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create an index on user_id for faster queries
create index if not exists idx_generated_images_user_id on generated_images(user_id);

-- Create an index on created_at for faster sorting
create index if not exists idx_generated_images_created_at on generated_images(created_at desc); 