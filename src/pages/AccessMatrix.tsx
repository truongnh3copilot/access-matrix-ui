import React, { useState, useMemo } from 'react';
import {
  Search, Trash2, Users, ShieldCheck,
  Database,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
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
  const { accessEntries, togglePermission, revokeResource } = useStore();
  const [systemFilter, setSystemFilter] = useState<SystemType | 'all'>('all');

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
                        onClick={() => revokeResource(user.id, entry.resourceId)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                        title="Revoke all access"
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
