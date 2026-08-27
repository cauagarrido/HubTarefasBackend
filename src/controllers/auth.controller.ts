import { Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { ApiResponse, AuthUserResponse, RegisterDTO, LoginDTO } from '../types/index';

export class AuthController {
  /**
   * POST /api/auth/register
   * Cadastra um novo usuário no sistema
   */
  public register = async (
    req: AuthenticatedRequest<Record<string, string>, ApiResponse<AuthUserResponse>, RegisterDTO>,
    res: Response<ApiResponse<AuthUserResponse>>,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const { email, password, fullName, avatarUrl } = req.body;

      if (!email || !email.includes('@')) {
        res.status(400).json({
          success: false,
          error: 'Um endereço de e-mail válido é obrigatório.',
        });
        return;
      }

      if (!password || password.length < 6) {
        res.status(400).json({
          success: false,
          error: 'A senha é obrigatória e deve conter pelo menos 6 caracteres.',
        });
        return;
      }

      if (!fullName || fullName.trim().length < 2) {
        res.status(400).json({
          success: false,
          error: 'O nome completo é obrigatório (mínimo de 2 caracteres).',
        });
        return;
      }

      const result = await authService.signUp({
        email: email.trim().toLowerCase(),
        password,
        fullName: fullName.trim(),
        avatarUrl: avatarUrl ? avatarUrl.trim() : undefined,
      });

      res.status(201).json({
        success: true,
        message: 'Cadastro realizado com sucesso!',
        data: result,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao realizar cadastro';
      res.status(400).json({
        success: false,
        error: msg,
      });
    }
  };

  /**
   * POST /api/auth/login
   * Autentica o usuário e retorna o token de sessão
   */
  public login = async (
    req: AuthenticatedRequest<Record<string, string>, ApiResponse<AuthUserResponse>, LoginDTO>,
    res: Response<ApiResponse<AuthUserResponse>>,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'E-mail e senha são obrigatórios.',
        });
        return;
      }

      const result = await authService.signIn({
        email: email.trim().toLowerCase(),
        password,
      });

      res.status(200).json({
        success: true,
        message: 'Login realizado com sucesso!',
        data: result,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao realizar login';
      res.status(401).json({
        success: false,
        error: msg,
      });
    }
  };

  /**
   * GET /api/auth/me
   * Retorna dados do perfil do usuário autenticado atual
   */
  public getMe = async (
    req: AuthenticatedRequest,
    res: Response<ApiResponse<AuthUserResponse['user']>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({
          success: false,
          error: 'Usuário não autenticado.',
        });
        return;
      }

      const user = await authService.getMe(req.user.id);

      res.status(200).json({
        success: true,
        message: 'Perfil do usuário obtido com sucesso',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
