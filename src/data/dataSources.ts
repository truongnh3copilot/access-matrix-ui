import { DataSource } from '../types';

export const MOCK_DATA_SOURCES: DataSource[] = [
  {
    id: 'ds1',
    name: 'Analytics Redshift',
    type: 'redshift',
    host: 'analytics.cluster.us-east-1.redshift.amazonaws.com',
    status: 'connected',
    lastSync: '2026-04-14T08:30:00Z',
    databases: [
      {
        id: 'db1',
        name: 'analytics_db',
        schemas: [
          {
            id: 'sch1',
            name: 'public',
            tables: [
              { id: 't1', name: 'orders', columns: 14, rows: '12.4M' },
              { id: 't2', name: 'customers', columns: 22, rows: '2.1M' },
              { id: 't3', name: 'products', columns: 18, rows: '84K' },
            ],
          },
          {
            id: 'sch2',
            name: 'finance',
            tables: [
              { id: 't4', name: 'transactions', columns: 20, rows: '45M' },
              { id: 't5', name: 'invoices', columns: 12, rows: '3.2M' },
              { id: 't6', name: 'budget_targets', columns: 8, rows: '1.2K' },
            ],
          },
          {
            id: 'sch3',
            name: 'marketing',
            tables: [
              { id: 't7', name: 'campaigns', columns: 16, rows: '820K' },
              { id: 't8', name: 'leads', columns: 24, rows: '5.6M' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'ds2',
    name: 'Operational PostgreSQL',
    type: 'postgresql',
    host: 'ops-pg.internal.corp.com:5432',
    status: 'connected',
    lastSync: '2026-04-14T09:00:00Z',
    databases: [
      {
        id: 'db2',
        name: 'operations',
        schemas: [
          {
            id: 'sch4',
            name: 'inventory',
            tables: [
              { id: 't9',  name: 'stock_levels', columns: 10, rows: '340K' },
              { id: 't10', name: 'warehouses', columns: 8, rows: '42' },
              { id: 't11', name: 'suppliers', columns: 15, rows: '1.8K' },
            ],
          },
          {
            id: 'sch5',
            name: 'hr',
            tables: [
              { id: 't12', name: 'employees', columns: 30, rows: '4.5K' },
              { id: 't13', name: 'departments', columns: 6, rows: '28' },
              { id: 't14', name: 'payroll', columns: 18, rows: '108K' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'ds3',
    name: 'Reporting SQL Server',
    type: 'sqlserver',
    host: 'sql-report.corp.com\\MSSQLSERVER',
    status: 'connected',
    lastSync: '2026-04-14T07:45:00Z',
    databases: [
      {
        id: 'db3',
        name: 'reporting',
        schemas: [
          {
            id: 'sch6',
            name: 'dbo',
            tables: [
              { id: 't15', name: 'sales_summary', columns: 12, rows: '2.4M' },
              { id: 't16', name: 'kpi_metrics', columns: 9, rows: '186K' },
              { id: 't17', name: 'monthly_rollup', columns: 11, rows: '48K' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'ds4',
    name: 'Corporate Power BI',
    type: 'powerbi',
    status: 'connected',
    lastSync: '2026-04-14T08:00:00Z',
    workspaces: [
      {
        id: 'ws1',
        name: 'Finance Workspace',
        reports: [
          { id: 'rpt1', name: 'P&L Dashboard', type: 'dashboard' },
          { id: 'rpt2', name: 'Cash Flow Report', type: 'report' },
          { id: 'rpt3', name: 'Budget vs Actual', type: 'report' },
        ],
      },
      {
        id: 'ws2',
        name: 'Sales Workspace',
        reports: [
          { id: 'rpt4', name: 'Sales Pipeline', type: 'dashboard' },
          { id: 'rpt5', name: 'Regional Performance', type: 'report' },
          { id: 'rpt6', name: 'Customer Segmentation', type: 'report' },
        ],
      },
      {
        id: 'ws3',
        name: 'Operations Workspace',
        reports: [
          { id: 'rpt7', name: 'Supply Chain Overview', type: 'dashboard' },
          { id: 'rpt8', name: 'Inventory Status', type: 'report' },
        ],
      },
    ],
  },
];
