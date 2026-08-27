import { Router } from 'express';
import { hubController } from '../controllers/hub.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// ==========================================
// Rotas Públicas de Hubs
// ==========================================

// Verificação de integridade e saúde do banco
router.get('/health', hubController.getHealth);

// Geração de código de convite
router.post('/generate-code', hubController.generateCode);

// Pré-visualização pública de hub pelo código
router.get('/by-code/:code', hubController.getByCode);

// ==========================================
// Rotas Protegidas (Exigem Autenticação Bearer Token)
// ==========================================

// Criação de um novo grupo empresarial (Hub)
router.post('/', authenticateToken, hubController.createHub);

// Listagem dos grupos empresariais do usuário autenticado
router.get('/my-hubs', authenticateToken, hubController.getMyHubs);

// Ingressar em um grupo empresarial usando código de convite
router.post('/join', authenticateToken, hubController.joinHub);

export default router;
