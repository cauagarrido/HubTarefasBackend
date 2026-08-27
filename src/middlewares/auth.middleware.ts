import { Request, Response, NextFunction } from 'express';
import { getSupabaseAdmin, getSupabase } from '../config/supabase';
import { env } from '../config/env';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string | null;
}

export interface AuthenticatedRequest<
  P = Record<string, string>,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = Record<string, string | string[] | undefined>
> extends Request<P, ResBody, ReqBody, ReqQuery> {
  user?: AuthenticatedUser;
}

/**
 * Middleware para validar o token JWT de autenticação (Bearer Token)
 */
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Acesso não autorizado. Cabeçalho Authorization com formato Bearer <token> é obrigatório.',
      });
      return;
    }

    const token = authHeader.substring(7).trim();

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Token de autenticação não fornecido ou vazio.',
      });
      return;
    }

    const supabase = getSupabaseAdmin() || getSupabase();

    if (!supabase || !env.isSupabaseConfigured) {
      res.status(503).json({
        success: false,
        error: 'Serviço de autenticação temporariamente indisponível. Supabase não configurado.',
      });
      return;
    }

    // Valida o token JWT com o Supabase Auth
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      res.status(401).json({
        success: false,
        error: 'Token de autenticação inválido ou sessão expirada.',
      });
      return;
    }

    // Injeta os dados do usuário autenticado na requisição
    req.user = {
      id: data.user.id,
      email: data.user.email || '',
      fullName: data.user.user_metadata?.full_name || data.user.user_metadata?.name || '',
      avatarUrl: data.user.user_metadata?.avatar_url || null,
    };

    next();
  } catch (error) {
    next(error);
  }
};
