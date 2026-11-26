import { createBrowserClient } from '@supabase/ssr';

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Singleton — reutilizado en toda la app cliente
let _client: ReturnType<typeof createSupabaseBrowserClient> | null = null;

export function getSupabase() {
  if (!_client) _client = createSupabaseBrowserClient();
  return _client;
}
