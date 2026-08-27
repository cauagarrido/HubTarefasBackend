import { Request, Response, NextFunction } from 'express';
import { hubService } from '../services/hub.service';
import { isValidInviteCode, normalizeInviteCode } from '../utils/inviteCode';
import { ApiResponse, HealthCheckResponse, GenerateInviteCodeResponse, PublicHubPreview } from '../types/index';

export class HubController {
  /**
   * GET /api/hubs/health
   * Retorna status de integridade do backend e da conexão com Supabase
   */
  public getHealth = async (
    _req: Request,
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
    _req: Request,
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
    req: Request<{ code: string }>,
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
}

export const hubController = new HubController();
