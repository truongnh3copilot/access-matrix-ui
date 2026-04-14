import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts';
import {
  Users, Shield, Database, Clock, TrendingUp, CheckCircle2,
  XCircle, AlertCircle,
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useStore } from '../store/useStore';
import { MOCK_USERS } from '../data/users';
import { MOCK_DATA_SOURCES } from '../data/dataSources';

const ACCESS_BY_SYSTEM = [
  { name: 'Redshift',   users: 5, tables: 8 },
  { name: 'PostgreSQL', users: 3, tables: 6 },
  { name: 'SQL Server', users: 2, tables: 3 },
  { name: 'Power BI',   users: 6, reports: 8 },
];

const REQUEST_TREND = [
  { month: 'Nov', submitted: 4, approved: 3, rejected: 1 },
  { month: 'Dec', submitted: 6, approved: 5, rejected: 1 },
  { month: 'Jan', submitted: 8, approved: 7, rejected: 1 },
  { month: 'Feb', submitted: 5, approved: 4, rejected: 1 },
  { month: 'Mar', submitted: 9, approved: 7, rejected: 2 },
  { month: 'Apr', submitted: 6, approved: 3, rejected: 1 },
];

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bg: string;
  delta?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon: Icon, color, bg, delta }) => (
  <Card className="flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
      <Icon className={`w-6 h-6 ${color}`} />
    </div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {delta && <p className="text-xs text-green-600 mt-0.5 flex items-center gap-1"><TrendingUp className="w-3 h-3" />{delta}</p>}
    </div>
  </Card>
);

export const Dashboard: React.FC = () => {
  const { requests } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  const pending  = requests.filter((r) => r.status === 'pending').length;
  const approved = requests.filter((r) => r.status === 'approved').length;
  const rejected = requests.filter((r) => r.status === 'rejected').length;
  const recentRequests = [...requests].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 5);

  if (loading) return <LoadingSpinner size="lg" text="Loading dashboard..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Data Access Governance Overview</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Total Users"
          value={MOCK_USERS.length}
          icon={Users}
          color="text-blue-600"
          bg="bg-blue-50"
          delta="+2 this month"
        />
        <MetricCard
          title="Data Sources"
          value={MOCK_DATA_SOURCES.length}
          icon={Database}
          color="text-purple-600"
          bg="bg-purple-50"
        />
        <MetricCard
          title="Pending Requests"
          value={pending}
          icon={Clock}
          color="text-yellow-600"
          bg="bg-yellow-50"
        />
        <MetricCard
          title="Total Roles"
          value={5}
          icon={Shield}
          color="text-green-600"
          bg="bg-green-50"
        />
      </div>

      {/* Request summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
          <div>
            <p className="text-2xl font-bold text-green-700">{approved}</p>
            <p className="text-sm text-green-600">Approved</p>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-8 h-8 text-yellow-500" />
          <div>
            <p className="text-2xl font-bold text-yellow-700">{pending}</p>
            <p className="text-sm text-yellow-600">Pending</p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <XCircle className="w-8 h-8 text-red-400" />
          <div>
            <p className="text-2xl font-bold text-red-700">{rejected}</p>
            <p className="text-sm text-red-600">Rejected</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Access by System" subtitle="Active users per data source" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ACCESS_BY_SYSTEM} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="users" name="Users" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardHeader title="Request Trend" subtitle="Last 6 months" />
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={REQUEST_TREND} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="submitted" stroke="#6366f1" strokeWidth={2} dot={false} name="Submitted" />
              <Line type="monotone" dataKey="approved"  stroke="#22c55e" strokeWidth={2} dot={false} name="Approved"  />
              <Line type="monotone" dataKey="rejected"  stroke="#ef4444" strokeWidth={2} dot={false} name="Rejected"  />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent requests */}
      <Card padding={false}>
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Recent Access Requests</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {recentRequests.map((req) => {
            const requester = MOCK_USERS.find((u) => u.id === req.requesterId);
            return (
              <div key={req.id} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50/60">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                    {requester?.avatar}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{requester?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{req.resourcePath}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <span className="text-xs text-gray-400 hidden sm:block">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </span>
                  <StatusBadge status={req.status} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
