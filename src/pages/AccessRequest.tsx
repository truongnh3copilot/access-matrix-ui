import React, { useState } from 'react';
import { CheckCircle2, FileText } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SystemBadge } from '../components/ui/Badge';
import { AccessLevel, SystemType } from '../types';
import { MOCK_USERS } from '../data/users';
import { MOCK_DATA_SOURCES } from '../data/dataSources';
import { useStore } from '../store/useStore';

type Step = 'form' | 'success';

interface FormState {
  targetUserId: string;
  systemType: string;
  resourceId: string;
  resourceName: string;
  resourcePath: string;
  accessLevel: string;
  reason: string;
}

const INITIAL_FORM: FormState = {
  targetUserId: '',
  systemType: '',
  resourceId: '',
  resourceName: '',
  resourcePath: '',
  accessLevel: '',
  reason: '',
};

function getResources(systemType: SystemType | '') {
  if (!systemType) return [];
  const ds = MOCK_DATA_SOURCES.filter((d) => d.type === systemType);
  const rows: { id: string; name: string; path: string }[] = [];
  for (const d of ds) {
    if (d.databases) {
      for (const db of d.databases) {
        for (const sch of db.schemas) {
          for (const t of sch.tables) {
            rows.push({ id: t.id, name: t.name, path: `${db.name} › ${sch.name}` });
          }
        }
      }
    }
    if (d.workspaces) {
      for (const ws of d.workspaces) {
        for (const rpt of ws.reports) {
          rows.push({ id: rpt.id, name: rpt.name, path: ws.name });
        }
      }
    }
  }
  return rows;
}

export const AccessRequest: React.FC = () => {
  const { submitRequest, currentUser } = useStore();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<FormState>>({});

  const resources = getResources(form.systemType as SystemType | '');

  function update(field: keyof FormState, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'systemType') {
        next.resourceId = '';
        next.resourceName = '';
        next.resourcePath = '';
      }
      if (field === 'resourceId') {
        const found = resources.find((r) => r.id === value);
        next.resourceName = found?.name ?? '';
        next.resourcePath = found?.path ?? '';
      }
      return next;
    });
    setErrors((e) => ({ ...e, [field]: '' }));
  }

  function validate(): boolean {
    const e: Partial<FormState> = {};
    if (!form.targetUserId) e.targetUserId = 'Required';
    if (!form.systemType)   e.systemType   = 'Required';
    if (!form.resourceId)   e.resourceId   = 'Required';
    if (!form.accessLevel)  e.accessLevel  = 'Required';
    if (!form.reason.trim()) e.reason      = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    submitRequest({
      requesterId: currentUser.id,
      targetUserId: form.targetUserId,
      systemType: form.systemType as SystemType,
      resourceId: form.resourceId,
      resourceName: form.resourceName,
      resourcePath: `${form.resourcePath} › ${form.resourceName}`,
      accessLevel: form.accessLevel as AccessLevel,
      reason: form.reason,
    });
    setLoading(false);
    setStep('success');
  }

  function reset() {
    setForm(INITIAL_FORM);
    setStep('form');
    setErrors({});
  }

  if (step === 'success') {
    return (
      <div className="max-w-lg mx-auto pt-12">
        <Card className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
          <p className="text-gray-500 mb-6">
            Your access request for <strong>{form.resourceName}</strong> has been submitted and is pending approval.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-left text-sm space-y-2 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-500">System</span>
              <SystemBadge type={form.systemType as SystemType} />
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Resource</span>
              <span className="font-medium">{form.resourceName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Access Level</span>
              <span className="font-medium capitalize">{form.accessLevel}</span>
            </div>
          </div>
          <Button onClick={reset} variant="secondary" className="w-full">
            Submit Another Request
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Access Request</h1>
        <p className="text-sm text-gray-500 mt-1">Request access to data resources for yourself or team members.</p>
      </div>

      <Card>
        <CardHeader title="Request Details" icon={<FileText className="w-5 h-5 text-gray-400" />} />
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Target User */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              For User <span className="text-red-500">*</span>
            </label>
            <select
              value={form.targetUserId}
              onChange={(e) => update('targetUserId', e.target.value)}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.targetUserId ? 'border-red-400' : 'border-gray-300'
              }`}
            >
              <option value="">Select user...</option>
              {MOCK_USERS.filter((u) => u.status === 'active').map((u) => (
                <option key={u.id} value={u.id}>{u.name} — {u.department}</option>
              ))}
            </select>
            {errors.targetUserId && <p className="text-xs text-red-500 mt-1">{errors.targetUserId}</p>}
          </div>

          {/* System */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              System <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['redshift', 'postgresql', 'sqlserver', 'powerbi'] as SystemType[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => update('systemType', s)}
                  className={`py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                    form.systemType === s
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  {s === 'powerbi' ? 'Power BI' : s === 'sqlserver' ? 'SQL Server' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            {errors.systemType && <p className="text-xs text-red-500 mt-1">{errors.systemType}</p>}
          </div>

          {/* Resource */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Resource <span className="text-red-500">*</span>
            </label>
            <select
              value={form.resourceId}
              onChange={(e) => update('resourceId', e.target.value)}
              disabled={!form.systemType}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400 ${
                errors.resourceId ? 'border-red-400' : 'border-gray-300'
              }`}
            >
              <option value="">{form.systemType ? 'Select resource...' : 'Select a system first'}</option>
              {resources.map((r) => (
                <option key={r.id} value={r.id}>{r.name} ({r.path})</option>
              ))}
            </select>
            {errors.resourceId && <p className="text-xs text-red-500 mt-1">{errors.resourceId}</p>}
          </div>

          {/* Access Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Access Level <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['read', 'write', 'admin'] as const).map((level) => {
                const metaMap: Record<string, { color: string; desc: string }> = {
                  read:  { color: 'border-blue-400 bg-blue-50 text-blue-700',         desc: 'View data only' },
                  write: { color: 'border-purple-400 bg-purple-50 text-purple-700',   desc: 'Read + write'   },
                  admin: { color: 'border-red-400 bg-red-50 text-red-700',            desc: 'Full control'   },
                };
                const meta = metaMap[level];
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => update('accessLevel', level)}
                    className={`py-3 px-4 rounded-lg border-2 text-left transition-colors ${
                      form.accessLevel === level ? meta.color : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <p className="font-semibold text-sm capitalize">{level}</p>
                    <p className="text-xs opacity-70">{meta.desc}</p>
                  </button>
                );
              })}
            </div>
            {errors.accessLevel && <p className="text-xs text-red-500 mt-1">{errors.accessLevel}</p>}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Business Justification <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.reason}
              onChange={(e) => update('reason', e.target.value)}
              rows={3}
              placeholder="Describe why this access is needed..."
              className={`w-full px-3 py-2 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.reason ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            <div className="flex justify-between mt-1">
              {errors.reason ? (
                <p className="text-xs text-red-500">{errors.reason}</p>
              ) : <span />}
              <p className="text-xs text-gray-400">{form.reason.length} chars</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={reset}>
              Clear
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              Submit Request
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
