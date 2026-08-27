import { createApp } from '../src/app';
import http from 'http';

async function runTests() {
  console.log('🧪 Iniciando testes de integração dos endpoints da API...');
  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => server.listen(3099, () => resolve()));
  const baseUrl = 'http://localhost:3099';

  let totalTests = 0;
  let passedTests = 0;

  async function testEndpoint(
    name: string,
    url: string,
    options: RequestInit = {},
    expectedStatus: number = 200
  ) {
    totalTests++;
    try {
      const res = await fetch(url, options);
      const data = await res.json();
      if (res.status === expectedStatus && data) {
        console.log(`✅ [PASS] ${name} (Status: ${res.status})`);
        passedTests++;
        return data;
      } else {
        console.error(`❌ [FAIL] ${name} - Status esperado: ${expectedStatus}, obtido: ${res.status}`, data);
      }
    } catch (err) {
      console.error(`❌ [ERROR] ${name} - Erro na requisição:`, err);
    }
  }

  // 1. Teste Root /
  await testEndpoint('GET / (Root Welcome)', `${baseUrl}/`, {}, 200);

  // 2. Teste /api
  await testEndpoint('GET /api (API Catalog)', `${baseUrl}/api`, {}, 200);

  // 3. Teste /api/hubs/health
  await testEndpoint('GET /api/hubs/health (Health Check)', `${baseUrl}/api/hubs/health`, {}, 200);

  // 4. Teste /api/hubs/generate-code
  const codeResult = await testEndpoint(
    'POST /api/hubs/generate-code (Generate Invite Code)',
    `${baseUrl}/api/hubs/generate-code`,
    { method: 'POST' },
    201
  );

  const generatedCode = codeResult?.data?.inviteCode || 'HUB-DEMO99';
  console.log(`ℹ️ Código gerado para teste: ${generatedCode}`);

  // 5. Teste /api/hubs/by-code/:code (com código válido gerado / demo)
  await testEndpoint(
    `GET /api/hubs/by-code/${generatedCode} (Preview Hub by Code)`,
    `${baseUrl}/api/hubs/by-code/${generatedCode}`,
    {},
    200
  );

  // 6. Teste de código inválido (400)
  await testEndpoint(
    'GET /api/hubs/by-code/INVALID-FORMAT (Invalid Code Format)',
    `${baseUrl}/api/hubs/by-code/INVALID-FORMAT`,
    {},
    400
  );

  // 7. Teste de rota 404
  await testEndpoint(
    'GET /api/non-existent-route (404 Handler)',
    `${baseUrl}/api/non-existent-route`,
    {},
    404
  );

  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });

  console.log(`\n📊 Resultado dos testes: ${passedTests}/${totalTests} passaram.`);
  if (passedTests === totalTests) {
    console.log('🎉 Todos os testes de endpoint foram concluídos com sucesso!');
  } else {
    console.error('⚠️ Alguns testes falharam.');
    process.exitCode = 1;
  }
}

runTests().catch((e) => {
  console.error('Fatal error during test execution:', e);
  process.exit(1);
});
