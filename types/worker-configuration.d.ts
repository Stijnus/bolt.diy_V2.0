interface Env {
  // ai provider API keys
  ANTHROPIC_API_KEY: string;
  OPENAI_API_KEY?: string;
  GOOGLE_API_KEY?: string;
  DEEPSEEK_API_KEY?: string;
  XAI_API_KEY?: string;
  MISTRAL_API_KEY?: string;

  // supabase configuration
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}
