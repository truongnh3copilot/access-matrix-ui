import React, { useState } from 'react';
import { CheckCircle2, XCircle, Clock, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge, SystemBadge, AccessBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Avatar } from '../components/ui/Avatar';
import { AccessRequest, RequestStatus } from '../types';
import { MOCK_USERS } from '../data/users';
import { useStore } from '../store/useStore';

type Tab = RequestStatus | 'all';

const TABS: { value: Tab; label: string }[] = [
  { value: 'all',      label: 'All'      },
  { value: 'pending',  label: 'Pending'  },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

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

interface RequestRowProps {
  request: AccessRequest;
  isAdmin: boolean;
  onApprove: (r: AccessRequest) => void;
  onReject: (r: AccessRequest) => void;
}

const RequestRow: React.FC<RequestRowProps> = ({ request, isAdmin, onApprove, onReject }) => {
  const [expanded, setExpanded] = useState(false);
  const requester = MOCK_USERS.find((u) => u.id === request.requesterId);
  const target    = MOCK_USERS.find((u) => u.id === request.targetUserId);
  const reviewer  = MOCK_USERS.find((u) => u.id === request.reviewerId);

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <div className="flex items-center gap-4 px-5 py-4 bg-white hover:bg-gray-50/60 transition-colors">
        {/* Requester */}
        <Avatar initials={requester?.avatar ?? '?'} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-800 text-sm">{requester?.name}</span>
            {requester?.id !== target?.id && (
              <span className="text-xs text-gray-400">on behalf of <strong>{target?.name}</strong></span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{request.resourcePath} › {request.resourceName}</p>
        </div>

        {/* Meta */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          <SystemBadge type={request.systemType} />
          <AccessBadge level={request.accessLevel} />
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={request.status} />
          {/* Actions */}
          {isAdmin && request.status === 'pending' && (
            <>
              <Button
                variant="success"
                size="sm"
                icon={<CheckCircle2 className="w-4 h-4" />}
                onClick={() => onApprove(request)}
              >
                Approve
              </Button>
              <Button
                variant="danger"
                size="sm"
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

      {/* Expanded detail */}
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

export const ApprovalWorkflow: React.FC = () => {
  const { requests, approveRequest, rejectRequest, currentUser } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [modalRequest, setModalRequest] = useState<AccessRequest | null>(null);
  const [modalAction, setModalAction] = useState<'approve' | 'reject'>('approve');
  const [actionLoading, setActionLoading] = useState(false);

  const isAdmin = currentUser.role === 'admin';

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Approval Workflow</h1>
        <p className="text-sm text-gray-500 mt-1">Review and manage access requests.</p>
      </div>

      {/* Tabs */}
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
              {value === 'pending'  && <Clock className="w-4 h-4" />}
              {value === 'approved' && <CheckCircle2 className="w-4 h-4" />}
              {value === 'rejected' && <XCircle className="w-4 h-4" />}
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
          <Card className="text-center py-12">
            <p className="text-gray-400">No {activeTab === 'all' ? '' : activeTab} requests found.</p>
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
