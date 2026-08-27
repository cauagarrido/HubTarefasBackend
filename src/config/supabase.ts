import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';
import { Database } from '../types/database.types';

let supabaseClient: SupabaseClient<Database> | null = null;
let supabaseAdminClient: SupabaseClient<Database> | null = null;

if (env.isSupabaseConfigured) {
  try {
    supabaseClient = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    if (env.SUPABASE_SERVICE_ROLE_KEY && !env.SUPABASE_SERVICE_ROLE_KEY.includes('your-supabase')) {
      supabaseAdminClient = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
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
    '⚠️ [Supabase] Credenciais não configuradas ou são placeholders no .env. Endpoints com fallback funcionarão normalmente.'
  );
}

/**
 * Retorna o cliente Supabase anônimo (respeita RLS baseado no JWT da requisição)
 */
export const getSupabase = (): SupabaseClient<Database> | null => supabaseClient;

/**
 * Retorna o cliente Supabase administrativo com Service Role (ignora RLS quando necessário no backend)
 */
export const getSupabaseAdmin = (): SupabaseClient<Database> | null => supabaseAdminClient || supabaseClient;
