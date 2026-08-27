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

  const generatedCode = codeResult?.data?.inviteCode || 'HUB-A2B3C4';
  console.log(`ℹ️ Código gerado para teste: ${generatedCode}`);

  // 5. Teste de código inválido (400)
  await testEndpoint(
    'GET /api/hubs/by-code/INVALID-FORMAT (Invalid Code Format)',
    `${baseUrl}/api/hubs/by-code/INVALID-FORMAT`,
    {},
    400
  );

  // 6. Teste de rota protegida /api/auth/me sem token (401)
  await testEndpoint(
    'GET /api/auth/me (Unauthorized Without Token)',
    `${baseUrl}/api/auth/me`,
    {},
    401
  );

  // 7. Teste de validação em /api/auth/register com payload vazio (400)
  await testEndpoint(
    'POST /api/auth/register (Validation Error with Empty Body)',
    `${baseUrl}/api/auth/register`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    },
    400
  );

  // 8. Teste de validação em /api/auth/login com payload inválido (400)
  await testEndpoint(
    'POST /api/auth/login (Validation Error without Password)',
    `${baseUrl}/api/auth/login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    },
    400
  );

  // 9. Teste de rota protegida /api/hubs sem token (401)
  await testEndpoint(
    'POST /api/hubs (Unauthorized Without Token)',
    `${baseUrl}/api/hubs`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Empresa Teste' }),
    },
    401
  );

  // 10. Teste de rota protegida /api/hubs/my-hubs sem token (401)
  await testEndpoint(
    'GET /api/hubs/my-hubs (Unauthorized Without Token)',
    `${baseUrl}/api/hubs/my-hubs`,
    {},
    401
  );

  // 11. Teste de rota protegida /api/hubs/join sem token (401)
  await testEndpoint(
    'POST /api/hubs/join (Unauthorized Without Token)',
    `${baseUrl}/api/hubs/join`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteCode: generatedCode }),
    },
    401
  );

  // 12. Teste de rota inexistente (404)
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
