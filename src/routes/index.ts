import { Router } from 'express';
import apiRoutes from './api.routes';
import hubRoutes from './hub.routes';

const router = Router();

// Rota raiz da API (/api)
router.use('/', apiRoutes);

// Rotas de Hubs (/api/hubs)
router.use('/hubs', hubRoutes);

export default router;
