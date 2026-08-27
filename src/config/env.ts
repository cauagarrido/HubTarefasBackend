import dotenv from 'dotenv';

// Carrega o arquivo .env
dotenv.config();

export interface EnvironmentConfig {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  CLIENT_URL: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  isSupabaseConfigured: boolean;
}

const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

const getEnvString = (key: string, defaultValue: string = ''): string => {
  return process.env[key] || defaultValue;
};

const supabaseUrl = getEnvString('SUPABASE_URL');
const supabaseAnonKey = getEnvString('SUPABASE_ANON_KEY');
const supabaseServiceRoleKey = getEnvString('SUPABASE_SERVICE_ROLE_KEY');

const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project-id') &&
  !supabaseAnonKey.includes('your-supabase')
);

export const env: EnvironmentConfig = {
  PORT: getEnvNumber('PORT', 3001),
  NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  CLIENT_URL: getEnvString('CLIENT_URL', 'http://localhost:5173'),
  SUPABASE_URL: supabaseUrl,
  SUPABASE_ANON_KEY: supabaseAnonKey,
  SUPABASE_SERVICE_ROLE_KEY: supabaseServiceRoleKey,
  isSupabaseConfigured,
};
