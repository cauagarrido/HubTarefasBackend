# 🏢 Hub de Tarefas & Central de Comunicação - Backend API

API RESTful escalável desenvolvida em **Node.js**, **Express**, **TypeScript** e integrada ao banco de dados relacional **PostgreSQL (Supabase)**, fornecendo autenticação integrada, triggers de automação, Row Level Security (RLS) e suporte a Realtime.

---

## 🛠️ Stack Tecnológica

- **Linguagem & Runtime**: [Node.js](https://nodejs.org/) (v18+) com [TypeScript](https://www.typescriptlang.org/) (v5.7+)
- **Framework Web**: [Express.js](https://expressjs.com/) (v4.21+)
- **Banco de Dados & Auth**: [Supabase](https://supabase.com/) (PostgreSQL 15+, RLS, Triggers, Realtime)
- **Cliente Supabase**: `@supabase/supabase-js` (v2.49+)
- **Segurança & Middleware**: CORS, Dotenv, Handlers centralizados de erros e logs

---

## 📁 Estrutura do Projeto

```text
TarefasBackend/
├── .env.example              # Exemplo de configuração de variáveis de ambiente
├── .gitignore                # Arquivos ignorados pelo Git
├── package.json              # Dependências e scripts do projeto
├── tsconfig.json             # Configuração estrita do compilador TypeScript
├── README.md                 # Documentação completa
├── supabase/
│   └── schema.sql            # Script SQL com DDL, 10 tabelas, Triggers, RLS e Realtime
└── src/
    ├── config/
    │   ├── env.ts            # Validação e carregamento de variáveis de ambiente
    │   └── supabase.ts       # Inicialização dos clientes Supabase (Anon e Admin)
    ├── controllers/
    │   ├── api.controller.ts # Controller para catálogo e status (/api)
    │   └── hub.controller.ts # Controller para operações de Hubs (/api/hubs/*)
    ├── middlewares/
    │   ├── errorHandler.ts   # Middleware global de erros (404, 500)
    │   └── requestLogger.ts  # Log formatado de requisições HTTP
    ├── routes/
    │   ├── api.routes.ts     # Rotas gerais da API
    │   ├── hub.routes.ts     # Rotas de gerenciamento de Hubs
    │   └── index.ts          # Agregador central de rotas (/api)
    ├── services/
    │   └── hub.service.ts    # Lógica de negócio e comunicação com PostgreSQL
    ├── types/
    │   ├── database.types.ts # Tipagem estrita de todas as tabelas do Supabase
    │   └── index.ts          # Interfaces DTOs e tipos de resposta da API
    ├── utils/
    │   └── inviteCode.ts     # Utilitário de geração e validação de códigos HUB-XXXXXX
    ├── app.ts                # Configuração da aplicação Express e middlewares
    └── server.ts             # Ponto de entrada e inicialização do servidor HTTP
```

---

## 🗄️ Modelagem do Banco de Dados (`supabase/schema.sql`)

O script SQL em `supabase/schema.sql` contém a modelagem completa com **10 tabelas relacionais**, **triggers automáticos**, **funções de segurança** e **Row Level Security (RLS)**:

1. **`public.profiles`**: Perfis de usuários sincronizados com o `auth.users` do Supabase.
2. **`public.hubs`**: Espaços de trabalho com `invite_code` amigável único (ex: `HUB-8F2K9A`).
3. **`public.hub_members`**: Associação de usuários a hubs com papéis (`admin`, `colaborador`, `leitor`).
4. **`public.hub_join_requests`**: Solicitações de entrada com status (`pending`, `approved`, `rejected`).
5. **`public.kanban_columns`**: Colunas do quadro Kanban ordenadas por `order_index`.
6. **`public.tasks`**: Tarefas com prioridade (`baixa`, `media`, `alta`, `urgente`), prazos, responsável e ordem.
7. **`public.task_checklists`**: Mini-tarefas / sub-itens dentro de uma tarefa.
8. **`public.task_comments`**: Comentários públicos ou notas da tarefa.
9. **`public.announcements`**: Quadro de avisos com suporte a fixação (`is_pinned`).
10. **`public.direct_messages`**: Chat privado 1-a-1 restrito estritamente ao remetente e destinatário.

### Triggers Automatizados

- **`handle_new_user`**: Ao criar um usuário no `auth.users`, insere automaticamente o registro correspondente em `public.profiles` capturando o nome dos metadados.
- **`handle_new_hub`**: Ao criar um novo Hub em `public.hubs`:
  1. Insere o criador na tabela `public.hub_members` com a permissão `'admin'`.
  2. Cria automaticamente as 4 colunas padrão do Kanban:
     - 🟦 *Nova Tarefa* (ordem 0, cor `#3b82f6`)
     - 🟨 *Em Andamento* (ordem 1, cor `#eab308`)
     - 🟪 *Revisado* (ordem 2, cor `#a855f7`)
     - 🟩 *Finalizado* (ordem 3, cor `#22c55e`)
- **`handle_updated_at`**: Atualiza a coluna `updated_at` automaticamente antes de cada `UPDATE` em perfis, hubs, tarefas e avisos.

### Row Level Security (RLS)

- Habilitado em todas as 10 tabelas.
- Utiliza funções `SECURITY DEFINER` (`is_hub_member`, `is_hub_admin`, `can_edit_tasks`) para prevenir problemas de recursão infinita no PostgreSQL.
- DMs restritas exclusivamente a quem enviou (`sender_id = auth.uid()`) ou quem recebeu (`receiver_id = auth.uid()`).

---

## 🚀 Instalação e Execução

### 1. Pré-requisitos
- **Node.js** (versão 18 ou superior)
- Gerenciador de pacotes (`npm`, `yarn` ou `pnpm`)
- Conta no [Supabase](https://supabase.com) (gratuita)

### 2. Instalação das Dependências

```bash
npm install
```

### 3. Configuração das Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com as chaves do seu projeto no Supabase:

```env
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173

SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anonima-publica
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-secreta
```

> **Nota:** Caso execute sem preencher as chaves do Supabase, o backend iniciará em **Modo de Demonstração Offline/Fallback**, permitindo testar a estrutura de rotas sem quebras.

### 4. Executar o Script SQL no Supabase

1. Acesse o Dashboard do seu projeto no Supabase.
2. Navegue até o menu **SQL Editor** no painel esquerdo.
3. Abra o arquivo `supabase/schema.sql` deste repositório, copie todo o seu conteúdo e cole no editor do Supabase.
4. Clique em **Run** para criar todas as tabelas, funções, triggers e políticas RLS.

### 5. Iniciar o Servidor em Desenvolvimento

```bash
npm run dev
```

O servidor estará disponível em: `http://localhost:3001`

### 6. Build de Produção

```bash
npm run build
npm start
```

---

## 📡 Catálogo de Endpoints da API

### Base URL: `http://localhost:3001`

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/` | Rota de boas-vindas com links rápidos |
| `GET` | `/api` | Retorna metadados da API, versão, status e lista de rotas |
| `GET` | `/api/hubs/health` | Diagnóstico de integridade do backend e teste de conexão com o Supabase |
| `POST` | `/api/hubs/generate-code` | Gera e retorna um código de convite único amigável (`HUB-XXXXXX`) |
| `GET` | `/api/hubs/by-code/:code` | Busca dados públicos de um Hub pelo código de convite (para pré-visualização) |

---

### Exemplos de Requisições e Respostas

#### 1. `GET /api`
```json
{
  "success": true,
  "message": "API em pleno funcionamento",
  "data": {
    "name": "Hub de Tarefas & Central de Comunicação API",
    "description": "API RESTful escalável em Node.js, Express, TypeScript e Supabase PostgreSQL",
    "version": "1.0.0",
    "environment": "development",
    "uptime": 12.45,
    "timestamp": "2026-08-26T15:30:00.000Z",
    "endpoints": [...]
  }
}
```

#### 2. `GET /api/hubs/health`
```json
{
  "success": true,
  "message": "Status do Backend: healthy",
  "data": {
    "status": "healthy",
    "uptime": 45.12,
    "timestamp": "2026-08-26T15:30:00.000Z",
    "environment": "development",
    "nodeVersion": "v22.13.0",
    "database": {
      "configured": true,
      "connected": true,
      "latencyMs": 142,
      "message": "Conexão com PostgreSQL/Supabase estabelecida com sucesso."
    }
  }
}
```

#### 3. `POST /api/hubs/generate-code`
```json
{
  "success": true,
  "message": "Código de convite gerado com sucesso",
  "data": {
    "inviteCode": "HUB-8F2K9A",
    "prefix": "HUB-",
    "expiresAt": null,
    "formatted": "HUB-8F2K9A"
  }
}
```

#### 4. `GET /api/hubs/by-code/HUB-8F2K9A`
```json
{
  "success": true,
  "message": "Hub localizado com sucesso",
  "data": {
    "id": "e8b2c45e-0000-4000-8000-000000000001",
    "name": "Squad Core Development",
    "description": "Hub principal de desenvolvimento de software e squads",
    "inviteCode": "HUB-8F2K9A",
    "memberCount": 8,
    "createdAt": "2026-08-26T10:00:00.000Z",
    "owner": {
      "id": "u1234567-0000-4000-8000-000000000001",
      "fullName": "Carlos Silva",
      "avatarUrl": "https://avatar.iran.liara.run/public/1"
    }
  }
}
```

---

## 🛡️ Segurança e Boas Práticas

- **CORS flexível**: Configurado para aceitar origens permitidas e pré-configurado para clientes web.
- **Validação de Entrada**: Validação rigorosa de formatos de códigos de convite com Regex e normalização.
- **Tratamento Centralizado de Erros**: Captura de exceções síncronas e assíncronas com formatação consistente e ocultação de stack traces em ambiente de produção.
- **Graceful Shutdown**: Encerramento seguro de conexões em resposta a sinais `SIGINT` e `SIGTERM`.

---

## 📄 Licença

Este projeto está licenciado sob a [MIT License](LICENSE).
#   H u b T a r e f a s B a c k e n d  
 