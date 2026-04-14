import { AccessEntry } from '../types';

// Pre-seeded access entries (userId → resourceId mapping)
export const MOCK_ACCESS_ENTRIES: AccessEntry[] = [
  // Alice (data_engineer) - broad read/write
  { userId: 'u1', resourceId: 't1', resourceType: 'table', accessLevel: 'write', grantedBy: 'u4', grantedAt: '2023-02-01' },
  { userId: 'u1', resourceId: 't2', resourceType: 'table', accessLevel: 'write', grantedBy: 'u4', grantedAt: '2023-02-01' },
  { userId: 'u1', resourceId: 't3', resourceType: 'table', accessLevel: 'write', grantedBy: 'u4', grantedAt: '2023-02-01' },
  { userId: 'u1', resourceId: 't4', resourceType: 'table', accessLevel: 'read',  grantedBy: 'u4', grantedAt: '2023-02-01' },
  { userId: 'u1', resourceId: 't9', resourceType: 'table', accessLevel: 'write', grantedBy: 'u4', grantedAt: '2023-02-01' },
  { userId: 'u1', resourceId: 'rpt7', resourceType: 'report', accessLevel: 'read', grantedBy: 'u4', grantedAt: '2023-03-15' },

  // Bob (data_analyst) - read curated + BI
  { userId: 'u2', resourceId: 't1', resourceType: 'table', accessLevel: 'read',  grantedBy: 'u4', grantedAt: '2023-04-10' },
  { userId: 'u2', resourceId: 't2', resourceType: 'table', accessLevel: 'read',  grantedBy: 'u4', grantedAt: '2023-04-10' },
  { userId: 'u2', resourceId: 't15', resourceType: 'table', accessLevel: 'read', grantedBy: 'u4', grantedAt: '2023-04-10' },
  { userId: 'u2', resourceId: 'rpt4', resourceType: 'report', accessLevel: 'write', grantedBy: 'u4', grantedAt: '2023-05-01' },
  { userId: 'u2', resourceId: 'rpt5', resourceType: 'report', accessLevel: 'read',  grantedBy: 'u4', grantedAt: '2023-05-01' },

  // Carol (viewer/finance) - limited finance tables + reports
  { userId: 'u3', resourceId: 't5', resourceType: 'table', accessLevel: 'read',   grantedBy: 'u4', grantedAt: '2023-06-01' },
  { userId: 'u3', resourceId: 'rpt1', resourceType: 'report', accessLevel: 'read', grantedBy: 'u4', grantedAt: '2023-06-01' },
  { userId: 'u3', resourceId: 'rpt2', resourceType: 'report', accessLevel: 'read', grantedBy: 'u4', grantedAt: '2023-06-01' },
  { userId: 'u3', resourceId: 'rpt3', resourceType: 'report', accessLevel: 'read', grantedBy: 'u4', grantedAt: '2023-06-01' },

  // David (admin) - full access
  { userId: 'u4', resourceId: 't1',  resourceType: 'table', accessLevel: 'admin', grantedBy: 'u4', grantedAt: '2022-11-01' },
  { userId: 'u4', resourceId: 't4',  resourceType: 'table', accessLevel: 'admin', grantedBy: 'u4', grantedAt: '2022-11-01' },
  { userId: 'u4', resourceId: 't12', resourceType: 'table', accessLevel: 'admin', grantedBy: 'u4', grantedAt: '2022-11-01' },
  { userId: 'u4', resourceId: 'rpt1', resourceType: 'report', accessLevel: 'admin', grantedBy: 'u4', grantedAt: '2022-11-01' },
  { userId: 'u4', resourceId: 'rpt4', resourceType: 'report', accessLevel: 'admin', grantedBy: 'u4', grantedAt: '2022-11-01' },

  // Emma (marketing viewer)
  { userId: 'u5', resourceId: 't7', resourceType: 'table', accessLevel: 'read',  grantedBy: 'u4', grantedAt: '2023-09-01' },
  { userId: 'u5', resourceId: 't8', resourceType: 'table', accessLevel: 'read',  grantedBy: 'u4', grantedAt: '2023-09-01' },
  { userId: 'u5', resourceId: 'rpt5', resourceType: 'report', accessLevel: 'read', grantedBy: 'u4', grantedAt: '2023-09-01' },

  // Grace (analyst)
  { userId: 'u7', resourceId: 't1',  resourceType: 'table', accessLevel: 'read',  grantedBy: 'u4', grantedAt: '2024-01-20' },
  { userId: 'u7', resourceId: 't15', resourceType: 'table', accessLevel: 'read',  grantedBy: 'u4', grantedAt: '2024-01-20' },
  { userId: 'u7', resourceId: 'rpt4', resourceType: 'report', accessLevel: 'read', grantedBy: 'u4', grantedAt: '2024-01-20' },
  { userId: 'u7', resourceId: 'rpt6', resourceType: 'report', accessLevel: 'read', grantedBy: 'u4', grantedAt: '2024-01-20' },

  // Henry (manager)
  { userId: 'u8', resourceId: 'rpt1', resourceType: 'report', accessLevel: 'read', grantedBy: 'u4', grantedAt: '2023-03-01' },
  { userId: 'u8', resourceId: 'rpt4', resourceType: 'report', accessLevel: 'read', grantedBy: 'u4', grantedAt: '2023-03-01' },
  { userId: 'u8', resourceId: 'rpt7', resourceType: 'report', accessLevel: 'read', grantedBy: 'u4', grantedAt: '2023-03-01' },
];
