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
          description: 'Retorna status da API, versão e catálogo de endpoints',
        },
        {
          method: 'POST',
          path: '/api/auth/register',
          description: 'Cadastra um novo usuário no Supabase Auth e tabela profiles',
        },
        {
          method: 'POST',
          path: '/api/auth/login',
          description: 'Autentica o usuário com e-mail/senha e retorna o token de sessão JWT',
        },
        {
          method: 'GET',
          path: '/api/auth/me',
          description: 'Retorna o perfil do usuário autenticado atual (Bearer Token)',
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
        {
          method: 'POST',
          path: '/api/hubs',
          description: 'Cria um novo Grupo Empresarial (Hub) com colunas Kanban e associa o usuário como Administrador',
        },
        {
          method: 'GET',
          path: '/api/hubs/my-hubs',
          description: 'Lista todos os Grupos Empresariais dos quais o usuário autenticado participa ou é proprietário',
        },
        {
          method: 'POST',
          path: '/api/hubs/join',
          description: 'Permite ao usuário autenticado ingressar em um Grupo Empresarial via código de convite',
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
