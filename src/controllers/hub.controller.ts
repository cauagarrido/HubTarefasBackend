import { Response, NextFunction } from 'express';
import { hubService } from '../services/hub.service';
import { isValidInviteCode, normalizeInviteCode } from '../utils/inviteCode';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import {
  ApiResponse,
  HealthCheckResponse,
  GenerateInviteCodeResponse,
  PublicHubPreview,
  CreateHubDTO,
  JoinHubDTO,
  UserHubSummary,
} from '../types/index';

export class HubController {
  /**
   * GET /api/hubs/health
   * Retorna status de integridade do backend e da conexão com Supabase
   */
  public getHealth = async (
    _req: AuthenticatedRequest,
    res: Response<ApiResponse<HealthCheckResponse>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const health = await hubService.checkHealth();
      const httpStatus = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

      res.status(httpStatus).json({
        success: health.status !== 'unhealthy',
        message: `Status do Backend: ${health.status}`,
        data: health,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/hubs/generate-code
   * Gera e retorna um código de convite único com o prefixo 'HUB-'
   */
  public generateCode = async (
    _req: AuthenticatedRequest,
    res: Response<ApiResponse<GenerateInviteCodeResponse>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const codeData = await hubService.generateUniqueInviteCode();

      res.status(201).json({
        success: true,
        message: 'Código de convite gerado com sucesso',
        data: codeData,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/hubs/by-code/:code
   * Retorna informações públicas de um Hub pelo seu código de convite para pré-visualização
   */
  public getByCode = async (
    req: AuthenticatedRequest<{ code: string }>,
    res: Response<ApiResponse<PublicHubPreview>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { code } = req.params;

      if (!code) {
        res.status(400).json({
          success: false,
          error: 'O parâmetro de código de convite é obrigatório.',
        });
        return;
      }

      const normalizedCode = normalizeInviteCode(code);

      if (!isValidInviteCode(normalizedCode)) {
        res.status(400).json({
          success: false,
          error: `Formato de código inválido: "${code}". O código deve seguir o padrão 'HUB-XXXXXX'.`,
        });
        return;
      }

      const hub = await hubService.getHubByCode(normalizedCode);

      if (!hub) {
        res.status(404).json({
          success: false,
          error: `Nenhum Hub encontrado com o código de convite "${normalizedCode}".`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Hub localizado com sucesso',
        data: hub,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/hubs
   * Cria um novo Grupo Empresarial (Hub) para o usuário autenticado
   */
  public createHub = async (
    req: AuthenticatedRequest<Record<string, string>, ApiResponse<UserHubSummary>, CreateHubDTO>,
    res: Response<ApiResponse<UserHubSummary>>,
    _next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({
          success: false,
          error: 'Usuário não autenticado.',
        });
        return;
      }

      const { name, description } = req.body;

      if (!name || name.trim().length < 2) {
        res.status(400).json({
          success: false,
          error: 'O nome do grupo empresarial é obrigatório e deve ter pelo menos 2 caracteres.',
        });
        return;
      }

      const hub = await hubService.createHub(req.user.id, {
        name: name.trim(),
        description: description ? description.trim() : undefined,
      });

      res.status(201).json({
        success: true,
        message: 'Grupo empresarial criado com sucesso!',
        data: hub,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao criar grupo empresarial';
      res.status(400).json({
        success: false,
        error: msg,
      });
    }
  };

  /**
   * GET /api/hubs/my-hubs
   * Retorna todos os grupos empresariais aos quais o usuário autenticado pertence
   */
  public getMyHubs = async (
    req: AuthenticatedRequest,
    res: Response<ApiResponse<UserHubSummary[]>>,
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

      const hubs = await hubService.getUserHubs(req.user.id);

      res.status(200).json({
        success: true,
        message: 'Grupos empresariais listados com sucesso',
        data: hubs,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/hubs/join
   * Permite ao usuário autenticado ingressar em um grupo empresarial usando um código de convite
   */
  public joinHub = async (
    req: AuthenticatedRequest<Record<string, string>, ApiResponse<UserHubSummary>, JoinHubDTO>,
    res: Response<ApiResponse<UserHubSummary>>,
    _next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({
          success: false,
          error: 'Usuário não autenticado.',
        });
        return;
      }

      const { inviteCode } = req.body;

      if (!inviteCode) {
        res.status(400).json({
          success: false,
          error: 'O código de convite é obrigatório.',
        });
        return;
      }

      const hub = await hubService.joinHubByInviteCode(req.user.id, inviteCode);

      res.status(200).json({
        success: true,
        message: 'Você ingressou no grupo empresarial com sucesso!',
        data: hub,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao ingressar no grupo empresarial';
      res.status(400).json({
        success: false,
        error: msg,
      });
    }
  };
}

export const hubController = new HubController();
