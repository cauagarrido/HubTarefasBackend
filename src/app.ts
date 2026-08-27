import express, { Application } from 'express';
import cors from 'cors';
import { env } from './config/env';
import routes from './routes/index';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { requestLogger } from './middlewares/requestLogger';

export const createApp = (): Application => {
  const app = express();

  // 1. Configuração de CORS flexível
  app.use(
    cors({
      origin: (origin, callback) => {
        // Permite requisições sem origin (ex: mobile, curl, postman) ou correspondentes
        if (!origin || origin === env.CLIENT_URL || env.NODE_ENV === 'development') {
          callback(null, true);
        } else {
          callback(null, true); // Em dev/test permitimos, em prod pode ser restrito se necessário
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'apikey', 'X-Client-Info'],
    })
  );

  // 2. Parsers de corpo de requisição
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 3. Logger de requisições HTTP
  app.use(requestLogger);

  // 4. Rota raiz amigável de redirecionamento / boas-vindas
  app.get('/', (_req, res) => {
    res.json({
      message: 'Bem-vindo ao Backend do Hub de Tarefas & Central de Comunicação!',
      docs: '/api',
      health: '/api/hubs/health',
    });
  });

  // 5. Registro de rotas com prefixo /api
  app.use('/api', routes);

  // 6. Tratamento de rotas não encontradas (404)
  app.use(notFoundHandler);

  // 7. Middleware global de tratamento de erros (500)
  app.use(errorHandler);

  return app;
};

export default createApp;
