import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let supabaseClient: SupabaseClient<any> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let supabaseAdminClient: SupabaseClient<any> | null = null;

if (env.isSupabaseConfigured) {
  try {
    supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    if (env.SUPABASE_SERVICE_ROLE_KEY && !env.SUPABASE_SERVICE_ROLE_KEY.includes('your-supabase')) {
      supabaseAdminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    }
  } catch (error) {
    console.error('⚠️ [Supabase] Erro ao inicializar cliente Supabase:', error);
  }
} else {
  console.warn(
    '⚠️ [Supabase] Credenciais não configuradas ou são placeholders no .env.'
  );
}

/**
 * Retorna o cliente Supabase anônimo
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSupabase = (): SupabaseClient<any> | null => supabaseClient;

/**
 * Retorna o cliente Supabase administrativo com Service Role
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSupabaseAdmin = (): SupabaseClient<any> | null => supabaseAdminClient || supabaseClient;
