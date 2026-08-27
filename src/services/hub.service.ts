import { getSupabaseAdmin, getSupabase } from '../config/supabase';
import { env } from '../config/env';
import { generateInviteCode, normalizeInviteCode, isValidInviteCode } from '../utils/inviteCode';
import {
  HealthCheckResponse,
  PublicHubPreview,
  GenerateInviteCodeResponse,
  HubRow,
  ProfileRow,
  CreateHubDTO,
  UserHubSummary,
  UserRole,
} from '../types/index';

export class HubService {
  /**
   * Realiza verificação de saúde e integridade com o Supabase
   */
  async checkHealth(): Promise<HealthCheckResponse> {
    const supabase = getSupabaseAdmin() || getSupabase();
    const startTime = Date.now();

    if (!supabase || !env.isSupabaseConfigured) {
      return {
        status: 'degraded',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: env.NODE_ENV,
        nodeVersion: process.version,
        database: {
          configured: false,
          connected: false,
          message: 'Supabase URL/Key não configurados no arquivo .env.',
        },
      };
    }

    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      const latencyMs = Date.now() - startTime;

      if (error && error.code !== 'PGRST116') {
        return {
          status: 'degraded',
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
          environment: env.NODE_ENV,
          nodeVersion: process.version,
          database: {
            configured: true,
            connected: false,
            latencyMs,
            message: `Erro na comunicação com o Supabase: ${error.message}`,
          },
        };
      }

      return {
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: env.NODE_ENV,
        nodeVersion: process.version,
        database: {
          configured: true,
          connected: true,
          latencyMs,
          message: 'Conexão com PostgreSQL/Supabase estabelecida com sucesso.',
        },
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      return {
        status: 'unhealthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: env.NODE_ENV,
        nodeVersion: process.version,
        database: {
          configured: true,
          connected: false,
          latencyMs: Date.now() - startTime,
          message: `Falha crítica ao conectar ao Supabase: ${errorMsg}`,
        },
      };
    }
  }

  /**
   * Gera um código de convite único no formato 'HUB-XXXXXX'
   * Garante ausência de colisões no banco de dados
   */
  async generateUniqueInviteCode(): Promise<GenerateInviteCodeResponse> {
    const supabase = getSupabaseAdmin() || getSupabase();
    let uniqueCode = generateInviteCode(6);

    if (supabase && env.isSupabaseConfigured) {
      let attempts = 0;
      const maxAttempts = 5;

      while (attempts < maxAttempts) {
        const { data } = await supabase
          .from('hubs')
          .select('id')
          .eq('invite_code', uniqueCode)
          .maybeSingle();

        if (!data) {
          break;
        }

        uniqueCode = generateInviteCode(6);
        attempts++;
      }
    }

    return {
      inviteCode: uniqueCode,
      prefix: 'HUB-',
      expiresAt: null,
      formatted: uniqueCode,
    };
  }

