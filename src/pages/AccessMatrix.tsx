import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Search, Filter } from 'lucide-react';
import { AccessBadge, SystemBadge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { AccessLevel, SystemType } from '../types';
import { MOCK_USERS } from '../data/users';
import { MOCK_DATA_SOURCES } from '../data/dataSources';
import { useStore } from '../store/useStore';

type ResourceRow = {
  id: string;
  name: string;
  path: string;
  systemType: SystemType;
  kind: 'table' | 'report';
};

function flattenResources(filter: SystemType | 'all'): ResourceRow[] {
  const rows: ResourceRow[] = [];
  for (const ds of MOCK_DATA_SOURCES) {
    if (filter !== 'all' && ds.type !== filter) continue;
    if (ds.databases) {
      for (const db of ds.databases) {
        for (const schema of db.schemas) {
          for (const table of schema.tables) {
            rows.push({
              id: table.id,
              name: table.name,
              path: `${db.name} › ${schema.name}`,
              systemType: ds.type,
              kind: 'table',
            });
          }
        }
      }
    }
    if (ds.workspaces) {
      for (const ws of ds.workspaces) {
        for (const rpt of ws.reports) {
          rows.push({
            id: rpt.id,
            name: rpt.name,
            path: ws.name,
            systemType: ds.type,
            kind: 'report',
          });
        }
      }
    }
  }
  return rows;
}

const SYSTEM_FILTERS: { value: SystemType | 'all'; label: string }[] = [
  { value: 'all',        label: 'All Systems'  },
  { value: 'redshift',   label: 'Redshift'     },
  { value: 'postgresql', label: 'PostgreSQL'   },
  { value: 'sqlserver',  label: 'SQL Server'   },
  { value: 'powerbi',    label: 'Power BI'     },
];

const ACCESS_COLORS: Record<AccessLevel, string> = {
  none:  'bg-gray-50 text-gray-300 cursor-pointer hover:bg-gray-100',
  read:  'bg-blue-50 cursor-pointer hover:bg-blue-100',
  write: 'bg-purple-50 cursor-pointer hover:bg-purple-100',
  admin: 'bg-red-50 cursor-pointer hover:bg-red-100',
};

const CYCLE: AccessLevel[] = ['none', 'read', 'write', 'admin'];

export const AccessMatrix: React.FC = () => {
  const { accessEntries, updateAccessEntry, currentUser } = useStore();
  const [systemFilter, setSystemFilter] = useState<SystemType | 'all'>('all');
  const [userSearch, setUserSearch] = useState('');
  const [expandedSystems, setExpandedSystems] = useState<Set<SystemType>>(new Set());

  const resources = useMemo(() => flattenResources(systemFilter), [systemFilter]);
  const filteredUsers = MOCK_USERS.filter((u) =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  function getAccess(userId: string, resourceId: string): AccessLevel {
    return accessEntries.find((e) => e.userId === userId && e.resourceId === resourceId)
      ?.accessLevel ?? 'none';
  }

  function cycleAccess(userId: string, resourceId: string) {
    if (currentUser.role !== 'admin') return;
    const current = getAccess(userId, resourceId);
    const next = CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length];
    updateAccessEntry(userId, resourceId, next);
  }

  // Group resources by system for the header
  const systemGroups = useMemo(() => {
    const map = new Map<SystemType, ResourceRow[]>();
    for (const r of resources) {
      if (!map.has(r.systemType)) map.set(r.systemType, []);
      map.get(r.systemType)!.push(r);
    }
    return map;
  }, [resources]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Access Matrix</h1>
        <p className="text-sm text-gray-500 mt-1">
          View and manage user permissions across all data resources.
          {currentUser.role === 'admin' && (
            <span className="ml-2 text-blue-600">Click any cell to cycle permissions.</span>
          )}
        </p>
      </div>

      {/* Filters */}
      <Card className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg w-52 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <div className="flex gap-1">
            {SYSTEM_FILTERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setSystemFilter(value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  systemFilter === value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-100 border border-blue-200 inline-block"/>Read</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-purple-100 border border-purple-200 inline-block"/>Write</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-100 border border-red-200 inline-block"/>Admin</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-100 border border-gray-200 inline-block"/>None</span>
        </div>
      </Card>

      {/* Matrix table */}
      <Card padding={false} className="overflow-x-auto scrollbar-thin">
        <table className="border-collapse text-sm min-w-full">
          <thead>
            {/* System group header */}
            <tr className="bg-gray-50">
              <th className="sticky left-0 z-10 bg-gray-50 border-b border-r border-gray-200 px-4 py-2 text-left text-xs font-semibold text-gray-500 min-w-[200px]">
                USER / RESOURCE
              </th>
              {Array.from(systemGroups.entries()).map(([sys, rows]) => (
                <th
                  key={sys}
                  colSpan={rows.length}
                  className="border-b border-r border-gray-200 px-2 py-2 text-center"
                >
                  <button
                    onClick={() => {
                      setExpandedSystems((prev) => {
                        const next = new Set(prev);
                        next.has(sys) ? next.delete(sys) : next.add(sys);
                        return next;
                      });
                    }}
                    className="flex items-center gap-1 mx-auto"
                  >
                    <SystemBadge type={sys} />
                    {expandedSystems.has(sys) ? (
                      <ChevronDown className="w-3 h-3 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-gray-400" />
                    )}
                  </button>
                </th>
              ))}
            </tr>
            {/* Resource name row */}
            <tr className="bg-white">
              <th className="sticky left-0 z-10 bg-white border-b border-r border-gray-200 px-4 py-2" />
              {resources.map((r) => (
                <th
                  key={r.id}
                  className="border-b border-r border-gray-100 px-2 py-2 min-w-[100px] max-w-[120px] text-center"
                >
                  <div className="text-xs font-medium text-gray-700 truncate" title={r.name}>
                    {r.name}
                  </div>
                  <div className="text-xs text-gray-400 truncate" title={r.path}>
                    {r.path}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50/50">
                <td className="sticky left-0 bg-white border-r border-gray-100 px-4 py-2 min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 flex-shrink-0">
                      {user.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-xs">{user.name}</p>
                      <p className="text-gray-400 text-xs capitalize">{user.role.replace('_', ' ')}</p>
                    </div>
                  </div>
                </td>
                {resources.map((r) => {
                  const level = getAccess(user.id, r.id);
                  return (
                    <td
                      key={r.id}
                      className={`border-r border-gray-100 text-center p-1 ${ACCESS_COLORS[level]}`}
                      onClick={() => cycleAccess(user.id, r.id)}
                      title={currentUser.role === 'admin' ? `Click to change: ${level}` : level}
                    >
                      {level !== 'none' && (
                        <AccessBadge level={level} />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="py-12 text-center text-gray-400 text-sm">No users match your search.</div>
        )}
      </Card>
    </div>
  );
};
