import React, { useState } from 'react';
import {
  CheckCircle2, XCircle, Clock, MessageSquare,
  ChevronDown, ChevronUp, Plus, FileText,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SystemBadge, AccessBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Avatar } from '../components/ui/Avatar';
import { AccessRequest, AccessLevel, RequestStatus, SystemType } from '../types';
import { MOCK_USERS } from '../data/users';
import { MOCK_DATA_SOURCES } from '../data/dataSources';
import { useStore } from '../store/useStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Tab = RequestStatus | 'all';

const TABS: { value: Tab; label: string }[] = [
  { value: 'all',      label: 'All'      },
  { value: 'pending',  label: 'Pending'  },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

function getResources(systemType: SystemType | '') {
  if (!systemType) return [];
  const rows: { id: string; name: string; path: string }[] = [];
  for (const d of MOCK_DATA_SOURCES.filter((x) => x.type === systemType)) {
    if (d.databases) {
      for (const db of d.databases)
        for (const sch of db.schemas)
          for (const t of sch.tables)
            rows.push({ id: t.id, name: t.name, path: `${db.name} › ${sch.name}` });
    }
    if (d.workspaces) {
      for (const ws of d.workspaces)
        for (const rpt of ws.reports)
          rows.push({ id: rpt.id, name: rpt.name, path: ws.name });
    }
  }
  return rows;
}

// ─── Request Form (inside modal) ─────────────────────────────────────────────

interface FormState {
  targetUserId: string;
  systemType: string;
  resourceId: string;
  resourceName: string;
  resourcePath: string;
  accessLevel: string;
  reason: string;
}

const EMPTY_FORM: FormState = {
  targetUserId: '', systemType: '', resourceId: '',
  resourceName: '', resourcePath: '', accessLevel: '', reason: '',
};

type FormStep = 'form' | 'success';

interface RequestFormProps {
  onClose: () => void;
}

const RequestForm: React.FC<RequestFormProps> = ({ onClose }) => {
  const { submitRequest, currentUser } = useStore();
  const [form, setForm]     = useState<FormState>(EMPTY_FORM);
  const [step, setStep]     = useState<FormStep>('form');
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

  function validate() {
    const e: Partial<FormState> = {};
    if (!form.targetUserId)  e.targetUserId = 'Required';
    if (!form.systemType)    e.systemType   = 'Required';
    if (!form.resourceId)    e.resourceId   = 'Required';
    if (!form.accessLevel)   e.accessLevel  = 'Required';
    if (!form.reason.trim()) e.reason       = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    submitRequest({
      requesterId:  currentUser.id,
      targetUserId: form.targetUserId,
      systemType:   form.systemType as SystemType,
      resourceId:   form.resourceId,
      resourceName: form.resourceName,
      resourcePath: `${form.resourcePath} › ${form.resourceName}`,
      accessLevel:  form.accessLevel as AccessLevel,
      reason:       form.reason,
    });
    setLoading(false);
    setStep('success');
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="flex flex-col items-center text-center py-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Request Submitted!</h3>
        <p className="text-sm text-gray-500 mb-6">
          Your request for <strong>{form.resourceName}</strong> is now pending approval.
        </p>
        <div className="w-full bg-gray-50 rounded-xl p-4 text-left text-sm space-y-2 mb-6">
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
        <div className="flex gap-3 w-full">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => { setForm(EMPTY_FORM); setStep('form'); }}
          >
            New Request
          </Button>
          <Button variant="primary" className="flex-1" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    );
  }

  // ── Form state ─────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* For User */}
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
              className={`py-2.5 rounded-lg border-2 text-xs font-medium transition-colors ${
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
              read:  { color: 'border-blue-400 bg-blue-50 text-blue-700',       desc: 'View only'    },
              write: { color: 'border-purple-400 bg-purple-50 text-purple-700', desc: 'Read + write' },
              admin: { color: 'border-red-400 bg-red-50 text-red-700',          desc: 'Full control' },
            };
            const meta = metaMap[level];
            return (
              <button
                key={level}
                type="button"
                onClick={() => update('accessLevel', level)}
                className={`py-2.5 px-3 rounded-lg border-2 text-left transition-colors ${
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
          {errors.reason
            ? <p className="text-xs text-red-500">{errors.reason}</p>
            : <span />
          }
          <p className="text-xs text-gray-400">{form.reason.length} chars</p>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-1">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="primary" loading={loading}>
          Submit Request
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
            <span className="text-gray-500">System</span>
            <SystemBadge type={request.systemType} />
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Resource</span>
            <span className="font-medium">{request.resourceName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Access Level</span>
            <AccessBadge level={request.accessLevel} />
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
  request: AccessRequest;
  isAdmin: boolean;
  onApprove: (r: AccessRequest) => void;
  onReject:  (r: AccessRequest) => void;
}

const RequestRow: React.FC<RequestRowProps> = ({ request, isAdmin, onApprove, onReject }) => {
  const [expanded, setExpanded] = useState(false);
  const requester = MOCK_USERS.find((u) => u.id === request.requesterId);
  const target    = MOCK_USERS.find((u) => u.id === request.targetUserId);
  const reviewer  = MOCK_USERS.find((u) => u.id === request.reviewerId);

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <div className="flex items-center gap-4 px-5 py-4 bg-white hover:bg-gray-50/60 transition-colors">
        <Avatar initials={requester?.avatar ?? '?'} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-800 text-sm">{requester?.name}</span>
            {requester?.id !== target?.id && (
              <span className="text-xs text-gray-400">
                on behalf of <strong>{target?.name}</strong>
              </span>
            )}
            {request.requestType === 'revoke' ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                Remove Access
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                Grant Access
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {request.resourcePath} › {request.resourceName}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {isAdmin && request.status === 'pending' && (
            <>
              <Button
                variant="success" size="sm"
                icon={<CheckCircle2 className="w-4 h-4" />}
                onClick={() => onApprove(request)}
              >
                Approve
              </Button>
              <Button
                variant="danger" size="sm"
                icon={<XCircle className="w-4 h-4" />}
                onClick={() => onReject(request)}
              >
                Reject
              </Button>
            </>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/60 px-5 py-4 space-y-3 text-sm">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500">Submitted</p>
              <p className="font-medium">{new Date(request.createdAt).toLocaleString()}</p>
            </div>
            {request.updatedAt !== request.createdAt && (
              <div>
                <p className="text-xs text-gray-500">Updated</p>
                <p className="font-medium">{new Date(request.updatedAt).toLocaleString()}</p>
              </div>
            )}
            {reviewer && (
              <div>
                <p className="text-xs text-gray-500">Reviewed by</p>
                <p className="font-medium">{reviewer.name}</p>
              </div>
            )}
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Business Justification</p>
            <p className="text-gray-700">{request.reason}</p>
          </div>
          {request.reviewerComment && (
            <div className="flex gap-2">
              <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Reviewer Comment</p>
                <p className="text-gray-700">{request.reviewerComment}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export const AccessRequests: React.FC = () => {
  const { requests, approveRequest, rejectRequest, currentUser } = useStore();
  const [activeTab,    setActiveTab]    = useState<Tab>('all');
  const [showForm,     setShowForm]     = useState(false);
  const [modalRequest, setModalRequest] = useState<AccessRequest | null>(null);
  const [modalAction,  setModalAction]  = useState<'approve' | 'reject'>('approve');
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
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Access Requests</h1>
          <p className="text-sm text-gray-500 mt-1">
            Submit new requests and review pending approvals.
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setShowForm(true)}
        >
          New Request
        </Button>
      </div>

      {/* Status tabs */}
      <Card>
        <div className="flex flex-wrap gap-2">
          {TABS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setActiveTab(value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {value === 'pending'  && <Clock       className="w-4 h-4" />}
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

      {/* Request list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="text-center py-16">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No {activeTab === 'all' ? '' : activeTab} requests</p>
            <p className="text-sm text-gray-400 mt-1">
              {activeTab === 'all' || activeTab === 'pending'
                ? 'Click "New Request" to submit one.'
                : 'Nothing to show here.'}
            </p>
          </Card>
        ) : (
          filtered.map((req) => (
            <RequestRow
              key={req.id}
              request={req}
              isAdmin={isAdmin}
              onApprove={(r) => { setModalRequest(r); setModalAction('approve'); }}
              onReject={(r)  => { setModalRequest(r); setModalAction('reject');  }}
            />
          ))
        )}
      </div>

      {/* New Request modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="New Access Request"
        size="md"
      >
        <RequestForm onClose={() => setShowForm(false)} />
      </Modal>

      {/* Approve / Reject modal */}
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
