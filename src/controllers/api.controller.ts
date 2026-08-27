import { Request, Response } from 'express';
import { env } from '../config/env';
import { ApiResponse, ApiInfoResponse } from '../types/index';

export class ApiController {
  /**
   * GET /api
   * Retorna informações da API, versão, status e catálogo de rotas
   */
  public getInfo = (_req: Request, res: Response<ApiResponse<ApiInfoResponse>>): void => {
    const responseData: ApiInfoResponse = {
      name: 'Hub de Tarefas & Central de Comunicação API',
      description: 'API RESTful escalável em Node.js, Express, TypeScript e Supabase PostgreSQL',
      version: '1.0.0',
      environment: env.NODE_ENV,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      endpoints: [
        {
          method: 'GET',
          path: '/api',
          description: 'Retorna status da API, versão e lista de endpoints disponíveis',
        },
        {
          method: 'GET',
          path: '/api/hubs/health',
          description: 'Retorna status de integridade do backend e verificação de conexão com o Supabase',
        },
        {
          method: 'POST',
          path: '/api/hubs/generate-code',
          description: 'Gera e retorna um código de convite amigável e único com o prefixo HUB-',
        },
        {
          method: 'GET',
          path: '/api/hubs/by-code/:code',
          description: 'Busca informações públicas básicas de um Hub pelo seu código de convite para pré-visualização',
        },
      ],
    };

    res.status(200).json({
      success: true,
      message: 'API em pleno funcionamento',
      data: responseData,
    });
  };
}

export const apiController = new ApiController();
