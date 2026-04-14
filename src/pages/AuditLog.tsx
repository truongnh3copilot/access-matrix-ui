import React, { useState, useMemo } from 'react';
import {
  Search, Filter, ArrowRight, UserPlus, ShieldCheck,
  ShieldOff, CheckCircle2, XCircle, Clock, Key,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { AuditAction } from '../types';
import { MOCK_USERS } from '../data/users';
import { useStore } from '../store/useStore';

const ACTION_META: Record<AuditAction, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  access_granted:    { label: 'Access Granted',    icon: ShieldCheck,   color: 'text-green-700',  bg: 'bg-green-50'  },
  access_revoked:    { label: 'Access Revoked',    icon: ShieldOff,     color: 'text-red-700',    bg: 'bg-red-50'    },
  request_submitted: { label: 'Request Submitted', icon: Clock,         color: 'text-yellow-700', bg: 'bg-yellow-50' },
  request_approved:  { label: 'Request Approved',  icon: CheckCircle2,  color: 'text-green-700',  bg: 'bg-green-50'  },
  request_rejected:  { label: 'Request Rejected',  icon: XCircle,       color: 'text-red-700',    bg: 'bg-red-50'    },
  user_created:      { label: 'User Created',      icon: UserPlus,      color: 'text-blue-700',   bg: 'bg-blue-50'   },
  role_assigned:     { label: 'Role Assigned',     icon: Key,           color: 'text-purple-700', bg: 'bg-purple-50' },
};

const ACTION_FILTERS: { value: AuditAction | 'all'; label: string }[] = [
  { value: 'all',               label: 'All Actions'       },
  { value: 'access_granted',    label: 'Granted'           },
  { value: 'access_revoked',    label: 'Revoked'           },
  { value: 'request_submitted', label: 'Submitted'         },
  { value: 'request_approved',  label: 'Approved'          },
  { value: 'request_rejected',  label: 'Rejected'          },
  { value: 'user_created',      label: 'User Created'      },
  { value: 'role_assigned',     label: 'Role Assigned'     },
];

export const AuditLog: React.FC = () => {
  const { auditLogs } = useStore();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<AuditAction | 'all'>('all');

  const filtered = useMemo(() => {
    return auditLogs.filter((log) => {
      if (actionFilter !== 'all' && log.action !== actionFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const actor  = MOCK_USERS.find((u) => u.id === log.actorId);
        const target = MOCK_USERS.find((u) => u.id === log.targetUserId);
        return (
          log.details.toLowerCase().includes(q) ||
          log.resourceName?.toLowerCase().includes(q) ||
          actor?.name.toLowerCase().includes(q) ||
          target?.name.toLowerCase().includes(q) ||
          log.ipAddress.includes(q)
        );
      }
      return true;
    });
  }, [auditLogs, actionFilter, search]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-sm text-gray-500 mt-1">Complete history of all access changes and approvals.</p>
      </div>

      {/* Filters */}
      <Card className="space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="text-sm text-gray-400 self-center">{filtered.length} entries</div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
          {ACTION_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setActionFilter(value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                actionFilter === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Card>

      {/* Log entries */}
      <Card padding={false}>
        <div className="divide-y divide-gray-50">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">No log entries match your criteria.</div>
          ) : (
            filtered.map((log) => {
              const meta   = ACTION_META[log.action];
              const Icon   = meta.icon;
              const actor  = MOCK_USERS.find((u) => u.id === log.actorId);
              const target = MOCK_USERS.find((u) => u.id === log.targetUserId);

              return (
                <div key={log.id} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors">
                  {/* Action icon */}
                  <div className={`w-9 h-9 rounded-lg ${meta.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Icon className={`w-4.5 h-4.5 ${meta.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-semibold ${meta.color}`}>{meta.label}</span>
                      {log.resourceName && (
                        <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                          {log.resourceName}
                        </span>
                      )}
                      {/* Before → After */}
                      {log.before !== undefined && log.after !== undefined && (
                        <span className="flex items-center gap-1 text-xs">
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-mono">{log.before}</span>
                          <ArrowRight className="w-3 h-3 text-gray-400" />
                          <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-mono">{log.after}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{log.details}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                      {actor && <span>by <strong className="text-gray-500">{actor.name}</strong></span>}
                      {target && target.id !== actor?.id && (
                        <span>→ <strong className="text-gray-500">{target.name}</strong></span>
                      )}
                      <span className="font-mono">{log.ipAddress}</span>
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <p className="text-xs font-medium text-gray-600">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
};
