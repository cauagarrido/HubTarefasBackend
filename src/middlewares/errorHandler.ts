import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types/index';
import { env } from '../config/env';

export interface AppError extends Error {
  statusCode?: number;
  details?: Record<string, unknown>;
}

/**
 * Middleware para capturar rotas não encontradas (404)
 */
export const notFoundHandler = (req: Request, res: Response<ApiResponse>): void => {
  res.status(404).json({
    success: false,
    error: `Rota não encontrada: [${req.method}] ${req.originalUrl}`,
  });
};

/**
 * Middleware global de captura e tratamento de erros (500 / custom)
 */
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response<ApiResponse>,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Ocorreu um erro interno no servidor.';

  console.error(`❌ [Error] [${req.method}] ${req.originalUrl}:`, {
    message: err.message,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
    details: err.details,
  });

  res.status(statusCode).json({
    success: false,
    error: message,
    meta:
      env.NODE_ENV === 'development'
        ? {
            stack: err.stack,
            details: err.details,
          }
        : undefined,
  });
};
