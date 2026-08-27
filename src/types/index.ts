import { Database } from './database.types';

export * from './database.types';

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type HubRow = Database['public']['Tables']['hubs']['Row'];
export type HubMemberRow = Database['public']['Tables']['hub_members']['Row'];
export type TaskRow = Database['public']['Tables']['tasks']['Row'];
export type KanbanColumnRow = Database['public']['Tables']['kanban_columns']['Row'];
export type AnnouncementRow = Database['public']['Tables']['announcements']['Row'];
export type DirectMessageRow = Database['public']['Tables']['direct_messages']['Row'];

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string | Record<string, unknown>;
  meta?: Record<string, unknown>;
}

export interface ApiInfoResponse {
  name: string;
  description: string;
  version: string;
  environment: string;
  uptime: number;
  timestamp: string;
  endpoints: {
    method: string;
    path: string;
    description: string;
  }[];
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  timestamp: string;
  environment: string;
  nodeVersion: string;
  database: {
    configured: boolean;
    connected: boolean;
    latencyMs?: number;
    message?: string;
  };
}

export interface GenerateInviteCodeResponse {
  inviteCode: string;
  prefix: string;
  expiresAt: string | null;
  formatted: string;
}

export interface PublicHubPreview {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  memberCount: number;
  createdAt: string;
  owner: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
}
