-- ==============================================================================
-- HUB DE TAREFAS & CENTRAL DE COMUNICAÇÃO - SCHEMA SQL COMPLETO (SUPABASE / POSTGRESQL)
-- ==============================================================================
-- Este script configura toda a estrutura do banco de dados, tabelas relacionais,
-- triggers automáticos, funções de segurança e políticas RLS (Row Level Security).
-- ==============================================================================

-- 1. EXTENSÕES NECESSÁRIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. CRIAÇÃO DAS TABELAS RELACIONAIS
-- ==============================================================================

-- 2.1. TABELA: PROFILES (Perfis de Usuários sincronizados com auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    theme_preference TEXT DEFAULT 'dark' CHECK (theme_preference IN ('dark', 'light', 'system')),
    accent_color TEXT DEFAULT '#6366f1',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2.2. TABELA: HUBS (Espaços de Trabalho)
CREATE TABLE IF NOT EXISTS public.hubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    invite_code VARCHAR(16) UNIQUE NOT NULL,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2.3. TABELA: HUB_MEMBERS (Membros dos Hubs com papéis de acesso)
CREATE TABLE IF NOT EXISTS public.hub_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hub_id UUID NOT NULL REFERENCES public.hubs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'colaborador' CHECK (role IN ('admin', 'colaborador', 'leitor')),
    joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT hub_members_unique_membership UNIQUE (hub_id, user_id)
);

-- 2.4. TABELA: HUB_JOIN_REQUESTS (Solicitações de Entrada nos Hubs)
CREATE TABLE IF NOT EXISTS public.hub_join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hub_id UUID NOT NULL REFERENCES public.hubs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT hub_join_requests_unique UNIQUE (hub_id, user_id)
);

