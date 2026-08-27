import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para log de requisições HTTP formatado e limpo
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const { method, originalUrl } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;

    const statusEmoji = statusCode >= 500 ? '🔴' : statusCode >= 400 ? '🟡' : '🟢';

    console.log(
      `${statusEmoji} [${new Date().toISOString()}] ${method.padEnd(6)} ${originalUrl.padEnd(30)} ${statusCode} - ${duration}ms`
    );
  });

  next();
};
