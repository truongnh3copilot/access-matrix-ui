import React, { useState, useRef, useEffect } from 'react';
import {
  CheckCircle2, XCircle, Clock, MessageSquare,
  ChevronDown, ChevronUp, Plus, FileText, Search, X, MoreHorizontal,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SystemBadge, AccessBadge, StatusBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Avatar } from '../components/ui/Avatar';
import { AccessRequest, AccessLevel, RequestStatus, SystemType } from '../types';
import { MOCK_USERS } from '../data/users';
import { useStore } from '../store/useStore';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Parses a resourcePath like "Source › db › schema › table" into display fields.
 * Works for both SQL (4 parts) and PowerBI (3 parts).
 */
function parsePath(path: string): { sourceName: string; schemaWorkspace: string } {
  const parts = path.split(' › ').map((s) => s.trim());
  if (parts.length >= 3) {
    return {
      sourceName:      parts[0],
      schemaWorkspace: parts.slice(1, -1).join(' › '), // everything between source and leaf
    };
  }
  if (parts.length === 2) {
    return { sourceName: parts[0], schemaWorkspace: '' };
  }
  return { sourceName: '', schemaWorkspace: path };
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = RequestStatus | 'all';

const TABS: { value: Tab; label: string }[] = [
  { value: 'all',      label: 'All'      },
  { value: 'pending',  label: 'Pending'  },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

interface SelectOption {
  id: string;
  label: string;
  sub?: string;
}

// ─── SearchableSelect (single) ────────────────────────────────────────────────

interface SearchableSelectProps {
  value: string;
  onChange: (id: string, label: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  emptyText?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value, onChange, options, placeholder = 'Select...', disabled, error, emptyText = 'No options',
}) => {
  const [query, setQuery] = useState('');
  const [open, setOpen]   = useState(false);
  const wrapRef           = useRef<HTMLDivElement>(null);
  const inputRef          = useRef<HTMLInputElement>(null);

  const selectedLabel = options.find((o) => o.id === value)?.label ?? '';
  const filtered = query
    ? options.filter((o) =>
        o.label.toLowerCase().includes(query.toLowerCase()) ||
        (o.sub?.toLowerCase().includes(query.toLowerCase()) ?? false))
    : options;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false); setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleOpen() {
    if (disabled) return;
    setOpen((v) => !v);
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={`w-full px-3 py-2 text-sm border rounded-lg flex items-center justify-between gap-2 transition-colors
          ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white hover:border-gray-400 cursor-pointer'}
          ${error ? 'border-red-400' : 'border-gray-300'}
          focus:outline-none focus:ring-2 focus:ring-blue-500`}
      >
        <span className={`truncate ${value ? 'text-gray-800' : 'text-gray-400'}`}>
          {value ? selectedLabel : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0
              ? <li className="px-3 py-2.5 text-sm text-gray-400 text-center">{emptyText}</li>
              : filtered.map((o) => (
                  <li
                    key={o.id}
                    onClick={() => { onChange(o.id, o.label); setOpen(false); setQuery(''); }}
                    className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between gap-2 hover:bg-blue-50 transition-colors
                      ${o.id === value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                  >
                    <span className="truncate">{o.label}</span>
                    {o.sub && <span className="text-xs text-gray-400 flex-shrink-0">{o.sub}</span>}
                  </li>
                ))
            }
          </ul>
        </div>
      )}
    </div>
  );
};

// ─── MultiSearchableSelect ────────────────────────────────────────────────────

interface MultiSearchableSelectProps {
  values: string[];
  onChange: (values: string[]) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  emptyText?: string;
}

