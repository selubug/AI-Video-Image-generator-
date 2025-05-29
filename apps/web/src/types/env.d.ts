declare namespace NodeJS {
  interface ProcessEnv {
    OPENAI_API_KEY: string;
    STABILITY_API_KEY: string;
    PIAPI_API_KEY: string;
    IDEOGRAM_API_KEY: string;
    RECRAFT_API_KEY: string;
    HUGGINGFACE_API_KEY: string;
    API_302_KEY: string;
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
  }
} 