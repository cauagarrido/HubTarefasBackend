import { createApp } from './app';
import { env } from './config/env';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`
  🚀 =========================================================
  🏢 HUB DE TAREFAS & CENTRAL DE COMUNICAÇÃO - API BACKEND
  =========================================================
  📡 Servidor rodando em: http://localhost:${env.PORT}
  📚 Catálogo de Rotas:   http://localhost:${env.PORT}/api
  🩺 Health Check:        http://localhost:${env.PORT}/api/hubs/health
  🌍 Ambiente:            ${env.NODE_ENV}
  🗄️  Supabase Conectado:  ${env.isSupabaseConfigured ? 'SIM (Configurado)' : 'NÃO (Modo Demo / Sem chaves)'}
  =========================================================
  `);
});

// Tratamento de encerramento gracioso (Graceful Shutdown)
const handleGracefulShutdown = (signal: string) => {
  console.log(`\n🛑 Recebido sinal de encerramento [${signal}]. Finalizando conexões...`);
  server.close(() => {
    console.log('✅ Servidor HTTP encerrado com segurança.');
    process.exit(0);
  });

  // Força encerramento após 10 segundos caso conexões persistam
  setTimeout(() => {
    console.error('⚠️ Forçando encerramento após timeout de 10s.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
