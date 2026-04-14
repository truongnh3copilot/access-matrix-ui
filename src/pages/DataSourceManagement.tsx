import React, { useState } from 'react';
import {
  ChevronRight, ChevronDown, Database, Table2,
  Layers, CheckCircle2, AlertCircle, RefreshCw,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { SystemBadge } from '../components/ui/Badge';
import { MOCK_DATA_SOURCES } from '../data/dataSources';
import { DataSource, SystemType } from '../types';

const SYSTEM_ICONS: Record<SystemType, string> = {
  redshift:   '🟠',
  postgresql: '🐘',
  sqlserver:  '🔵',
  powerbi:    '📊',
};

const StatusDot: React.FC<{ status: DataSource['status'] }> = ({ status }) => {
  const cls = status === 'connected' ? 'bg-green-500' : status === 'error' ? 'bg-red-500' : 'bg-gray-400';
  const label = status === 'connected' ? 'Connected' : status === 'error' ? 'Error' : 'Disconnected';
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs text-gray-500`}>
      <span className={`w-2 h-2 rounded-full ${cls}`} />
      {label}
    </span>
  );
};

interface TreeNodeProps {
  label: string;
  icon: React.ReactNode;
  meta?: string;
  children?: React.ReactNode;
  defaultOpen?: boolean;
  depth?: number;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  label, icon, meta, children, defaultOpen = false, depth = 0,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const hasChildren = !!children;
  const indent = depth * 16;

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-1.5 px-2 rounded-lg text-sm cursor-pointer hover:bg-gray-50 transition-colors`}
        style={{ paddingLeft: `${8 + indent}px` }}
        onClick={() => hasChildren && setOpen(!open)}
      >
        {hasChildren ? (
          open ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
               : <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        ) : (
          <span className="w-3.5 h-3.5 flex-shrink-0" />
        )}
        <span className="flex-shrink-0">{icon}</span>
        <span className="font-medium text-gray-700 truncate">{label}</span>
        {meta && <span className="text-xs text-gray-400 ml-auto flex-shrink-0">{meta}</span>}
      </div>
      {open && children && <div>{children}</div>}
    </div>
  );
};

interface DataSourceCardProps {
  source: DataSource;
}

const DataSourceCard: React.FC<DataSourceCardProps> = ({ source }) => {
  const [expanded, setExpanded] = useState(false);

  let totalObjects = 0;
  if (source.databases) {
    for (const db of source.databases)
      for (const sch of db.schemas)
        totalObjects += sch.tables.length;
  }
  if (source.workspaces) {
    for (const ws of source.workspaces)
      totalObjects += ws.reports.length;
  }

  return (
    <Card padding={false} className="overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50/60 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="text-2xl">{SYSTEM_ICONS[source.type]}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900">{source.name}</h3>
            <SystemBadge type={source.type} />
          </div>
          {source.host && (
            <p className="text-xs text-gray-400 font-mono truncate mt-0.5">{source.host}</p>
          )}
        </div>
        <div className="hidden sm:flex flex-col items-end gap-1 text-right flex-shrink-0">
          <StatusDot status={source.status} />
          <p className="text-xs text-gray-400">{totalObjects} objects</p>
        </div>
        <div className="flex items-center gap-2 ml-2">
          <button
            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            onClick={(e) => { e.stopPropagation(); }}
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {expanded
            ? <ChevronDown className="w-5 h-5 text-gray-400" />
            : <ChevronRight className="w-5 h-5 text-gray-400" />
          }
        </div>
      </div>

      {/* Expanded tree */}
      {expanded && (
        <div className="border-t border-gray-100 px-3 py-3 bg-gray-50/40">
          <div className="flex items-center gap-2 mb-2 px-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Object Hierarchy
            </p>
            <span className="text-xs text-gray-400">
              Last synced: {new Date(source.lastSync).toLocaleString()}
            </span>
          </div>

          {/* DB hierarchy */}
          {source.databases?.map((db) => (
            <TreeNode
              key={db.id}
              label={db.name}
              icon={<Database className="w-4 h-4 text-blue-500" />}
              defaultOpen
              depth={0}
            >
              {db.schemas.map((sch) => (
                <TreeNode
                  key={sch.id}
                  label={sch.name}
                  icon={<Layers className="w-4 h-4 text-purple-400" />}
                  meta={`${sch.tables.length} tables`}
                  defaultOpen={sch.tables.length <= 4}
                  depth={1}
                >
                  {sch.tables.map((t) => (
                    <TreeNode
                      key={t.id}
                      label={t.name}
                      icon={<Table2 className="w-4 h-4 text-gray-400" />}
                      meta={`${t.columns} cols${t.rows ? ' · ' + t.rows + ' rows' : ''}`}
                      depth={2}
                    />
                  ))}
                </TreeNode>
              ))}
            </TreeNode>
          ))}

          {/* PBI hierarchy */}
          {source.workspaces?.map((ws) => (
            <TreeNode
              key={ws.id}
              label={ws.name}
              icon={<span>📁</span>}
              meta={`${ws.reports.length} reports`}
              defaultOpen
              depth={0}
            >
              {ws.reports.map((rpt) => (
                <TreeNode
                  key={rpt.id}
                  label={rpt.name}
                  icon={rpt.type === 'dashboard' ? <span>📊</span> : <span>📄</span>}
                  meta={rpt.type}
                  depth={1}
                />
              ))}
            </TreeNode>
          ))}
        </div>
      )}
    </Card>
  );
};

export const DataSourceManagement: React.FC = () => {
  const connected = MOCK_DATA_SOURCES.filter((d) => d.status === 'connected').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Sources</h1>
          <p className="text-sm text-gray-500 mt-1">Manage connected databases and BI systems.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
          <CheckCircle2 className="w-4 h-4" />
          {connected}/{MOCK_DATA_SOURCES.length} connected
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {MOCK_DATA_SOURCES.map((ds) => {
          let count = 0;
          if (ds.databases) {
            for (const db of ds.databases)
              for (const sch of db.schemas)
                count += sch.tables.length;
          }
          if (ds.workspaces) {
            for (const ws of ds.workspaces)
              count += ws.reports.length;
          }
          return (
            <div key={ds.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xl mb-2">{SYSTEM_ICONS[ds.type]}</div>
              <p className="font-semibold text-gray-800 text-sm truncate">{ds.name}</p>
              <p className="text-xs text-gray-400">{count} objects</p>
              <div className="mt-2">
                {ds.status === 'connected'
                  ? <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="w-3 h-3" />Connected</span>
                  : <span className="flex items-center gap-1 text-xs text-red-500"><AlertCircle className="w-3 h-3" />Error</span>
                }
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail cards */}
      <div className="space-y-3">
        {MOCK_DATA_SOURCES.map((source) => (
          <DataSourceCard key={source.id} source={source} />
        ))}
      </div>
    </div>
  );
};
