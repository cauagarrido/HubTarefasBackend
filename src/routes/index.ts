import { Router } from 'express';
import apiRoutes from './api.routes';
import authRoutes from './auth.routes';
import hubRoutes from './hub.routes';

const router = Router();

// Rota raiz da API (/api)
router.use('/', apiRoutes);

// Rotas de Autenticação (/api/auth)
router.use('/auth', authRoutes);

// Rotas de Hubs / Grupos Empresariais (/api/hubs)
router.use('/hubs', hubRoutes);

export default router;