-- 2.5. TABELA: KANBAN_COLUMNS (Colunas do Kanban do Hub)
CREATE TABLE IF NOT EXISTS public.kanban_columns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hub_id UUID NOT NULL REFERENCES public.hubs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    color TEXT NOT NULL DEFAULT '#6366f1',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2.6. TABELA: TASKS (Tarefas do Kanban)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hub_id UUID NOT NULL REFERENCES public.hubs(id) ON DELETE CASCADE,
    column_id UUID NOT NULL REFERENCES public.kanban_columns(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT NOT NULL DEFAULT 'media' CHECK (priority IN ('baixa', 'media', 'alta', 'urgente')),
    due_date TIMESTAMPTZ,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2.7. TABELA: TASK_CHECKLISTS (Mini-tasks / Sub-tarefas)
CREATE TABLE IF NOT EXISTS public.task_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2.8. TABELA: TASK_COMMENTS (Comentários e Notas da Tarefa)
CREATE TABLE IF NOT EXISTS public.task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_note BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2.9. TABELA: ANNOUNCEMENTS (Quadro de Avisos do Hub)
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hub_id UUID NOT NULL REFERENCES public.hubs(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2.10. TABELA: DIRECT_MESSAGES (Chat Privado 1-a-1 entre Membros)
CREATE TABLE IF NOT EXISTS public.direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hub_id UUID NOT NULL REFERENCES public.hubs(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT check_different_users CHECK (sender_id <> receiver_id)
);

-- ==============================================================================
-- 3. ÍNDICES DE PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_hubs_invite_code ON public.hubs(invite_code);
CREATE INDEX IF NOT EXISTS idx_hubs_owner_id ON public.hubs(owner_id);
CREATE INDEX IF NOT EXISTS idx_hub_members_hub_id ON public.hub_members(hub_id);
CREATE INDEX IF NOT EXISTS idx_hub_members_user_id ON public.hub_members(user_id);
CREATE INDEX IF NOT EXISTS idx_hub_join_requests_hub_id ON public.hub_join_requests(hub_id);
CREATE INDEX IF NOT EXISTS idx_hub_join_requests_user_id ON public.hub_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_kanban_columns_hub_id ON public.kanban_columns(hub_id);
CREATE INDEX IF NOT EXISTS idx_tasks_hub_id ON public.tasks(hub_id);
CREATE INDEX IF NOT EXISTS idx_tasks_column_id ON public.tasks(column_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_task_checklists_task_id ON public.task_checklists(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON public.task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_announcements_hub_id ON public.announcements(hub_id);
CREATE INDEX IF NOT EXISTS idx_dm_hub_id ON public.direct_messages(hub_id);
CREATE INDEX IF NOT EXISTS idx_dm_sender_receiver ON public.direct_messages(sender_id, receiver_id);

-- ==============================================================================
-- 4. FUNÇÕES AUXILIARES DE ATUALIZAÇÃO E SEGURANÇA
-- ==============================================================================

-- 4.1. Função para atualizar timestamp updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4.2. Triggers de updated_at para tabelas com essa coluna
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_hubs_updated_at ON public.hubs;
CREATE TRIGGER set_hubs_updated_at
    BEFORE UPDATE ON public.hubs
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_tasks_updated_at ON public.tasks;
CREATE TRIGGER set_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_announcements_updated_at ON public.announcements;
CREATE TRIGGER set_announcements_updated_at
    BEFORE UPDATE ON public.announcements
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4.3. Funções Utilitárias de Verificação de Permissão (SECURITY DEFINER para evitar recursão em RLS)
CREATE OR REPLACE FUNCTION public.is_hub_member(p_hub_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.hub_members 
        WHERE hub_id = p_hub_id AND user_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_hub_admin(p_hub_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.hub_members 
        WHERE hub_id = p_hub_id AND user_id = p_user_id AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.can_edit_tasks(p_hub_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.hub_members 
        WHERE hub_id = p_hub_id AND user_id = p_user_id AND role IN ('admin', 'colaborador')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==============================================================================
-- 5. TRIGGERS AUTOMÁTICOS PRINCIPAIS
-- ==============================================================================

-- 5.1. TRIGGER 1: handle_new_user (Cria perfil automaticamente no cadastro)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_full_name TEXT;
    v_avatar_url TEXT;
BEGIN
    -- Extrai nome completo dos metadados de autenticação do Supabase
    v_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1),
        'Usuário'
    );
    
    -- Extrai avatar dos metadados (se houver, ex: Google/GitHub auth)
    v_avatar_url := NEW.raw_user_meta_data->>'avatar_url';

    INSERT INTO public.profiles (id, email, full_name, avatar_url, theme_preference, accent_color)
    VALUES (
        NEW.id,
        NEW.email,
        v_full_name,
        v_avatar_url,
        'dark',
        '#6366f1'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
        updated_at = now();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 5.2. TRIGGER 2: handle_new_hub (Adiciona dono como Admin e cria 4 colunas padrão do Kanban)
CREATE OR REPLACE FUNCTION public.handle_new_hub()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Insere o criador do Hub na tabela hub_members com a role 'admin'
    INSERT INTO public.hub_members (hub_id, user_id, role)
    VALUES (NEW.id, NEW.owner_id, 'admin')
    ON CONFLICT (hub_id, user_id) DO UPDATE SET role = 'admin';

    -- 2. Cria automaticamente as 4 colunas padrão do Kanban
    INSERT INTO public.kanban_columns (hub_id, title, order_index, color)
    VALUES
        (NEW.id, 'Nova Tarefa', 0, '#3b82f6'),
        (NEW.id, 'Em Andamento', 1, '#eab308'),
        (NEW.id, 'Revisado', 2, '#a855f7'),
        (NEW.id, 'Finalizado', 3, '#22c55e');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_hub_created ON public.hubs;
CREATE TRIGGER on_hub_created
    AFTER INSERT ON public.hubs
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_hub();

-- ==============================================================================
-- 6. POLÍTICAS DE SEGURANÇA RLS (ROW LEVEL SECURITY)
-- ==============================================================================

-- Habilita RLS em todas as 10 tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hub_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hub_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 6.1. POLÍTICAS: PROFILES
-- ------------------------------------------------------------------------------
-- Qualquer usuário autenticado pode ver perfis públicos
CREATE POLICY "Profiles são visíveis por usuários autenticados"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

-- Usuários só podem atualizar seus próprios perfis
CREATE POLICY "Usuários podem atualizar seus próprios perfis"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 6.2. POLÍTICAS: HUBS
-- ------------------------------------------------------------------------------
-- Membros podem visualizar os hubs dos quais participam, ou usuários podem consultar por invite_code
CREATE POLICY "Membros e consultores de código podem ver hubs"
    ON public.hubs FOR SELECT
    TO authenticated
    USING (
        public.is_hub_member(id, auth.uid()) 
        OR owner_id = auth.uid()
        OR true -- Permite visualização básica pública para solicitação de entrada via código
    );

-- Usuários autenticados podem criar hubs
CREATE POLICY "Usuários autenticados podem criar hubs"
    ON public.hubs FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = owner_id);

-- Apenas admins do Hub podem atualizar ou deletar
CREATE POLICY "Admins podem atualizar seus hubs"
    ON public.hubs FOR UPDATE
    TO authenticated
    USING (public.is_hub_admin(id, auth.uid()) OR owner_id = auth.uid())
    WITH CHECK (public.is_hub_admin(id, auth.uid()) OR owner_id = auth.uid());

CREATE POLICY "Admins podem deletar seus hubs"
    ON public.hubs FOR DELETE
    TO authenticated
    USING (public.is_hub_admin(id, auth.uid()) OR owner_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 6.3. POLÍTICAS: HUB_MEMBERS
-- ------------------------------------------------------------------------------
-- Membros podem ver outros membros do mesmo Hub
CREATE POLICY "Membros podem ver companheiros de equipe no mesmo hub"
    ON public.hub_members FOR SELECT
    TO authenticated
    USING (public.is_hub_member(hub_id, auth.uid()));

-- Apenas admins podem adicionar membros manualmente
CREATE POLICY "Admins podem adicionar membros"
    ON public.hub_members FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_hub_admin(hub_id, auth.uid()) 
        OR EXISTS (SELECT 1 FROM public.hubs WHERE id = hub_id AND owner_id = auth.uid())
    );

-- Apenas admins podem alterar roles ou remover membros (ou o próprio membro sair)
CREATE POLICY "Admins podem atualizar membros"
    ON public.hub_members FOR UPDATE
    TO authenticated
    USING (public.is_hub_admin(hub_id, auth.uid()));

CREATE POLICY "Admins podem remover membros ou usuário pode sair"
    ON public.hub_members FOR DELETE
    TO authenticated
    USING (public.is_hub_admin(hub_id, auth.uid()) OR user_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 6.4. POLÍTICAS: HUB_JOIN_REQUESTS
-- ------------------------------------------------------------------------------
-- O próprio solicitante ou os admins do hub podem visualizar solicitações
CREATE POLICY "Visualizar solicitações de entrada"
    ON public.hub_join_requests FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR public.is_hub_admin(hub_id, auth.uid()));

-- Qualquer usuário autenticado pode solicitar entrada para si mesmo
CREATE POLICY "Criar solicitação de entrada"
    ON public.hub_join_requests FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Admins do hub podem atualizar (aprovar/rejeitar) solicitações
CREATE POLICY "Admins podem atualizar status da solicitação"
    ON public.hub_join_requests FOR UPDATE
    TO authenticated
    USING (public.is_hub_admin(hub_id, auth.uid()))
    WITH CHECK (public.is_hub_admin(hub_id, auth.uid()));

-- Admins ou o solicitante podem deletar a solicitação
CREATE POLICY "Deletar solicitação de entrada"
    ON public.hub_join_requests FOR DELETE
    TO authenticated
    USING (user_id = auth.uid() OR public.is_hub_admin(hub_id, auth.uid()));

-- ------------------------------------------------------------------------------
-- 6.5. POLÍTICAS: KANBAN_COLUMNS
-- ------------------------------------------------------------------------------
-- Membros do Hub podem visualizar as colunas
CREATE POLICY "Membros podem ver colunas do Kanban"
    ON public.kanban_columns FOR SELECT
    TO authenticated
    USING (public.is_hub_member(hub_id, auth.uid()));

-- Admins e colaboradores podem gerenciar colunas
CREATE POLICY "Admins e colaboradores podem criar colunas"
    ON public.kanban_columns FOR INSERT
    TO authenticated
    WITH CHECK (public.can_edit_tasks(hub_id, auth.uid()));

CREATE POLICY "Admins e colaboradores podem atualizar colunas"
    ON public.kanban_columns FOR UPDATE
    TO authenticated
    USING (public.can_edit_tasks(hub_id, auth.uid()))
    WITH CHECK (public.can_edit_tasks(hub_id, auth.uid()));

CREATE POLICY "Admins podem deletar colunas"
    ON public.kanban_columns FOR DELETE
    TO authenticated
    USING (public.is_hub_admin(hub_id, auth.uid()));

-- ------------------------------------------------------------------------------
-- 6.6. POLÍTICAS: TASKS
-- ------------------------------------------------------------------------------
-- Membros do Hub podem visualizar as tarefas
CREATE POLICY "Membros podem ver tarefas do Hub"
    ON public.tasks FOR SELECT
    TO authenticated
    USING (public.is_hub_member(hub_id, auth.uid()));

-- Admins e colaboradores podem criar tarefas
CREATE POLICY "Admins e colaboradores podem criar tarefas"
    ON public.tasks FOR INSERT
    TO authenticated
    WITH CHECK (public.can_edit_tasks(hub_id, auth.uid()) AND auth.uid() = created_by);

-- Admins e colaboradores podem atualizar tarefas (mover, editar)
CREATE POLICY "Admins e colaboradores podem atualizar tarefas"
    ON public.tasks FOR UPDATE
    TO authenticated
    USING (public.can_edit_tasks(hub_id, auth.uid()))
    WITH CHECK (public.can_edit_tasks(hub_id, auth.uid()));

-- Admins ou o criador da tarefa podem deletar
CREATE POLICY "Criador ou admin pode deletar tarefas"
    ON public.tasks FOR DELETE
    TO authenticated
    USING (public.is_hub_admin(hub_id, auth.uid()) OR created_by = auth.uid());

-- ------------------------------------------------------------------------------
-- 6.7. POLÍTICAS: TASK_CHECKLISTS
-- ------------------------------------------------------------------------------
-- Membros com acesso à tarefa podem ver checklists
CREATE POLICY "Membros podem ver checklists das tarefas"
    ON public.task_checklists FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.tasks t
            WHERE t.id = task_checklists.task_id 
            AND public.is_hub_member(t.hub_id, auth.uid())
        )
    );

-- Membros com permissão de edição podem criar checklists
CREATE POLICY "Colaboradores e admins podem criar itens no checklist"
    ON public.task_checklists FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tasks t
            WHERE t.id = task_checklists.task_id 
            AND public.can_edit_tasks(t.hub_id, auth.uid())
        )
    );

-- Membros com permissão podem atualizar checklists (marcar como feito)
CREATE POLICY "Colaboradores e admins podem atualizar itens do checklist"
    ON public.task_checklists FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.tasks t
            WHERE t.id = task_checklists.task_id 
            AND public.can_edit_tasks(t.hub_id, auth.uid())
        )
    );

