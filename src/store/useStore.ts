import { create } from 'zustand';
import { AccessEntry, AccessRequest, AuditLog, CurrentUser, DataSource, Permission } from '../types';
import { MOCK_ACCESS_ENTRIES } from '../data/accessMatrix';
import { MOCK_REQUESTS } from '../data/requests';
import { MOCK_AUDIT_LOGS } from '../data/auditLogs';
import { MOCK_DATA_SOURCES } from '../data/dataSources';

interface AppState {
  currentUser: CurrentUser;
  setCurrentUser: (user: CurrentUser) => void;

  // Access entries
  accessEntries: AccessEntry[];
  togglePermission: (userId: string, resourceId: string, permission: Permission) => void;
  grantAccess: (userId: string, resourceId: string, resourceType: 'table' | 'report', permissions: Permission[]) => void;
  revokeResource: (userId: string, resourceId: string) => void;

  // Requests
  requests: AccessRequest[];
  submitRequest: (req: Omit<AccessRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => void;
  approveRequest: (id: string, reviewerId: string, comment: string) => void;
  rejectRequest: (id: string, reviewerId: string, comment: string) => void;

  // Audit logs
  auditLogs: AuditLog[];
  addAuditLog: (log: Omit<AuditLog, 'id'>) => void;

  // Data sources
  dataSources: DataSource[];
  addDataSource: (ds: Omit<DataSource, 'id' | 'lastSync'>) => void;

  // UI
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

const ADMIN_USER: CurrentUser = {
  id: 'u4',
  name: 'David Kim',
  role: 'admin',
  avatar: 'DK',
};

export const useStore = create<AppState>((set, get) => ({
  currentUser: ADMIN_USER,
  setCurrentUser: (user) => set({ currentUser: user }),

  // ── Access entries ──────────────────────────────────────────────────────────
  accessEntries: MOCK_ACCESS_ENTRIES,

  togglePermission: (userId, resourceId, permission) =>
    set((state) => {
      const entry = state.accessEntries.find(
        (e) => e.userId === userId && e.resourceId === resourceId
      );
      if (!entry) return state; // entry must exist first (use grantAccess to create)
      const has = entry.permissions.includes(permission);
      const next = has
        ? entry.permissions.filter((p) => p !== permission)
        : [...entry.permissions, permission];
      return {
        accessEntries: state.accessEntries.map((e) =>
          e.userId === userId && e.resourceId === resourceId
            ? { ...e, permissions: next }
            : e
        ),
      };
    }),

  grantAccess: (userId, resourceId, resourceType, permissions) =>
    set((state) => {
      const exists = state.accessEntries.find(
        (e) => e.userId === userId && e.resourceId === resourceId
      );
      if (exists) {
        // Merge permissions
        const merged = Array.from(new Set([...exists.permissions, ...permissions])) as Permission[];
        return {
          accessEntries: state.accessEntries.map((e) =>
            e.userId === userId && e.resourceId === resourceId
              ? { ...e, permissions: merged }
              : e
          ),
        };
      }
      return {
        accessEntries: [
          ...state.accessEntries,
          {
            userId,
            resourceId,
            resourceType,
            permissions,
            grantedBy: get().currentUser.id,
            grantedAt: new Date().toISOString(),
          },
        ],
      };
    }),

  revokeResource: (userId, resourceId) =>
    set((state) => ({
      accessEntries: state.accessEntries.filter(
        (e) => !(e.userId === userId && e.resourceId === resourceId)
      ),
    })),

  // ── Requests ────────────────────────────────────────────────────────────────
  requests: MOCK_REQUESTS,

  submitRequest: (req) => {
    const newReq: AccessRequest = {
      ...req,
      id: `req${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({ requests: [newReq, ...state.requests] }));
    get().addAuditLog({
      action: 'request_submitted',
      actorId: req.requesterId,
      targetUserId: req.targetUserId,
      resourceId: req.resourceId,
      resourceName: req.resourceName,
      before: 'none',
      after: req.accessLevel,
      timestamp: new Date().toISOString(),
      ipAddress: '10.0.1.1',
      details: `Access request submitted for ${req.resourceName}.`,
    });
  },

  approveRequest: (id, reviewerId, comment) => {
    set((state) => ({
      requests: state.requests.map((r) =>
        r.id === id
          ? { ...r, status: 'approved', reviewerId, reviewerComment: comment, updatedAt: new Date().toISOString() }
          : r
      ),
    }));
    const req = get().requests.find((r) => r.id === id);
    if (req) {
      if (req.requestType === 'revoke') {
        const ids = req.resourceIds?.length ? req.resourceIds : [req.resourceId];
        ids.forEach((rId) => get().revokeResource(req.targetUserId, rId));
      } else {
        const perms = (req.accessLevels && req.accessLevels.length > 0)
          ? req.accessLevels
          : [req.accessLevel as Permission];
        const ids = req.resourceIds?.length ? req.resourceIds : [req.resourceId];
        ids.forEach((rId) => get().grantAccess(req.targetUserId, rId, 'table', perms));
      }
      get().addAuditLog({
        action: req.requestType === 'revoke' ? 'access_revoked' : 'request_approved',
        actorId: reviewerId,
        targetUserId: req.targetUserId,
        resourceId: req.resourceId,
        resourceName: req.resourceName,
        before: req.requestType === 'revoke' ? 'granted' : 'none',
        after:  req.requestType === 'revoke' ? 'none'    : req.accessLevel,
        timestamp: new Date().toISOString(),
        ipAddress: '10.0.1.45',
        details: `Request ${id} approved. ${comment}`,
      });
    }
  },

  rejectRequest: (id, reviewerId, comment) => {
    set((state) => ({
      requests: state.requests.map((r) =>
        r.id === id
          ? { ...r, status: 'rejected', reviewerId, reviewerComment: comment, updatedAt: new Date().toISOString() }
          : r
      ),
    }));
    const req = get().requests.find((r) => r.id === id);
    if (req) {
      get().addAuditLog({
        action: 'request_rejected',
        actorId: reviewerId,
        targetUserId: req.targetUserId,
        resourceId: req.resourceId,
        resourceName: req.resourceName,
        timestamp: new Date().toISOString(),
        ipAddress: '10.0.1.45',
        details: `Request ${id} rejected. ${comment}`,
      });
    }
  },

  // ── Audit logs ──────────────────────────────────────────────────────────────
  auditLogs: MOCK_AUDIT_LOGS,
  addAuditLog: (log) =>
    set((state) => ({
      auditLogs: [{ ...log, id: `al${Date.now()}` }, ...state.auditLogs],
    })),

  // ── Data sources ─────────────────────────────────────────────────────────────
  dataSources: MOCK_DATA_SOURCES,
  addDataSource: (ds) =>
    set((state) => ({
      dataSources: [
        ...state.dataSources,
        { ...ds, id: `ds${Date.now()}`, lastSync: new Date().toISOString() },
      ],
    })),

  // ── UI ──────────────────────────────────────────────────────────────────────
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));
