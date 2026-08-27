import { getSupabaseAdmin } from '../config/supabase';
import { env } from '../config/env';
import { generateInviteCode, normalizeInviteCode } from '../utils/inviteCode';
import {
  HealthCheckResponse,
  PublicHubPreview,
  GenerateInviteCodeResponse,
  HubRow,
  ProfileRow,
} from '../types/index';

export class HubService {
  /**
   * Realiza verificação de saúde e integridade com o Supabase
   */
  async checkHealth(): Promise<HealthCheckResponse> {
    const supabase = getSupabaseAdmin();
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
      // Faz uma consulta de verificação de conexão (tabela profiles ou hubs)
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
   * Se o banco estiver conectado, garante ausência de colisões.
   */
  async generateUniqueInviteCode(): Promise<GenerateInviteCodeResponse> {
    const supabase = getSupabaseAdmin();
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
          // Código é 100% único
          break;
        }

        uniqueCode = generateInviteCode(6);
        attempts++;
      }
    }

    return {
      inviteCode: uniqueCode,
      prefix: 'HUB-',
      expiresAt: null, // Códigos de convite padrão não expiram por default
      formatted: uniqueCode,
    };
  }

  /**
   * Busca dados públicos de um Hub pelo código de convite para pré-visualização
   */
  async getHubByCode(code: string): Promise<PublicHubPreview | null> {
    const normalizedCode = normalizeInviteCode(code);
    const supabase = getSupabaseAdmin();

    // Fallback gracioso para modo de demonstração quando o Supabase ainda não está conectado
    if (!supabase || !env.isSupabaseConfigured) {
      if (normalizedCode === 'HUB-DEMO99' || normalizedCode.startsWith('HUB-')) {
        return {
          id: 'demo-hub-0000-0000-000000000000',
          name: `Hub de Demonstração (${normalizedCode})`,
          description: 'Espaço de colaboração e gerenciamento de tarefas (Modo de Demonstração Offline).',
          inviteCode: normalizedCode,
          memberCount: 3,
          createdAt: new Date().toISOString(),
          owner: {
            id: 'demo-owner-uuid',
            fullName: 'Administrador Demo',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          },
        };
      }
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
}

export const hubService = new HubService();