const MultiSearchableSelect: React.FC<MultiSearchableSelectProps> = ({
  values, onChange, options, placeholder = 'Select...', disabled, error, emptyText = 'No options',
}) => {
  const [query, setQuery] = useState('');
  const [open, setOpen]   = useState(false);
  const wrapRef           = useRef<HTMLDivElement>(null);
  const inputRef          = useRef<HTMLInputElement>(null);

  const selectedOpts = values
    .map((v) => options.find((o) => o.id === v))
    .filter((o): o is SelectOption => !!o);

  const filtered = query
    ? options.filter((o) =>
        o.label.toLowerCase().includes(query.toLowerCase()) ||
        (o.sub?.toLowerCase().includes(query.toLowerCase()) ?? false))
    : options;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false); setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function toggle(id: string) {
    onChange(values.includes(id) ? values.filter((v) => v !== id) : [...values, id]);
  }

  function handleTriggerClick() {
    if (disabled) return;
    setOpen(true);
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  return (
    <div ref={wrapRef} className="relative">
      {/* Trigger */}
      <div
        onClick={handleTriggerClick}
        className={`w-full min-h-[38px] px-2.5 py-1.5 text-sm border rounded-lg flex items-center flex-wrap gap-1.5 transition-colors
          ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white hover:border-gray-400 cursor-pointer'}
          ${error ? 'border-red-400' : 'border-gray-300'}`}
      >
        {selectedOpts.length === 0 ? (
          <span className="text-gray-400 px-0.5 py-0.5 flex-1">{placeholder}</span>
        ) : (
          selectedOpts.map((o) => (
            <span
              key={o.id}
              className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
            >
              {o.label}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); if (!disabled) toggle(o.id); }}
                className="w-4 h-4 rounded-full hover:bg-blue-200 flex items-center justify-center"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))
        )}
        <ChevronDown className={`w-4 h-4 text-gray-400 ml-auto flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>

      {/* Dropdown */}
      {open && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          {/* Options */}
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0
              ? <li className="px-3 py-2.5 text-sm text-gray-400 text-center">{emptyText}</li>
              : filtered.map((o) => {
                  const checked = values.includes(o.id);
                  return (
                    <li
                      key={o.id}
                      onClick={() => toggle(o.id)}
                      className={`px-3 py-2 text-sm cursor-pointer flex items-center gap-2.5 hover:bg-blue-50 transition-colors
                        ${checked ? 'text-blue-700' : 'text-gray-700'}`}
                    >
                      {/* Checkbox */}
                      <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors
                        ${checked ? 'bg-blue-500 border-blue-500' : 'border-gray-300 bg-white'}`}
                      >
                        {checked && (
                          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                            <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span className="flex-1 truncate">{o.label}</span>
                      {o.sub && <span className="text-xs text-gray-400 flex-shrink-0">{o.sub}</span>}
                    </li>
                  );
                })
            }
          </ul>
          {/* Footer */}
          {values.length > 0 && (
            <div className="px-3 py-2 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">{values.length} selected</span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-red-500 hover:text-red-700 font-medium"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Request Form ─────────────────────────────────────────────────────────────

interface FormState {
  targetUserId: string;
  sourceId:     string;   // DataSource.id
  databaseId:   string;   // DataDatabase.id (SQL only, single)
  schemaIds:    string[]; // DataSchema.id[] (SQL) | PBIWorkspace.id[] (PowerBI)
  resourceIds:  string[]; // DataTable.id[]  (SQL) | PBIReport.id[]   (PowerBI)
  reason:       string;
}

const EMPTY_FORM: FormState = {
  targetUserId: '', sourceId: '', databaseId: '',
  schemaIds: [], resourceIds: [], reason: '',
};

type FormStep = 'form' | 'success';

const LEVEL_META: Record<string, { color: string; activeColor: string; desc: string }> = {
  read:  { color: 'border-blue-300   text-blue-600',   activeColor: 'bg-blue-500   text-white border-blue-500',   desc: 'View only'    },
  write: { color: 'border-purple-300 text-purple-600', activeColor: 'bg-purple-500 text-white border-purple-500', desc: 'Read + write' },
  admin: { color: 'border-red-300    text-red-600',    activeColor: 'bg-red-500    text-white border-red-500',    desc: 'Full control' },
};

const SYSTEM_LABELS: Record<SystemType, string> = {
  redshift: 'Redshift', postgresql: 'PostgreSQL', sqlserver: 'SQL Server', powerbi: 'Power BI',
};

interface RequestFormProps { onClose: () => void; }

const RequestForm: React.FC<RequestFormProps> = ({ onClose }) => {
  const { submitRequest, currentUser, dataSources } = useStore();
  const [form, setForm]                     = useState<FormState>(EMPTY_FORM);
  const [selectedLevels, setSelectedLevels] = useState<Set<string>>(new Set());
  const [isRevoke, setIsRevoke]             = useState(false);
  const [step, setStep]                     = useState<FormStep>('form');
  const [loading, setLoading]               = useState(false);
  const [errors, setErrors]                 = useState<
    Partial<Record<keyof FormState | 'accessLevels', string>>
  >({});

  // ── Derived data ──────────────────────────────────────────────────────────

  const selectedSource = dataSources.find((ds) => ds.id === form.sourceId);
  const isPowerBI      = selectedSource?.type === 'powerbi';

  const sourceOptions: SelectOption[] = dataSources.map((ds) => ({
    id: ds.id, label: ds.name, sub: SYSTEM_LABELS[ds.type],
  }));

  // Level 2 — Database (SQL, single) — hidden for PowerBI
  const databaseOptions: SelectOption[] = !isPowerBI && selectedSource
    ? (selectedSource.databases ?? []).map((db) => ({ id: db.id, label: db.name }))
    : [];

  const selectedDb = selectedSource?.databases?.find((db) => db.id === form.databaseId);

  // Level 3 — Schema (SQL, multi) | Workspace (PowerBI, multi)
  const level3Label   = isPowerBI ? 'Workspace' : 'Schema';
  const level3Options: SelectOption[] = isPowerBI
    ? (selectedSource?.workspaces ?? []).map((ws) => ({ id: ws.id, label: ws.name }))
    : (selectedDb?.schemas ?? []).map((sch) => ({ id: sch.id, label: sch.name }));

  // Level 4 — Table (SQL, multi) | Report (PowerBI, multi)
  const level4Label   = isPowerBI ? 'Report / Dashboard' : 'Table';
  const level4Options: SelectOption[] = (() => {
    if (form.schemaIds.length === 0) return [];
    if (isPowerBI) {
      const opts: SelectOption[] = [];
      for (const wsId of form.schemaIds) {
        const ws = selectedSource?.workspaces?.find((w) => w.id === wsId);
        (ws?.reports ?? []).forEach((r) =>
          opts.push({ id: r.id, label: r.name, sub: `${ws?.name} · ${r.type}` })
        );
      }
      return opts;
    }
    const opts: SelectOption[] = [];
    for (const schId of form.schemaIds) {
      const sch = selectedDb?.schemas.find((s) => s.id === schId);
      (sch?.tables ?? []).forEach((t) =>
        opts.push({
          id: t.id, label: t.name,
          sub: `${sch?.name}${t.rows ? ` · ${t.rows} rows` : ''}`,
        })
      );
    }
    return opts;
  })();

  // ── Handlers ──────────────────────────────────────────────────────────────

  function updateField(field: keyof FormState, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'sourceId') {
        next.databaseId = ''; next.schemaIds = []; next.resourceIds = [];
      }
      if (field === 'databaseId') {
        next.schemaIds = []; next.resourceIds = [];
      }
      return next;
    });
    setErrors((e) => ({ ...e, [field]: '' }));
  }

  function updateSchemaIds(newIds: string[]) {
    setForm((prev) => {
      // When a schema/workspace is removed, also remove its orphaned tables/reports
      const removedIds = prev.schemaIds.filter((id) => !newIds.includes(id));
      if (removedIds.length === 0) return { ...prev, schemaIds: newIds };

      const orphanIds = new Set<string>();
      if (isPowerBI) {
        for (const wsId of removedIds) {
          const ws = selectedSource?.workspaces?.find((w) => w.id === wsId);
          ws?.reports.forEach((r) => orphanIds.add(r.id));
        }
      } else {
        for (const schId of removedIds) {
          const sch = selectedDb?.schemas.find((s) => s.id === schId);
          sch?.tables.forEach((t) => orphanIds.add(t.id));
        }
      }
      return {
        ...prev,
        schemaIds:   newIds,
        resourceIds: prev.resourceIds.filter((id) => !orphanIds.has(id)),
      };
    });
    setErrors((e) => ({ ...e, schemaIds: '' }));
  }

  function updateResourceIds(newIds: string[]) {
    setForm((prev) => ({ ...prev, resourceIds: newIds }));
    setErrors((e) => ({ ...e, resourceIds: '' }));
  }

  function toggleLevel(level: string) {
    setIsRevoke(false);
    setSelectedLevels((prev) => {
      const next = new Set(prev);
      next.has(level) ? next.delete(level) : next.add(level);
      return next;
    });
    setErrors((e) => ({ ...e, accessLevels: '' }));
  }

  function toggleRevoke() {
    const next = !isRevoke;
    setIsRevoke(next);
    if (next) setSelectedLevels(new Set()); // clear grant levels when switching to revoke
    setErrors((e) => ({ ...e, accessLevels: '' }));
  }

  function validate() {
    const e: Partial<Record<keyof FormState | 'accessLevels', string>> = {};
    if (!form.targetUserId)             e.targetUserId = 'Required';
    if (!form.sourceId)                 e.sourceId     = 'Required';
    if (!isPowerBI && !form.databaseId) e.databaseId   = 'Required';
    if (form.schemaIds.length === 0)    e.schemaIds    = `Select at least one ${level3Label.toLowerCase()}`;
    if (form.resourceIds.length === 0)  e.resourceIds  = `Select at least one ${level4Label.toLowerCase()}`;
    if (!isRevoke && selectedLevels.size === 0) e.accessLevels = 'Select at least one level or choose Revoke';
    if (!form.reason.trim())            e.reason       = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // Resolve name + path for a single resourceId
  function resolveResource(rId: string): { name: string; path: string } {
    if (isPowerBI) {
      for (const wsId of form.schemaIds) {
        const ws  = selectedSource?.workspaces?.find((w) => w.id === wsId);
        const rpt = ws?.reports.find((r) => r.id === rId);
        if (rpt) return {
          name: rpt.name,
          path: `${selectedSource?.name ?? ''} › ${ws?.name ?? ''} › ${rpt.name}`,
        };
      }
    } else {
      for (const schId of form.schemaIds) {
        const sch = selectedDb?.schemas.find((s) => s.id === schId);
        const tbl = sch?.tables.find((t) => t.id === rId);
        if (tbl) return {
          name: tbl.name,
          path: `${selectedSource?.name ?? ''} › ${selectedDb?.name ?? ''} › ${sch?.name ?? ''} › ${tbl.name}`,
        };
      }
    }
    return { name: rId, path: '' };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    const levels    = (['read', 'write', 'admin'] as const).filter((l) => selectedLevels.has(l));
    const src       = dataSources.find((ds) => ds.id === form.sourceId);
    const resolved  = form.resourceIds.map(resolveResource);

    submitRequest({
      requesterId:   currentUser.id,
      targetUserId:  form.targetUserId,
      systemType:    (src?.type ?? 'redshift') as SystemType,
      resourceId:    form.resourceIds[0],
      resourceName:  resolved.map((r) => r.name).join(', '),
      resourcePath:  resolved[0]?.path ?? '',
      resourceIds:   form.resourceIds,
      resourceNames: resolved.map((r) => r.name),
      accessLevel:   isRevoke ? 'none' : (levels[levels.length - 1] as AccessLevel),
      accessLevels:  isRevoke ? [] : levels,
      reason:        form.reason,
      requestType:   isRevoke ? 'revoke' : 'grant',
    });

    setLoading(false);
    setStep('success');
  }

  // ── Success ────────────────────────────────────────────────────────────────
  if (step === 'success') {
    const src         = dataSources.find((ds) => ds.id === form.sourceId);
    const resolvedRes = form.resourceIds.map(resolveResource);

    return (
      <div className="flex flex-col items-center text-center py-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          {isRevoke ? 'Revoke Request Submitted!' : form.resourceIds.length === 1 ? 'Request Submitted!' : `${form.resourceIds.length} Requests Submitted!`}
        </h3>
        <p className="text-sm text-gray-500 mb-5">
          {isRevoke
            ? <>Revoke request for <strong>{resolvedRes.map(r => r.name).join(', ')}</strong> is pending approval.</>
            : form.resourceIds.length === 1
            ? <>Your request for <strong>{resolvedRes[0]?.name}</strong> is pending approval.</>
            : <>Your requests are now pending approval.</>}
        </p>

        <div className="w-full bg-gray-50 rounded-xl p-4 text-left text-sm space-y-3 mb-6">
          <div className="flex justify-between">
            <span className="text-gray-500">Source</span>
            <SystemBadge type={src?.type as SystemType} />
          </div>
          <div className="flex justify-between items-start gap-4">
            <span className="text-gray-500 flex-shrink-0">{level4Label}</span>
            <div className="flex flex-col items-end gap-1">
              {resolvedRes.map((r, i) => (
                <span key={form.resourceIds[i]} className="font-medium text-right">{r.name}</span>
              ))}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Access Level</span>
            {isRevoke ? (
              <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-red-500 text-white border-red-500">
                Revoke
              </span>
            ) : (
              <div className="flex gap-1 flex-wrap justify-end">
                {(['read', 'write', 'admin'] as const).filter((l) => selectedLevels.has(l)).map((l) => (
                  <span key={l} className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${LEVEL_META[l].activeColor}`}>
                    {l}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 w-full">
          <Button variant="secondary" className="flex-1"
            onClick={() => { setForm(EMPTY_FORM); setSelectedLevels(new Set()); setIsRevoke(false); setStep('form'); }}>
            New Request
          </Button>
          <Button variant="primary" className="flex-1" onClick={onClose}>Done</Button>
        </div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* For User */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          For User <span className="text-red-500">*</span>
        </label>
        <SearchableSelect
          value={form.targetUserId}
          onChange={(id) => updateField('targetUserId', id)}
          options={MOCK_USERS.filter((u) => u.status === 'active').map((u) => ({
            id: u.id, label: u.name, sub: u.department,
          }))}
          placeholder="Search user..."
          error={!!errors.targetUserId}
        />
        {errors.targetUserId && <p className="text-xs text-red-500 mt-1">{errors.targetUserId}</p>}
      </div>

      {/* Source */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Source <span className="text-red-500">*</span>
        </label>
        <SearchableSelect
          value={form.sourceId}
          onChange={(id) => updateField('sourceId', id)}
          options={sourceOptions}
          placeholder="Search source..."
          error={!!errors.sourceId}
        />
        {errors.sourceId && <p className="text-xs text-red-500 mt-1">{errors.sourceId}</p>}
      </div>

      {/* Database (SQL only) */}
      {form.sourceId && !isPowerBI && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Database <span className="text-red-500">*</span>
          </label>
          <SearchableSelect
            value={form.databaseId}
            onChange={(id) => updateField('databaseId', id)}
            options={databaseOptions}
            placeholder="Search database..."
            disabled={!form.sourceId}
            error={!!errors.databaseId}
            emptyText="No databases found"
          />
          {errors.databaseId && <p className="text-xs text-red-500 mt-1">{errors.databaseId}</p>}
        </div>
      )}

      {/* Schema (SQL) / Workspace (PowerBI) — multi */}
      {form.sourceId && (isPowerBI || form.databaseId) && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {level3Label} <span className="text-red-500">*</span>
            <span className="ml-1.5 text-xs font-normal text-gray-400">(multi-select)</span>
          </label>
          <MultiSearchableSelect
            values={form.schemaIds}
            onChange={updateSchemaIds}
            options={level3Options}
            placeholder={`Search ${level3Label.toLowerCase()}...`}
            disabled={level3Options.length === 0}
            error={!!errors.schemaIds}
            emptyText={`No ${level3Label.toLowerCase()}s found`}
          />
          {errors.schemaIds && <p className="text-xs text-red-500 mt-1">{errors.schemaIds}</p>}
        </div>
      )}

      {/* Table (SQL) / Report (PowerBI) — multi */}
      {form.schemaIds.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {level4Label} <span className="text-red-500">*</span>
            <span className="ml-1.5 text-xs font-normal text-gray-400">(multi-select)</span>
          </label>
          <MultiSearchableSelect
            values={form.resourceIds}
            onChange={updateResourceIds}
            options={level4Options}
            placeholder={`Search ${level4Label.toLowerCase()}...`}
            disabled={level4Options.length === 0}
            error={!!errors.resourceIds}
            emptyText={`No ${level4Label.toLowerCase()}s found`}
          />
          {errors.resourceIds && <p className="text-xs text-red-500 mt-1">{errors.resourceIds}</p>}
        </div>
      )}

      {/* Access Level */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Access Level <span className="text-red-500">*</span>
          <span className="ml-1.5 text-xs font-normal text-gray-400">(select one or more)</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['read', 'write', 'admin'] as const).map((level) => {
            const meta   = LEVEL_META[level];
            const active = selectedLevels.has(level);
            return (
              <button
                key={level}
                type="button"
                onClick={() => toggleLevel(level)}
                disabled={isRevoke}
                className={`py-2.5 px-3 rounded-lg border-2 text-left transition-colors ${
                  isRevoke
                    ? 'border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed'
                    : active
                    ? meta.activeColor
                    : `${meta.color} border-opacity-60 hover:border-opacity-100 bg-white`
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <p className="font-semibold text-sm capitalize">{level}</p>
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                    isRevoke ? 'border-gray-300' : active ? 'bg-white/30 border-white/60' : 'border-current'
                  }`}>
                    {active && !isRevoke && (
                      <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                        <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
                <p className="text-xs opacity-70">{meta.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Revoke option */}
        <div className="mt-2">
          <button
            type="button"
            onClick={toggleRevoke}
            className={`w-full py-2.5 px-3 rounded-lg border-2 text-left transition-colors ${
              isRevoke
                ? 'bg-red-500 border-red-500 text-white'
                : 'border-red-200 text-red-600 hover:border-red-400 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">Revoke</p>
                <p className={`text-xs ${isRevoke ? 'text-red-100' : 'text-red-400'}`}>Remove all access to selected resources</p>
              </div>
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                isRevoke ? 'bg-white/30 border-white/60' : 'border-red-300'
              }`}>
                {isRevoke && (
                  <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                    <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
          </button>
          {isRevoke && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm-.75 3.5h1.5v5h-1.5v-5zm0 6h1.5v1.5h-1.5V10.5z"/>
              </svg>
              Approving this request will remove all current permissions for the selected resources.
            </p>
          )}
        </div>

        {errors.accessLevels && <p className="text-xs text-red-500 mt-1">{errors.accessLevels}</p>}
      </div>

      {/* Reason */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Business Justification <span className="text-red-500">*</span>
        </label>
        <textarea
          value={form.reason}
          onChange={(e) => setErrors((err) => ({ ...err, reason: '' })) || setForm((f) => ({ ...f, reason: e.target.value }))}
          rows={3}
          placeholder="Describe why this access is needed..."
          className={`w-full px-3 py-2 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.reason ? 'border-red-400' : 'border-gray-300'
          }`}
        />
        <div className="flex justify-between mt-1">
          {errors.reason ? <p className="text-xs text-red-500">{errors.reason}</p> : <span />}
          <p className="text-xs text-gray-400">{form.reason.length} chars</p>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-1">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="primary" loading={loading}>
          {form.resourceIds.length > 1 ? `Submit ${form.resourceIds.length} Requests` : 'Submit Request'}
        </Button>
      </div>
    </form>
  );
};

// ─── Review Modal ─────────────────────────────────────────────────────────────

interface ReviewModalProps {
  request: AccessRequest | null;
  action: 'approve' | 'reject';
  onClose: () => void;
  onConfirm: (comment: string) => void;
  loading: boolean;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ request, action, onClose, onConfirm, loading }) => {
  const [comment, setComment] = useState('');
  if (!request) return null;
  const requester = MOCK_USERS.find((u) => u.id === request.requesterId);
  return (
    <Modal
      open={!!request}
      onClose={onClose}
      title={action === 'approve' ? 'Approve Request' : 'Reject Request'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            variant={action === 'approve' ? 'success' : 'danger'}
            loading={loading}
            onClick={() => onConfirm(comment)}
          >
            {action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Requester</span>
            <span className="font-medium">{requester?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Source</span>
            <SystemBadge type={request.systemType} />
          </div>
          <div className="flex justify-between items-start gap-4">
            <span className="text-gray-500 flex-shrink-0">Table / Report</span>
            <span className="font-medium text-right">
              {(request.resourceNames ?? [request.resourceName]).join(', ')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Access Level</span>
            {request.requestType === 'revoke' ? (
              <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-red-100 text-red-700 border-red-200">
                Revoke
              </span>
            ) : request.accessLevels && request.accessLevels.length > 0 ? (
              <div className="flex gap-1 flex-wrap justify-end">
                {request.accessLevels.map((l) => <AccessBadge key={l} level={l} />)}
              </div>
            ) : (
              <AccessBadge level={request.accessLevel} />
            )}
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          <strong>Reason:</strong> {request.reason}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Review Comment {action === 'reject' && <span className="text-red-500">*</span>}
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Add a comment (optional for approval, required for rejection)..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </Modal>
  );
};

// ─── Request Row ──────────────────────────────────────────────────────────────

interface RequestRowProps {
  request:   AccessRequest;
  isAdmin:   boolean;
  onApprove: (r: AccessRequest) => void;
  onReject:  (r: AccessRequest) => void;
}

const RequestRow: React.FC<RequestRowProps> = ({ request, isAdmin, onApprove, onReject }) => {
  const [expanded,    setExpanded]    = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);
  const menuRef                       = useRef<HTMLDivElement>(null);
  const requester = MOCK_USERS.find((u) => u.id === request.requesterId);
  const target    = MOCK_USERS.find((u) => u.id === request.targetUserId);
  const reviewer  = MOCK_USERS.find((u) => u.id === request.reviewerId);
  const isRevoke  = request.requestType === 'revoke';
  const showMenu  = isAdmin && request.status === 'pending';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const names            = request.resourceNames ?? [request.resourceName];
  const extraCount       = names.length - 1;
  const { sourceName, schemaWorkspace } = parsePath(request.resourcePath);

  return (
    <>
      <tr className={`border-b border-gray-50 hover:bg-gray-50/60 transition-colors ${expanded ? 'bg-blue-50/30' : ''}`}>

        {/* Requester */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Avatar initials={requester?.avatar ?? '?'} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{requester?.name}</p>
              <p className="text-xs text-gray-400 truncate">{requester?.email}</p>
            </div>
          </div>
        </td>

        {/* For User */}
        <td className="px-4 py-3">
          {requester?.id !== target?.id ? (
            <div className="flex items-center gap-2">
              <Avatar initials={target?.avatar ?? '?'} size="sm" />
              <p className="text-sm text-gray-700 truncate">{target?.name}</p>
            </div>
          ) : (
            <span className="text-xs text-gray-400 italic">Self</span>
          )}
        </td>

        {/* Source */}
        <td className="px-4 py-3">
          <SystemBadge type={request.systemType} />
          {sourceName && (
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[120px]">{sourceName}</p>
          )}
        </td>

        {/* Schema / Workspace */}
        <td className="px-4 py-3 max-w-[140px]">
          {schemaWorkspace
            ? <p className="text-sm text-gray-700 truncate">{schemaWorkspace}</p>
            : <span className="text-xs text-gray-400">—</span>
          }
        </td>

        {/* Table / Report */}
        <td className="px-4 py-3 max-w-[160px]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-medium text-gray-800 truncate">{names[0]}</p>
            {extraCount > 0 && (
              <span className="flex-shrink-0 text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                +{extraCount}
              </span>
            )}
          </div>
        </td>

        {/* Access Level */}
        <td className="px-4 py-3">
          {isRevoke ? (
            <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-red-100 text-red-700 border-red-200">
              Revoke
            </span>
          ) : request.accessLevels && request.accessLevels.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {request.accessLevels.map((l) => <AccessBadge key={l} level={l} />)}
            </div>
          ) : (
            <AccessBadge level={request.accessLevel} />
          )}
        </td>

        {/* Status */}
        <td className="px-4 py-3"><StatusBadge status={request.status} /></td>

        {/* Date */}
        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
          {new Date(request.createdAt).toLocaleDateString()}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            {/* 3-dot action menu */}
            {showMenu && (
              <div ref={menuRef} className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  title="Actions"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 z-50 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                    <button
                      onClick={() => { onApprove(request); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-700 hover:bg-green-50 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => { onReject(request); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            )}
            {/* Expand toggle */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </td>
      </tr>

      {expanded && (
        <tr className="border-b border-gray-100">
          <td colSpan={9} className="px-6 py-4 bg-gray-50/70">
            <div className="space-y-3 text-sm max-w-3xl">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Submitted</p>
                  <p className="font-medium text-gray-700">{new Date(request.createdAt).toLocaleString()}</p>
                </div>
                {request.updatedAt !== request.createdAt && (
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Last Updated</p>
                    <p className="font-medium text-gray-700">{new Date(request.updatedAt).toLocaleString()}</p>
                  </div>
                )}
                {reviewer && (
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Reviewed by</p>
                    <p className="font-medium text-gray-700">{reviewer.name}</p>
                  </div>
                )}
              </div>
              {names.length > 1 && (
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-2">Resources ({names.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {names.map((n) => (
                      <span key={n} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-md font-medium">{n}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Business Justification</p>
                <p className="text-gray-700">{request.reason}</p>
              </div>
              {request.reviewerComment && (
                <div className="flex gap-2 bg-white border border-gray-200 rounded-lg p-3">
                  <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Reviewer Comment</p>
                    <p className="text-gray-700">{request.reviewerComment}</p>
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export const AccessRequests: React.FC = () => {
  const { requests, approveRequest, rejectRequest, currentUser } = useStore();
  const [activeTab,     setActiveTab]     = useState<Tab>('all');
  const [showForm,      setShowForm]      = useState(false);
  const [modalRequest,  setModalRequest]  = useState<AccessRequest | null>(null);
  const [modalAction,   setModalAction]   = useState<'approve' | 'reject'>('approve');
  const [actionLoading, setActionLoading] = useState(false);

  const isAdmin  = currentUser.role === 'admin';
  const filtered = requests.filter((r) => activeTab === 'all' || r.status === activeTab);

  const counts: Record<Tab, number> = {
    all:      requests.length,
    pending:  requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
  };

  async function handleConfirm(comment: string) {
    if (!modalRequest) return;
    if (modalAction === 'reject' && !comment.trim()) {
      alert('A rejection comment is required.');
      return;
    }
    setActionLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    if (modalAction === 'approve') {
      approveRequest(modalRequest.id, currentUser.id, comment || 'Approved.');
    } else {
      rejectRequest(modalRequest.id, currentUser.id, comment);
    }
    setActionLoading(false);
    setModalRequest(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Access Requests</h1>
          <p className="text-sm text-gray-500 mt-1">Submit new requests and review pending approvals.</p>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(true)}>
          New Request
        </Button>
      </div>

      <Card>
        <div className="flex flex-wrap gap-2">
          {TABS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setActiveTab(value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {value === 'pending'  && <Clock        className="w-4 h-4" />}
              {value === 'approved' && <CheckCircle2 className="w-4 h-4" />}
              {value === 'rejected' && <XCircle      className="w-4 h-4" />}
              {label}
              <span className={`ml-0.5 text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === value ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {counts[value]}
              </span>
            </button>
          ))}
        </div>
      </Card>

      <Card padding={false} className="overflow-x-auto scrollbar-thin">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <FileText className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No {activeTab === 'all' ? '' : activeTab} requests</p>
            <p className="text-sm text-gray-400 mt-1">
              {activeTab === 'all' || activeTab === 'pending' ? 'Click "New Request" to submit one.' : 'Nothing to show here.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Requester','For User','Source','Schema / Workspace','Table / Report','Access Level','Status','Date',''].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((req) => (
                <RequestRow
                  key={req.id}
                  request={req}
                  isAdmin={isAdmin}
                  onApprove={(r) => { setModalRequest(r); setModalAction('approve'); }}
                  onReject={(r)  => { setModalRequest(r); setModalAction('reject');  }}
                />
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Access Request" size="md">
        <RequestForm onClose={() => setShowForm(false)} />
      </Modal>

      <ReviewModal
        request={modalRequest}
        action={modalAction}
        onClose={() => setModalRequest(null)}
        onConfirm={handleConfirm}
        loading={actionLoading}
      />
    </div>
  );
};
