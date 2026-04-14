import React from 'react';
import { AccessLevel, RequestStatus, SystemType } from '../../types';

// ─── Status Badge ─────────────────────────────────────────────────────────────
interface StatusBadgeProps {
  status: RequestStatus;
}
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const map: Record<RequestStatus, { label: string; cls: string }> = {
    pending:  { label: 'Pending',  cls: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    approved: { label: 'Approved', cls: 'bg-green-100  text-green-800  border-green-200'  },
    rejected: { label: 'Rejected', cls: 'bg-red-100    text-red-800    border-red-200'    },
  };
  const { label, cls } = map[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {label}
    </span>
  );
};

// ─── Access Level Badge ───────────────────────────────────────────────────────
interface AccessBadgeProps {
  level: AccessLevel;
  size?: 'sm' | 'md';
}
export const AccessBadge: React.FC<AccessBadgeProps> = ({ level, size = 'sm' }) => {
  const map: Record<AccessLevel, { label: string; cls: string }> = {
    none:  { label: 'None',  cls: 'bg-gray-100   text-gray-500   border-gray-200'   },
    read:  { label: 'Read',  cls: 'bg-blue-100   text-blue-800   border-blue-200'   },
    write: { label: 'Write', cls: 'bg-purple-100 text-purple-800 border-purple-200' },
    admin: { label: 'Admin', cls: 'bg-red-100    text-red-800    border-red-200'    },
  };
  const { label, cls } = map[level];
  const szCls = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  return (
    <span className={`inline-flex items-center rounded font-medium border ${cls} ${szCls}`}>
      {label}
    </span>
  );
};

// ─── System Badge ─────────────────────────────────────────────────────────────
interface SystemBadgeProps {
  type: SystemType;
}
const SYSTEM_COLORS: Record<SystemType, { label: string; cls: string }> = {
  redshift:   { label: 'Redshift',   cls: 'bg-orange-100 text-orange-800 border-orange-200' },
  postgresql: { label: 'PostgreSQL', cls: 'bg-blue-100   text-blue-800   border-blue-200'   },
  sqlserver:  { label: 'SQL Server', cls: 'bg-gray-100   text-gray-700   border-gray-300'   },
  powerbi:    { label: 'Power BI',   cls: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
};
export const SystemBadge: React.FC<SystemBadgeProps> = ({ type }) => {
  const { label, cls } = SYSTEM_COLORS[type];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${cls}`}>
      {label}
    </span>
  );
};

// ─── User Status Badge ────────────────────────────────────────────────────────
interface UserStatusBadgeProps {
  status: 'active' | 'inactive';
}
export const UserStatusBadge: React.FC<UserStatusBadgeProps> = ({ status }) => {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
      status === 'active'
        ? 'bg-green-100 text-green-800'
        : 'bg-gray-100 text-gray-500'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
      {status === 'active' ? 'Active' : 'Inactive'}
    </span>
  );
};