  /**
   * Busca dados públicos de um Hub pelo código de convite para pré-visualização
   */
  async getHubByCode(code: string): Promise<PublicHubPreview | null> {
    const normalizedCode = normalizeInviteCode(code);
    const supabase = getSupabaseAdmin() || getSupabase();

    if (!supabase || !env.isSupabaseConfigured) {
      return null;
    }

    try {
      // 1. Busca o hub pelo invite_code
      const { data, error: hubError } = await supabase
        .from('hubs')
        .select('*')
        .eq('invite_code', normalizedCode)
        .maybeSingle();

      const hub = data as (HubRow & { owner_id: string }) | null;

      if (hubError || !hub) {
        return null;
      }

      // 2. Busca informações do proprietário (profiles)
      const { data: ownerData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', hub.owner_id)
        .maybeSingle();

      const ownerProfile = ownerData as ProfileRow | null;

      // 3. Conta número de membros ativos
      const { count: memberCount } = await supabase
        .from('hub_members')
        .select('*', { count: 'exact', head: true })
        .eq('hub_id', hub.id);

      return {
        id: hub.id,
        name: hub.name,
        description: hub.description,
        inviteCode: hub.invite_code,
        memberCount: memberCount || 1,
        createdAt: hub.created_at,
        owner: {
          id: ownerProfile?.id || hub.owner_id,
          fullName: ownerProfile?.full_name || 'Proprietário do Hub',
          avatarUrl: ownerProfile?.avatar_url || null,
        },
      };
    } catch (error) {
      console.error('Erro ao consultar Hub por código:', error);
      return null;
    }
  }

  /**
   * Cria um novo Grupo Empresarial (Hub) para o usuário autenticado
   */
  async createHub(ownerId: string, dto: CreateHubDTO): Promise<UserHubSummary> {
    const supabase = getSupabaseAdmin() || getSupabase();

    if (!supabase || !env.isSupabaseConfigured) {
      throw new Error('Supabase não configurado. Verifique as credenciais no .env.');
    }

    const { name, description } = dto;

    if (!name || name.trim().length < 2) {
      throw new Error('O nome do grupo empresarial deve conter pelo menos 2 caracteres.');
    }

    // 1. Gera código de convite único
    const codeResult = await this.generateUniqueInviteCode();
    const inviteCode = codeResult.inviteCode;

    // 2. Insere o Hub no banco de dados
    const { data: hubData, error: hubError } = await supabase
      .from('hubs')
      .insert({
        name: name.trim(),
        description: description ? description.trim() : null,
        invite_code: inviteCode,
        owner_id: ownerId,
      })
      .select('*')
      .single();

    if (hubError || !hubData) {
      throw new Error(`Falha ao criar o grupo empresarial: ${hubError?.message || 'Erro desconhecido'}`);
    }

    const newHub = hubData as HubRow;

    // 3. Garante associação na tabela hub_members como admin
    await supabase.from('hub_members').upsert(
      {
        hub_id: newHub.id,
        user_id: ownerId,
        role: 'admin' as UserRole,
      },
      { onConflict: 'hub_id,user_id' }
    );

    // 4. Garante criação das 4 colunas padrão do Kanban (caso o trigger não tenha criado)
    const { count: colCount } = await supabase
      .from('kanban_columns')
      .select('*', { count: 'exact', head: true })
      .eq('hub_id', newHub.id);

    if (!colCount || colCount === 0) {
      await supabase.from('kanban_columns').insert([
        { hub_id: newHub.id, title: 'Nova Tarefa', order_index: 0, color: '#3b82f6' },
        { hub_id: newHub.id, title: 'Em Andamento', order_index: 1, color: '#eab308' },
        { hub_id: newHub.id, title: 'Revisado', order_index: 2, color: '#a855f7' },
        { hub_id: newHub.id, title: 'Finalizado', order_index: 3, color: '#22c55e' },
      ]);
    }

    // 5. Busca dados do proprietário
    const { data: rawOwner } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .eq('id', ownerId)
      .maybeSingle();

    const ownerProfile = rawOwner as ProfileRow | null;

    return {
      id: newHub.id,
      name: newHub.name,
      description: newHub.description,
      inviteCode: newHub.invite_code,
      role: 'admin',
      isOwner: true,
      memberCount: 1,
      createdAt: newHub.created_at,
      updatedAt: newHub.updated_at,
      owner: {
        id: ownerId,
        fullName: ownerProfile?.full_name || 'Proprietário',
        avatarUrl: ownerProfile?.avatar_url || null,
      },
    };
  }

  /**
   * Retorna todos os grupos empresariais aos quais o usuário pertence ou é dono
   */
  async getUserHubs(userId: string): Promise<UserHubSummary[]> {
    const supabase = getSupabaseAdmin() || getSupabase();

    if (!supabase || !env.isSupabaseConfigured) {
      return [];
    }

    // 1. Busca os registros de associação do usuário
    const { data: rawMemberships, error: memError } = await supabase
      .from('hub_members')
      .select('hub_id, role')
      .eq('user_id', userId);

    if (memError) {
      console.error('Erro ao buscar grupos do usuário:', memError.message);
      return [];
    }

    const memberships = (rawMemberships || []) as { hub_id: string; role: string }[];

    // Busca também hubs onde o usuário é owner_id (caso ainda não esteja listado em hub_members)
    const { data: rawOwnedHubs } = await supabase
      .from('hubs')
      .select('id')
      .eq('owner_id', userId);

    const ownedHubs = (rawOwnedHubs || []) as { id: string }[];

    const hubIdMap = new Map<string, UserRole>();

    if (memberships) {
      memberships.forEach((m) => {
        hubIdMap.set(m.hub_id, m.role as UserRole);
      });
    }

    if (ownedHubs) {
      ownedHubs.forEach((h) => {
        if (!hubIdMap.has(h.id)) {
          hubIdMap.set(h.id, 'admin');
        }
      });
    }

    const hubIds = Array.from(hubIdMap.keys());

    if (hubIds.length === 0) {
      return [];
    }

    // 2. Busca os detalhes dos hubs
    const { data: rawHubs, error: hubsError } = await supabase
      .from('hubs')
      .select('*')
      .in('id', hubIds)
      .order('created_at', { ascending: false });

    if (hubsError || !rawHubs) {
      return [];
    }

    const hubs = rawHubs as HubRow[];

    // 3. Monta a lista consolidada com contagem de membros e dados do proprietário
    const result: UserHubSummary[] = [];

    for (const hub of hubs) {
      const role = hubIdMap.get(hub.id) || (hub.owner_id === userId ? 'admin' : 'colaborador');
      const isOwner = hub.owner_id === userId;

      const { count: memberCount } = await supabase
        .from('hub_members')
        .select('*', { count: 'exact', head: true })
        .eq('hub_id', hub.id);

      const { data: rawOwner } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', hub.owner_id)
        .maybeSingle();

      const ownerProfile = rawOwner as ProfileRow | null;

      result.push({
        id: hub.id,
        name: hub.name,
        description: hub.description,
        inviteCode: hub.invite_code,
        role: role as UserRole,
        isOwner,
        memberCount: memberCount || 1,
        createdAt: hub.created_at,
        updatedAt: hub.updated_at,
        owner: {
          id: hub.owner_id,
          fullName: ownerProfile?.full_name || 'Proprietário',
          avatarUrl: ownerProfile?.avatar_url || null,
        },
      });
    }

    return result;
  }

  /**
   * Permite que um usuário autenticado entre em um grupo empresarial usando código de convite
   */
  async joinHubByInviteCode(userId: string, code: string): Promise<UserHubSummary> {
    const supabase = getSupabaseAdmin() || getSupabase();

    if (!supabase || !env.isSupabaseConfigured) {
      throw new Error('Supabase não configurado.');
    }

    const normalizedCode = normalizeInviteCode(code);

    if (!isValidInviteCode(normalizedCode)) {
      throw new Error(`Código de convite inválido: "${code}". Use o formato HUB-XXXXXX.`);
    }

    // 1. Localiza o hub pelo código
    const { data: hubData, error: hubError } = await supabase
      .from('hubs')
      .select('*')
      .eq('invite_code', normalizedCode)
      .maybeSingle();

    const hub = hubData as HubRow | null;

    if (hubError || !hub) {
      throw new Error(`Nenhum grupo empresarial encontrado com o código "${normalizedCode}".`);
    }

    // 2. Verifica se o usuário já é membro
    const { data: rawExistingMember } = await supabase
      .from('hub_members')
      .select('role')
      .eq('hub_id', hub.id)
      .eq('user_id', userId)
      .maybeSingle();

    const existingMember = rawExistingMember as { role: string } | null;

    if (existingMember) {
      const userRole = existingMember.role as UserRole;
      const { count: memberCount } = await supabase
        .from('hub_members')
        .select('*', { count: 'exact', head: true })
        .eq('hub_id', hub.id);

      const { data: rawOwner } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', hub.owner_id)
        .maybeSingle();

      const ownerProfile = rawOwner as ProfileRow | null;

      return {
        id: hub.id,
        name: hub.name,
        description: hub.description,
        inviteCode: hub.invite_code,
        role: userRole,
        isOwner: hub.owner_id === userId,
        memberCount: memberCount || 1,
        createdAt: hub.created_at,
        updatedAt: hub.updated_at,
        owner: {
          id: hub.owner_id,
          fullName: ownerProfile?.full_name || 'Proprietário',
          avatarUrl: ownerProfile?.avatar_url || null,
        },
      };
    }

    // 3. Adiciona o usuário como colaborador no grupo
    const { error: insertMemberError } = await supabase.from('hub_members').insert({
      hub_id: hub.id,
      user_id: userId,
      role: 'colaborador' as UserRole,
    });

    if (insertMemberError) {
      throw new Error(`Falha ao ingressar no grupo: ${insertMemberError.message}`);
    }

    const { count: updatedMemberCount } = await supabase
      .from('hub_members')
      .select('*', { count: 'exact', head: true })
      .eq('hub_id', hub.id);

    const { data: rawOwner } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .eq('id', hub.owner_id)
      .maybeSingle();

    const ownerProfile = rawOwner as ProfileRow | null;

    return {
      id: hub.id,
      name: hub.name,
      description: hub.description,
      inviteCode: hub.invite_code,
      role: 'colaborador',
      isOwner: hub.owner_id === userId,
      memberCount: updatedMemberCount || 1,
      createdAt: hub.created_at,
      updatedAt: hub.updated_at,
      owner: {
        id: hub.owner_id,
        fullName: ownerProfile?.full_name || 'Proprietário',
        avatarUrl: ownerProfile?.avatar_url || null,
      },
    };
  }
}

export const hubService = new HubService();
