import { create } from 'zustand';
import { AccessEntry, AccessRequest, AuditLog, CurrentUser } from '../types';
import { MOCK_ACCESS_ENTRIES } from '../data/accessMatrix';
import { MOCK_REQUESTS } from '../data/requests';
import { MOCK_AUDIT_LOGS } from '../data/auditLogs';

interface AppState {
  // Current session user (for role-based UI)
  currentUser: CurrentUser;
  setCurrentUser: (user: CurrentUser) => void;

  // Access entries
  accessEntries: AccessEntry[];
  updateAccessEntry: (userId: string, resourceId: string, level: AccessEntry['accessLevel']) => void;

  // Requests
  requests: AccessRequest[];
  submitRequest: (req: Omit<AccessRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => void;
  approveRequest: (id: string, reviewerId: string, comment: string) => void;
  rejectRequest: (id: string, reviewerId: string, comment: string) => void;

  // Audit logs
  auditLogs: AuditLog[];
  addAuditLog: (log: Omit<AuditLog, 'id'>) => void;

  // UI state
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

  accessEntries: MOCK_ACCESS_ENTRIES,
  updateAccessEntry: (userId, resourceId, level) =>
    set((state) => {
      const exists = state.accessEntries.find(
        (e) => e.userId === userId && e.resourceId === resourceId
      );
      if (exists) {
        return {
          accessEntries: state.accessEntries.map((e) =>
            e.userId === userId && e.resourceId === resourceId
              ? { ...e, accessLevel: level }
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
            resourceType: 'table',
            accessLevel: level,
            grantedBy: get().currentUser.id,
            grantedAt: new Date().toISOString(),
          },
        ],
      };
    }),

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
          ? {
              ...r,
              status: 'approved',
              reviewerId,
              reviewerComment: comment,
              updatedAt: new Date().toISOString(),
            }
          : r
      ),
    }));
    const req = get().requests.find((r) => r.id === id);
    if (req) {
      get().updateAccessEntry(req.targetUserId, req.resourceId, req.accessLevel);
      get().addAuditLog({
        action: 'request_approved',
        actorId: reviewerId,
        targetUserId: req.targetUserId,
        resourceId: req.resourceId,
        resourceName: req.resourceName,
        before: 'none',
        after: req.accessLevel,
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
          ? {
              ...r,
              status: 'rejected',
              reviewerId,
              reviewerComment: comment,
              updatedAt: new Date().toISOString(),
            }
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

  auditLogs: MOCK_AUDIT_LOGS,
  addAuditLog: (log) =>
    set((state) => ({
      auditLogs: [{ ...log, id: `al${Date.now()}` }, ...state.auditLogs],
    })),

  sidebarCollapsed: false,
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));
