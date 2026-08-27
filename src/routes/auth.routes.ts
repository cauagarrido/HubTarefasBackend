import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Rota pública de cadastro
router.post('/register', authController.register);

// Rota pública de login
router.post('/login', authController.login);

// Rota protegida do perfil do usuário autenticado
router.get('/me', authenticateToken, authController.getMe);

export default router;