-- Membros com permissão podem excluir itens do checklist
CREATE POLICY "Colaboradores e admins podem excluir itens do checklist"
    ON public.task_checklists FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.tasks t
            WHERE t.id = task_checklists.task_id 
            AND public.can_edit_tasks(t.hub_id, auth.uid())
        )
    );

-- ------------------------------------------------------------------------------
-- 6.8. POLÍTICAS: TASK_COMMENTS
-- ------------------------------------------------------------------------------
-- Membros do hub podem visualizar comentários
CREATE POLICY "Membros podem ver comentários da tarefa"
    ON public.task_comments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.tasks t
            WHERE t.id = task_comments.task_id 
            AND public.is_hub_member(t.hub_id, auth.uid())
        )
    );

-- Membros do hub podem inserir comentários
CREATE POLICY "Membros podem comentar na tarefa"
    ON public.task_comments FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.tasks t
            WHERE t.id = task_comments.task_id 
            AND public.can_edit_tasks(t.hub_id, auth.uid())
        )
    );

-- Autor do comentário ou admin pode atualizar ou deletar comentário
CREATE POLICY "Autor do comentário pode editar seu comentário"
    ON public.task_comments FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Autor do comentário ou admin pode deletar comentário"
    ON public.task_comments FOR DELETE
    TO authenticated
    USING (
        user_id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM public.tasks t
            WHERE t.id = task_comments.task_id 
            AND public.is_hub_admin(t.hub_id, auth.uid())
        )
    );

