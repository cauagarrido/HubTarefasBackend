import { Router } from 'express';
import { hubController } from '../controllers/hub.controller';

const router = Router();

/**
 * GET /api/hubs/health
 * Diagnóstico de conexão com Supabase e saúde do backend
 */
router.get('/health', hubController.getHealth);

/**
 * POST /api/hubs/generate-code
 * Gera um código de convite único amigável (HUB-XXXXXX)
 */
router.post('/generate-code', hubController.generateCode);

/**
 * GET /api/hubs/by-code/:code
 * Busca dados públicos de um Hub pelo seu código de convite
 */
router.get('/by-code/:code', hubController.getByCode);

export default router;
