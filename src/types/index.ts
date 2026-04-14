// ─── Users & Roles ───────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'data_analyst' | 'data_engineer' | 'viewer' | 'manager';

export interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  role: UserRole;
  avatar: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  createdAt: string;
}

// ─── Data Sources ─────────────────────────────────────────────────────────────

export type SystemType = 'redshift' | 'postgresql' | 'sqlserver' | 'powerbi';

export interface DataTable {
  id: string;
  name: string;
  columns: number;
  rows?: string;
}

export interface DataSchema {
  id: string;
  name: string;
  tables: DataTable[];
}

export interface DataDatabase {
  id: string;
  name: string;
  schemas: DataSchema[];
}

export interface PBIReport {
  id: string;
  name: string;
  type: 'report' | 'dashboard';
}

export interface PBIWorkspace {
  id: string;
  name: string;
  reports: PBIReport[];
}

export interface DataSource {
  id: string;
  name: string;
  type: SystemType;
  host?: string;
  status: 'connected' | 'disconnected' | 'error';
  databases?: DataDatabase[];
  workspaces?: PBIWorkspace[];
  lastSync: string;
}

// ─── Access Matrix ────────────────────────────────────────────────────────────

export type AccessLevel = 'none' | 'read' | 'write' | 'admin';

export interface AccessEntry {
  userId: string;
  resourceId: string; // tableId or reportId
  resourceType: 'table' | 'report';
  accessLevel: AccessLevel;
  grantedBy: string;
  grantedAt: string;
}

// ─── Access Requests ──────────────────────────────────────────────────────────

export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface AccessRequest {
  id: string;
  requesterId: string;
  targetUserId: string;
  systemType: SystemType;
  resourceId: string;
  resourceName: string;
  resourcePath: string; // e.g. "sales_db > public > orders"
  accessLevel: AccessLevel;
  reason: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  reviewerId?: string;
  reviewerComment?: string;
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

export type AuditAction =
  | 'access_granted'
  | 'access_revoked'
  | 'request_submitted'
  | 'request_approved'
  | 'request_rejected'
  | 'user_created'
  | 'role_assigned';

export interface AuditLog {
  id: string;
  action: AuditAction;
  actorId: string;
  targetUserId?: string;
  resourceId?: string;
  resourceName?: string;
  before?: string;
  after?: string;
  timestamp: string;
  ipAddress: string;
  details: string;
}

// ─── App State ────────────────────────────────────────────────────────────────

export interface CurrentUser {
  id: string;
  name: string;
  role: 'admin' | 'viewer';
  avatar: string;
}
