import { getSupabaseAdmin, getSupabase } from '../config/supabase';
import { env } from '../config/env';
import { RegisterDTO, LoginDTO, AuthUserResponse, ProfileRow } from '../types/index';

export class AuthService {
  /**
   * Realiza o cadastro de um novo usuário no Supabase Auth e tabela profiles
   */
  async signUp(dto: RegisterDTO): Promise<AuthUserResponse> {
    const supabase = getSupabaseAdmin() || getSupabase();

    if (!supabase || !env.isSupabaseConfigured) {
      throw new Error('Supabase não configurado. Verifique as credenciais no arquivo .env.');
    }

    const { email, password, fullName, avatarUrl } = dto;

    // 1. Cadastra usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          avatar_url: avatarUrl || null,
        },
      },
    });

    if (authError || !authData.user) {
      throw new Error(authError?.message || 'Falha ao registrar usuário no sistema de autenticação.');
    }

    const userId = authData.user.id;

    // 2. Garante persistência na tabela profiles (caso o trigger do Postgres não tenha executado)
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          email,
          full_name: fullName,
          avatar_url: avatarUrl || null,
          theme_preference: 'dark',
          accent_color: '#6366f1',
        },
        { onConflict: 'id' }
      );

    if (profileError) {
      console.warn('Aviso ao sincronizar perfil do usuário:', profileError.message);
    }

    // 3. Busca perfil consolidado
    const { data: rawProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    const profile = rawProfile as ProfileRow | null;

    return {
      user: {
        id: userId,
        email,
        fullName: profile?.full_name || fullName,
        avatarUrl: profile?.avatar_url || avatarUrl || null,
        themePreference: profile?.theme_preference || 'dark',
        accentColor: profile?.accent_color || '#6366f1',
        createdAt: profile?.created_at || new Date().toISOString(),
      },
      session: authData.session
        ? {
            accessToken: authData.session.access_token,
            refreshToken: authData.session.refresh_token,
            expiresIn: authData.session.expires_in,
            tokenType: authData.session.token_type,
          }
        : null,
    };
  }

  /**
   * Realiza login do usuário com e-mail e senha
   */
  async signIn(dto: LoginDTO): Promise<AuthUserResponse> {
    const supabase = getSupabaseAdmin() || getSupabase();

    if (!supabase || !env.isSupabaseConfigured) {
      throw new Error('Supabase não configurado. Verifique as credenciais no arquivo .env.');
    }

    const { email, password } = dto;

    // 1. Autentica no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      throw new Error(authError?.message || 'E-mail ou senha incorretos.');
    }

    const userId = authData.user.id;

    // 2. Busca perfil na tabela profiles
    const { data: rawProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    const profile = rawProfile as ProfileRow | null;

    return {
      user: {
        id: userId,
        email: authData.user.email || email,
        fullName: profile?.full_name || (authData.user.user_metadata?.full_name as string) || 'Usuário',
        avatarUrl: profile?.avatar_url || (authData.user.user_metadata?.avatar_url as string) || null,
        themePreference: profile?.theme_preference || 'dark',
        accentColor: profile?.accent_color || '#6366f1',
        createdAt: profile?.created_at || new Date().toISOString(),
      },
      session: authData.session
        ? {
            accessToken: authData.session.access_token,
            refreshToken: authData.session.refresh_token,
            expiresIn: authData.session.expires_in,
            tokenType: authData.session.token_type,
          }
        : null,
    };
  }

  /**
   * Retorna os dados do perfil do usuário autenticado
   */
  async getMe(userId: string): Promise<AuthUserResponse['user']> {
    const supabase = getSupabaseAdmin() || getSupabase();

    if (!supabase || !env.isSupabaseConfigured) {
      throw new Error('Supabase não configurado.');
    }

    const { data: rawProfile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    const profile = rawProfile as ProfileRow | null;

    if (error || !profile) {
      throw new Error('Perfil de usuário não localizado.');
    }

    return {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      avatarUrl: profile.avatar_url,
      themePreference: profile.theme_preference,
      accentColor: profile.accent_color,
      createdAt: profile.created_at,
    };
  }
}

export const authService = new AuthService();
