import React, { useState, useMemo } from 'react';
import {
  Search, Trash2, Users, ShieldCheck,
  Database, AlertTriangle,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { SystemBadge, UserStatusBadge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Permission, SystemType, User } from '../types';
import { MOCK_USERS } from '../data/users';
import { MOCK_DATA_SOURCES } from '../data/dataSources';
import { useStore } from '../store/useStore';

// ─── Resource catalog ─────────────────────────────────────────────────────────

interface ResourceMeta {
  id: string;
  name: string;
  path: string;
  system: string;
  systemType: SystemType;
  resourceType: 'table' | 'report';
}

function buildCatalog(): ResourceMeta[] {
  const result: ResourceMeta[] = [];
  for (const ds of MOCK_DATA_SOURCES) {
    if (ds.databases) {
      for (const db of ds.databases)
        for (const sch of db.schemas)
          for (const t of sch.tables)
            result.push({
              id: t.id, name: t.name,
              path: `${db.name} › ${sch.name}`,
              system: ds.name, systemType: ds.type,
              resourceType: 'table',
            });
    }
    if (ds.workspaces) {
      for (const ws of ds.workspaces)
        for (const rpt of ws.reports)
          result.push({
            id: rpt.id, name: rpt.name,
            path: ws.name,
            system: ds.name, systemType: ds.type,
            resourceType: 'report',
          });
    }
  }
  return result;
}

const CATALOG = buildCatalog();

const PERMISSIONS: Permission[] = ['read', 'write', 'admin'];

const PERM_STYLE: Record<Permission, { active: string; hover: string; label: string }> = {
  read:  { active: 'bg-blue-500   text-white', hover: 'hover:bg-blue-50   hover:text-blue-600   hover:border-blue-300',   label: 'Read'  },
  write: { active: 'bg-purple-500 text-white', hover: 'hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300', label: 'Write' },
  admin: { active: 'bg-red-500    text-white', hover: 'hover:bg-red-50    hover:text-red-600    hover:border-red-300',    label: 'Admin' },
};

// ─── Revoke Confirm Modal ─────────────────────────────────────────────────────

interface RevokeTarget {
  resourceId:   string;
  resourceName: string;
  resourcePath: string;
  systemType:   SystemType;
  resourceType: 'table' | 'report';
  permissions:  Permission[];
}

interface RevokeConfirmModalProps {
  target:    RevokeTarget;
  user:      User;
  onClose:   () => void;
  onConfirm: (comment: string) => void;
  loading:   boolean;
}

const RevokeConfirmModal: React.FC<RevokeConfirmModalProps> = ({
  target, user, onClose, onConfirm, loading,
}) => {
  const [comment, setComment] = useState('');

  return (
    <Modal
      open
      onClose={onClose}
      title="Request Access Removal"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            variant="danger"
            loading={loading}
            disabled={!comment.trim()}
            onClick={() => onConfirm(comment)}
          >
            Submit Removal Request
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Warning banner */}
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">Remove Access Request</p>
            <p className="text-xs text-red-600 mt-0.5">
              This will submit a removal request. Access will only be revoked after approval.
            </p>
          </div>
        </div>

        {/* Detail summary */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2.5 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">User</span>
            <div className="flex items-center gap-2">
              <Avatar initials={user.avatar} size="sm" />
              <span className="font-medium text-gray-800">{user.name}</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Resource</span>
            <div className="text-right">
              <p className="font-medium text-gray-800">{target.resourceName}</p>
              <p className="text-xs text-gray-400">{target.resourcePath}</p>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">System</span>
            <SystemBadge type={target.systemType} />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Current Permissions</span>
            <div className="flex gap-1">
              {target.permissions.map((p) => {
                const cls = {
                  read:  'bg-blue-100 text-blue-700',
                  write: 'bg-purple-100 text-purple-700',
                  admin: 'bg-red-100 text-red-700',
                }[p];
                return (
                  <span key={p} className={`px-2 py-0.5 rounded text-xs font-semibold capitalize ${cls}`}>
                    {p}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Reason for Removal <span className="text-red-500">*</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Explain why this access should be removed..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
            autoFocus
          />
          {!comment.trim() && (
            <p className="text-xs text-gray-400 mt-1">A reason is required to submit.</p>
          )}
        </div>
      </div>
    </Modal>
  );
};

// ─── Permission Toggle Chip ───────────────────────────────────────────────────

interface PermChipProps {
  permission: Permission;
  active: boolean;
  readonly: boolean;
  onToggle: () => void;
}

const PermChip: React.FC<PermChipProps> = ({ permission, active, readonly, onToggle }) => {
  const s = PERM_STYLE[permission];
  return (
    <button
      onClick={readonly ? undefined : onToggle}
      disabled={readonly}
      title={readonly ? permission : `Toggle ${permission}`}
      className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${
        active
          ? `${s.active} border-transparent`
          : `bg-white text-gray-400 border-gray-200 ${!readonly ? s.hover : ''} ${readonly ? 'cursor-default' : 'cursor-pointer'}`
      }`}
    >
      {s.label}
    </button>
  );
};

// ─── User Permission Table ────────────────────────────────────────────────────

interface UserDetailPanelProps {
  user: User;
  isAdmin: boolean;
}

const UserDetailPanel: React.FC<UserDetailPanelProps> = ({ user, isAdmin }) => {
  const { accessEntries, togglePermission, submitRequest, currentUser } = useStore();
  const [systemFilter, setSystemFilter] = useState<SystemType | 'all'>('all');
  const [revokeTarget, setRevokeTarget] = useState<RevokeTarget | null>(null);
  const [revokeLoading, setRevokeLoading] = useState(false);

  const entries = accessEntries.filter((e) => e.userId === user.id);

  const rows = useMemo(() => {
    return entries
      .map((e) => {
        const meta = CATALOG.find((c) => c.id === e.resourceId);
        return meta ? { entry: e, meta } : null;
      })
      .filter((r): r is { entry: typeof entries[0]; meta: ResourceMeta } => r !== null)
      .filter((r) => systemFilter === 'all' || r.meta.systemType === systemFilter);
  }, [entries, systemFilter]);

  const SYSTEM_FILTERS: { value: SystemType | 'all'; label: string }[] = [
    { value: 'all',        label: `All (${entries.length})`            },
    { value: 'redshift',   label: 'Redshift'   },
    { value: 'postgresql', label: 'PostgreSQL' },
    { value: 'sqlserver',  label: 'SQL Server' },
    { value: 'powerbi',    label: 'Power BI'   },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* User info header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/60 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Avatar initials={user.avatar} size="md" />
          <div>
            <h2 className="font-semibold text-gray-900">{user.name}</h2>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
          <UserStatusBadge status={user.status} />
        </div>
        <div className="text-xs text-gray-400 bg-white border border-gray-200 px-2 py-1 rounded-lg">
          {entries.length} resource{entries.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* System filter tabs */}
      <div className="flex gap-1 px-6 py-3 border-b border-gray-100 flex-shrink-0 overflow-x-auto scrollbar-thin">
        {SYSTEM_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setSystemFilter(value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              systemFilter === value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Permission table */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <ShieldCheck className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">No access granted</p>
            <p className="text-xs text-gray-400 mt-1">
              This user has no access for the selected filter.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white border-b border-gray-100 z-10">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Resource</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">System</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Permissions</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Granted</th>
                {isAdmin && <th className="px-4 py-3 w-12" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map(({ entry, meta }) => (
                <tr key={entry.resourceId} className="hover:bg-gray-50/60 group transition-colors">
                  {/* Resource */}
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{meta.resourceType === 'table' ? '🗄️' : '📊'}</span>
                      <div>
                        <p className="font-medium text-gray-800">{meta.name}</p>
                        <p className="text-xs text-gray-400">{meta.path}</p>
                      </div>
                    </div>
                  </td>
                  {/* System */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    <SystemBadge type={meta.systemType} />
                  </td>
                  {/* Permissions — independent toggles */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {PERMISSIONS.map((p) => (
                        <PermChip
                          key={p}
                          permission={p}
                          active={entry.permissions.includes(p)}
                          readonly={!isAdmin}
                          onToggle={() => togglePermission(user.id, entry.resourceId, p)}
                        />
                      ))}
                    </div>
                  </td>
                  {/* Granted date */}
                  <td className="px-4 py-3 text-xs text-gray-400 hidden sm:table-cell">
                    {new Date(entry.grantedAt).toLocaleDateString()}
                  </td>
                  {/* Revoke */}
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setRevokeTarget({
                          resourceId:   entry.resourceId,
                          resourceName: meta.name,
                          resourcePath: meta.path,
                          systemType:   meta.systemType,
                          resourceType: meta.resourceType,
                          permissions:  entry.permissions,
                        })}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                        title="Request access removal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Revoke confirm modal */}
      {revokeTarget && (
        <RevokeConfirmModal
          target={revokeTarget}
          user={user}
          loading={revokeLoading}
          onClose={() => setRevokeTarget(null)}
          onConfirm={async (comment) => {
            setRevokeLoading(true);
            await new Promise((r) => setTimeout(r, 900));
            submitRequest({
              requesterId:  currentUser.id,
              targetUserId: user.id,
              systemType:   revokeTarget.systemType,
              resourceId:   revokeTarget.resourceId,
              resourceName: revokeTarget.resourceName,
              resourcePath: revokeTarget.resourcePath,
              accessLevel:  'none',
              reason:       comment,
              requestType:  'revoke',
            });
            setRevokeLoading(false);
            setRevokeTarget(null);
          }}
        />
      )}
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export const AccessMatrix: React.FC = () => {
  const { accessEntries, currentUser } = useStore();
  const isAdmin = currentUser.role === 'admin';

  const [search, setSearch]           = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const filteredUsers = MOCK_USERS.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.department.toLowerCase().includes(search.toLowerCase())
  );

  function countPermissions(userId: string) {
    const entries = accessEntries.filter((e) => e.userId === userId);
    const total   = entries.reduce((sum, e) => sum + e.permissions.length, 0);
    return { resources: entries.length, permissions: total };
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Access Matrix</h1>
        <p className="text-sm text-gray-500 mt-1">
          Select a user to view and manage all their resource permissions.
          {isAdmin && <span className="ml-2 text-blue-600">Click permission chips to toggle individually.</span>}
        </p>
      </div>

      {/* Split layout */}
      <div className="flex gap-4 min-h-[calc(100vh-200px)]">

        {/* ── Left: User list ── */}
        <Card padding={false} className="w-72 flex-shrink-0 flex flex-col h-full overflow-hidden">
          {/* Search */}
          <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* User rows */}
          <div className="flex-1 overflow-y-auto scrollbar-thin divide-y divide-gray-50">
            {filteredUsers.map((user) => {
              const { resources, permissions } = countPermissions(user.id);
              const isSelected = selectedUser?.id === user.id;
              return (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    isSelected
                      ? 'bg-blue-50 border-r-2 border-blue-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <Avatar initials={user.avatar} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{user.department}</p>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                    <span className="text-xs font-semibold text-gray-600">{resources}r</span>
                    <span className="text-xs text-gray-400">{permissions}p</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer legend */}
          <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400 flex gap-3 flex-shrink-0">
            <span>r = resources</span>
            <span>p = permissions</span>
          </div>
        </Card>

        {/* ── Right: Permission detail ── */}
        <Card padding={false} className="flex-1 flex flex-col overflow-hidden">
          {selectedUser ? (
            <UserDetailPanel user={selectedUser} isAdmin={isAdmin} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-24 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-1">Select a User</h3>
              <p className="text-sm text-gray-400 max-w-xs">
                Choose a user from the list on the left to see and manage all their resource permissions.
              </p>
              <div className="mt-6 flex items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-blue-500 inline-block" /> Read
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-purple-500 inline-block" /> Write
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-red-500 inline-block" /> Admin
                </span>
                <span className="flex items-center gap-1.5">
                  <Database className="w-3 h-3" /> Table
                </span>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
