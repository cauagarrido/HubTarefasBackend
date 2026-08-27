import { Router } from 'express';
import { apiController } from '../controllers/api.controller';

const router = Router();

/**
 * GET /api
 * Retorna status da API, versão e documentação rápida de rotas
 */
router.get('/', apiController.getInfo);

export default router;
