export type UserRole = 'admin' | 'owner' | 'viewer';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentVersion {
  id: string;
  version_number: number;
  original_filename: string;
  file_size_bytes: number;
  mime_type: string;
  sha256_hash: string;
  change_summary?: string;
  created_by: string;
  created_at: string;
}

export interface DocumentPermission {
  id: string;
  document_id: string;
  user_id: string;
  user_email?: string;
  user_full_name?: string;
  permission: 'READ' | 'EDIT';
  granted_by: string;
  granter_email?: string;
  granted_at: string;
  updated_at: string;
  revoked_at?: string | null;
}

export interface DocumentItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  tags?: string;
  sensitivity: 'Confidential' | 'Restricted' | 'Internal' | 'Public';
  owner_id: string;
  owner_email?: string;
  owner_name?: string;
  original_filename: string;
  file_size_bytes: number;
  mime_type: string;
  sha256_hash: string;
  current_version: number;
  is_deleted: boolean;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
  user_effective_permission?: 'OWNER' | 'EDIT' | 'READ' | null;
}

export interface DocumentDetail extends DocumentItem {
  permissions: DocumentPermission[];
  versions: DocumentVersion[];
}

export interface DocumentListResponse {
  items: DocumentItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AuditEvent {
  id: string;
  sequence_number: number;
  timestamp: string;
  actor_id?: string;
  actor_email?: string;
  actor_role?: string;
  action: string;
  target_resource_type: string;
  target_resource_id?: string;
  outcome: 'SUCCESS' | 'DENIED' | 'FAILED';
  request_correlation_id?: string;
  ip_address?: string;
  user_agent?: string;
  metadata_json: string;
  prev_event_hash: string;
  event_hash: string;
}

export interface AuditExplorerResponse {
  items: AuditEvent[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AuditIntegrityReport {
  is_valid: boolean;
  status: string;
  total_events_checked: number;
  first_sequence?: number | null;
  last_sequence?: number | null;
  last_event_hash?: string | null;
  issues: string[];
  verified_at: string;
}

export interface AdminStats {
  users: {
    total: number;
    active: number;
    disabled: number;
  };
  documents: {
    total: number;
    deleted: number;
  };
  activity_24h: {
    uploads: number;
    downloads: number;
    denied_attempts: number;
    permission_changes: number;
  };
  integrity: {
    is_valid: boolean;
    status: string;
    total_events: number;
    last_event_hash?: string;
  };
  activity_chart: Array<{
    date: string;
    success: number;
    denied: number;
  }>;
}
