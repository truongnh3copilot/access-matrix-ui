import React, { useState } from 'react';
import {
  ChevronRight, ChevronDown, Database, Table2, Layers,
  CheckCircle2, RefreshCw, Plus, Server, Wifi,
  LayoutGrid,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { SystemBadge } from '../components/ui/Badge';
import { DataSource, SystemType } from '../types';
import { useStore } from '../store/useStore';

// ─── Constants ────────────────────────────────────────────────────────────────

const SYSTEM_ICONS: Record<SystemType, string> = {
  redshift:   '🟠',
  postgresql: '🐘',
  sqlserver:  '🔵',
  powerbi:    '📊',
};

const SYSTEM_LABELS: Record<SystemType, string> = {
  redshift:   'Redshift',
  postgresql: 'PostgreSQL',
  sqlserver:  'SQL Server',
  powerbi:    'Power BI',
};

const SYSTEM_OPTIONS: { type: SystemType; label: string; desc: string }[] = [
  { type: 'redshift',   label: 'Redshift',    desc: 'Amazon Redshift data warehouse' },
  { type: 'postgresql', label: 'PostgreSQL',   desc: 'Open-source relational database' },
  { type: 'sqlserver',  label: 'SQL Server',   desc: 'Microsoft SQL Server' },
  { type: 'powerbi',    label: 'Power BI',     desc: 'Microsoft Power BI workspace' },
];

const ALL_TYPES: SystemType[] = ['redshift', 'postgresql', 'sqlserver', 'powerbi'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSourceStats(source: DataSource) {
  const isPBI      = source.type === 'powerbi';
  let schemas = 0, tables = 0;

  if (source.databases) {
    schemas = source.databases.reduce((a, db) => a + db.schemas.length, 0);
    tables  = source.databases.reduce(
      (a, db) => a + db.schemas.reduce((b, s) => b + s.tables.length, 0), 0,
    );
  }
  if (source.workspaces) {
    schemas = source.workspaces.length;
    tables  = source.workspaces.reduce((a, ws) => a + ws.reports.length, 0);
  }

  return {
    schemas,
    tables,
    schemaLabel: isPBI ? 'Workspaces' : 'Schemas',
    tableLabel:  isPBI ? 'Reports'    : 'Tables',
  };
}

// ─── Section 1: Type Dashboard ────────────────────────────────────────────────

const TypeDashboard: React.FC<{ sources: DataSource[] }> = ({ sources }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {ALL_TYPES.map((type) => {
        const group      = sources.filter((s) => s.type === type);
        const connected  = group.filter((s) => s.status === 'connected').length;
        const error      = group.filter((s) => s.status === 'error').length;
        const totalSchemas = group.reduce((a, s) => a + getSourceStats(s).schemas, 0);
        const totalTables  = group.reduce((a, s) => a + getSourceStats(s).tables,  0);
        const isPBI        = type === 'powerbi';

        return (
          <div
            key={type}
            className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{SYSTEM_ICONS[type]}</span>
                <div>
                  <p className="font-semibold text-gray-800 text-sm leading-tight">{SYSTEM_LABELS[type]}</p>
                  <p className="text-xs text-gray-400">{group.length} source{group.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              {group.length > 0 && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  error > 0
                    ? 'bg-red-100 text-red-600'
                    : connected === group.length
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {error > 0 ? `${error} error` : 'All OK'}
                </span>
              )}
            </div>

            {/* Stats */}
            {group.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No sources added</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-gray-800">{totalSchemas}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{isPBI ? 'Workspaces' : 'Schemas'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-gray-800">{totalTables}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{isPBI ? 'Reports' : 'Tables'}</p>
                </div>
              </div>
            )}

            {/* Connection breakdown */}
            {group.length > 0 && (
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-green-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                  {connected} connected
                </span>
                {error > 0 && (
                  <span className="flex items-center gap-1 text-red-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                    {error} error
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Section 2: Data Source List ──────────────────────────────────────────────

const StatusBadge: React.FC<{ status: DataSource['status'] }> = ({ status }) => {
  const cfg = {
    connected:    { dot: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50 border-green-200',  label: 'Connected'    },
    disconnected: { dot: 'bg-gray-400',  text: 'text-gray-600',  bg: 'bg-gray-50 border-gray-200',    label: 'Disconnected' },
    error:        { dot: 'bg-red-500',   text: 'text-red-600',   bg: 'bg-red-50 border-red-200',      label: 'Error'        },
  }[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

const TreeNode: React.FC<{
  label: string; icon: React.ReactNode; meta?: string;
  children?: React.ReactNode; defaultOpen?: boolean; depth?: number;
}> = ({ label, icon, meta, children, defaultOpen = false, depth = 0 }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <div
        className="flex items-center gap-2 py-1.5 px-2 rounded-lg text-sm cursor-pointer hover:bg-gray-50 transition-colors"
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={() => children && setOpen(!open)}
      >
        {children
          ? open
            ? <ChevronDown  className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            : <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          : <span className="w-3.5 h-3.5 flex-shrink-0" />}
        <span className="flex-shrink-0">{icon}</span>
        <span className="font-medium text-gray-700 truncate">{label}</span>
        {meta && <span className="text-xs text-gray-400 ml-auto flex-shrink-0">{meta}</span>}
      </div>
      {open && children && <div>{children}</div>}
    </div>
  );
};

const DataSourceRow: React.FC<{ source: DataSource }> = ({ source }) => {
  const [expanded, setExpanded] = useState(false);
  const stats = getSourceStats(source);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Main row */}
      <div className="flex items-center gap-4 px-5 py-4">
        {/* Icon + name */}
        <span className="text-2xl flex-shrink-0">{SYSTEM_ICONS[source.type]}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 text-sm">{source.name}</h3>
            <SystemBadge type={source.type} />
          </div>
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-6 flex-shrink-0">
          <div className="text-center">
            <p className="text-sm font-bold text-gray-800">{stats.schemas}</p>
            <p className="text-xs text-gray-400">{stats.schemaLabel}</p>
          </div>
          <div className="w-px h-8 bg-gray-100" />
          <div className="text-center">
            <p className="text-sm font-bold text-gray-800">{stats.tables}</p>
            <p className="text-xs text-gray-400">{stats.tableLabel}</p>
          </div>
        </div>

        {/* Status */}
        <div className="hidden md:block flex-shrink-0">
          <StatusBadge status={source.status} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            title="View objects"
          >
            {expanded
              ? <ChevronDown  className="w-4 h-4" />
              : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Tree */}
      {expanded && (
        <div className="border-t border-gray-100 px-3 py-3 bg-gray-50/50">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">
            Object Hierarchy
          </p>

          {source.databases?.map((db) => (
            <TreeNode key={db.id} label={db.name} icon={<Database className="w-4 h-4 text-blue-500" />} defaultOpen depth={0}>
              {db.schemas.map((sch) => (
                <TreeNode
                  key={sch.id} label={sch.name}
                  icon={<Layers className="w-4 h-4 text-purple-400" />}
                  meta={`${sch.tables.length} tables`}
                  defaultOpen={sch.tables.length <= 4}
                  depth={1}
                >
                  {sch.tables.map((t) => (
                    <TreeNode
                      key={t.id} label={t.name}
                      icon={<Table2 className="w-4 h-4 text-gray-400" />}
                      meta={`${t.columns} cols${t.rows ? ' · ' + t.rows + ' rows' : ''}`}
                      depth={2}
                    />
                  ))}
                </TreeNode>
              ))}
            </TreeNode>
          ))}

          {source.workspaces?.map((ws) => (
            <TreeNode key={ws.id} label={ws.name} icon={<span>📁</span>} meta={`${ws.reports.length} reports`} defaultOpen depth={0}>
              {ws.reports.map((rpt) => (
                <TreeNode
                  key={rpt.id} label={rpt.name}
                  icon={rpt.type === 'dashboard' ? <span>📊</span> : <span>📄</span>}
                  meta={rpt.type}
                  depth={1}
                />
              ))}
            </TreeNode>
          ))}

          {stats.tables === 0 && (
            <p className="text-xs text-gray-400 italic px-4 py-2">No objects synced yet.</p>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Create Data Source Modal ─────────────────────────────────────────────────

interface CreateFormState {
  name: string;
  type: SystemType | '';
  host: string;
}

const EMPTY: CreateFormState = { name: '', type: '', host: '' };

const CreateDataSourceModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { addDataSource } = useStore();
  const [form,    setForm]    = useState<CreateFormState>(EMPTY);
  const [errors,  setErrors]  = useState<Partial<Record<keyof CreateFormState, string>>>({});
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);

  const isPowerBI = form.type === 'powerbi';

  function update<K extends keyof CreateFormState>(field: K, value: CreateFormState[K]) {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((e) => ({ ...e, [field]: '' }));
  }

  function validate() {
    const e: Partial<Record<keyof CreateFormState, string>> = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.type)        e.type = 'Select a type';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    addDataSource({
      name:   form.name.trim(),
      type:   form.type as SystemType,
      host:   form.host.trim() || undefined,
      status: 'connected',
      ...(isPowerBI ? { workspaces: [] } : { databases: [] }),
    });
    setLoading(false);
    setDone(true);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center text-center py-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Data Source Added!</h3>
        <p className="text-sm text-gray-500 mb-6">
          <strong>{form.name}</strong> has been connected and is ready to use.
        </p>
        <div className="flex gap-3 w-full">
          <Button variant="secondary" className="flex-1" onClick={() => { setForm(EMPTY); setDone(false); }}>
            Add Another
          </Button>
          <Button variant="primary" className="flex-1" onClick={onClose}>Done</Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Source Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          placeholder="e.g. Production Redshift"
          className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.name ? 'border-red-400' : 'border-gray-300'
          }`}
        />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
      </div>

      {/* Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Type <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {SYSTEM_OPTIONS.map(({ type, label, desc }) => {
            const active = form.type === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => update('type', type)}
                className={`flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-colors ${
                  active ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <span className="text-xl flex-shrink-0 mt-0.5">{SYSTEM_ICONS[type]}</span>
                <div>
                  <p className={`text-sm font-semibold ${active ? 'text-blue-700' : 'text-gray-700'}`}>{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                </div>
              </button>
            );
          })}
        </div>
        {errors.type && <p className="text-xs text-red-500 mt-1">{errors.type}</p>}
      </div>

      {/* Host (SQL only) */}
      {form.type && !isPowerBI && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Host / Endpoint
            <span className="ml-1.5 text-xs font-normal text-gray-400">(optional)</span>
          </label>
          <div className="relative">
            <Server className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={form.host}
              onChange={(e) => update('host', e.target.value)}
              placeholder={
                form.type === 'redshift'   ? 'cluster.us-east-1.redshift.amazonaws.com' :
                form.type === 'postgresql' ? 'hostname:5432' :
                                             'server\\instance'
              }
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {isPowerBI && (
        <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
          <Wifi className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>Power BI connects via the Microsoft Power BI REST API. Workspaces and reports will be synced automatically.</p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-1">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="primary" loading={loading}>Add Data Source</Button>
      </div>
    </form>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export const DataSourceManagement: React.FC = () => {
  const { dataSources }       = useStore();
  const [showCreate, setShowCreate] = useState(false);
  const [filterType, setFilterType] = useState<SystemType | 'all'>('all');

  const connected   = dataSources.filter((d) => d.status === 'connected').length;
  const filtered    = filterType === 'all' ? dataSources : dataSources.filter((d) => d.type === filterType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Sources</h1>
          <p className="text-sm text-gray-500 mt-1">Manage connected databases and BI systems.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
            <CheckCircle2 className="w-4 h-4" />
            {connected}/{dataSources.length} connected
          </div>
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
            New Data Source
          </Button>
        </div>
      </div>

      {/* Section 1 — Dashboard by Type */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Overview by Type
        </h2>
        <TypeDashboard sources={dataSources} />
      </section>

      {/* Section 2 — Data Source List */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            All Sources
            <span className="ml-2 text-xs font-medium text-gray-400 normal-case tracking-normal">
              ({filtered.length})
            </span>
          </h2>
          {/* Type filter pills */}
          <div className="flex items-center gap-1.5">
            {(['all', ...ALL_TYPES] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterType === t
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t === 'all' ? 'All' : t === 'sqlserver' ? 'SQL Server' : SYSTEM_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl py-14 flex flex-col items-center text-center">
            <LayoutGrid className="w-8 h-8 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No sources found</p>
            <p className="text-sm text-gray-400 mt-1">Try a different filter or add a new source.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((source) => (
              <DataSourceRow key={source.id} source={source} />
            ))}
          </div>
        )}
      </section>

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Data Source" size="md">
        <CreateDataSourceModal onClose={() => setShowCreate(false)} />
      </Modal>
    </div>
  );
};