-- ------------------------------------------------------------------------------
-- 6.9. POLÍTICAS: ANNOUNCEMENTS
-- ------------------------------------------------------------------------------
-- Membros do hub podem ver avisos
CREATE POLICY "Membros podem ver avisos do Hub"
    ON public.announcements FOR SELECT
    TO authenticated
    USING (public.is_hub_member(hub_id, auth.uid()));

-- Apenas admins podem criar avisos
CREATE POLICY "Admins podem criar avisos"
    ON public.announcements FOR INSERT
    TO authenticated
    WITH CHECK (public.is_hub_admin(hub_id, auth.uid()) AND author_id = auth.uid());

-- Admins podem atualizar e deletar avisos
CREATE POLICY "Admins podem atualizar avisos"
    ON public.announcements FOR UPDATE
    TO authenticated
    USING (public.is_hub_admin(hub_id, auth.uid()))
    WITH CHECK (public.is_hub_admin(hub_id, auth.uid()));

CREATE POLICY "Admins podem deletar avisos"
    ON public.announcements FOR DELETE
    TO authenticated
    USING (public.is_hub_admin(hub_id, auth.uid()));

-- ------------------------------------------------------------------------------
-- 6.10. POLÍTICAS: DIRECT_MESSAGES
-- ------------------------------------------------------------------------------
-- DMs são estritamente restritas a quem enviou (sender_id) ou recebeu (receiver_id)
CREATE POLICY "Usuários só podem ler suas próprias mensagens diretas"
    ON public.direct_messages FOR SELECT
    TO authenticated
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Usuários podem enviar mensagens para outros membros do mesmo hub
CREATE POLICY "Membros podem enviar mensagens no hub"
    ON public.direct_messages FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = sender_id 
        AND public.is_hub_member(hub_id, auth.uid())
        AND public.is_hub_member(hub_id, receiver_id)
    );

-- Destinatário pode marcar mensagem como lida
CREATE POLICY "Destinatário pode atualizar status de leitura da mensagem"
    ON public.direct_messages FOR UPDATE
    TO authenticated
    USING (auth.uid() = receiver_id)
    WITH CHECK (auth.uid() = receiver_id);

-- Remetente pode deletar sua própria mensagem
CREATE POLICY "Remetente pode deletar sua mensagem"
    ON public.direct_messages FOR DELETE
    TO authenticated
    USING (auth.uid() = sender_id);

-- ==============================================================================
-- 7. CONFIGURAÇÃO DE REALTIME (SUPABASE PUBLICATION)
-- ==============================================================================
-- Habilita escuta em tempo real nas tabelas interativas
DO $$
BEGIN
    -- Adiciona tabelas à publicação realtime caso ainda não estejam adicionadas
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'tasks') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'task_comments') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.task_comments;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'task_checklists') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.task_checklists;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'kanban_columns') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.kanban_columns;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'announcements') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'direct_messages') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
    END IF;
END $$;
