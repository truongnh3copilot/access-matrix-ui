import React, { useState } from 'react';
import { UserPlus, Search, Shield, Users } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { UserStatusBadge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { MOCK_USERS, MOCK_ROLES } from '../data/users';
import { User } from '../types';

type Tab = 'users' | 'roles';

const ROLE_LABEL: Record<string, string> = {
  admin:         'Admin',
  data_analyst:  'Data Analyst',
  data_engineer: 'Data Engineer',
  viewer:        'Viewer',
  manager:       'Manager',
};

interface UserDetailModalProps {
  user: User | null;
  onClose: () => void;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ user, onClose }) => {
  if (!user) return null;
  const role = MOCK_ROLES.find((r) => r.name.toLowerCase().replace(' ', '_') === user.role ||
    r.name.toLowerCase() === user.role.replace('_', ' '));
  return (
    <Modal open={!!user} onClose={onClose} title="User Details" size="md"
      footer={<Button variant="secondary" onClick={onClose}>Close</Button>}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar initials={user.avatar} size="lg" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
            <p className="text-sm text-gray-500">{user.email}</p>
            <UserStatusBadge status={user.status} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Department</p>
            <p className="font-medium mt-0.5">{user.department}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Role</p>
            <p className="font-medium mt-0.5">{ROLE_LABEL[user.role] ?? user.role}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Member Since</p>
            <p className="font-medium mt-0.5">{user.createdAt}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Status</p>
            <p className="font-medium mt-0.5 capitalize">{user.status}</p>
          </div>
        </div>
        {role && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Permissions via <em>{role.name}</em></p>
            <div className="flex flex-wrap gap-2">
              {role.permissions.map((p) => (
                <span key={p} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg font-mono">
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export const UserManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const filteredUsers = MOCK_USERS.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users & Roles</h1>
          <p className="text-sm text-gray-500 mt-1">Manage users and role assignments.</p>
        </div>
        <Button variant="primary" icon={<UserPlus className="w-4 h-4" />}>
          Add User
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(['users', 'roles'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              activeTab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'users' ? <Users className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
            {t}
          </button>
        ))}
      </div>

      {activeTab === 'users' ? (
        <Card padding={false}>
          {/* Search */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <span className="text-sm text-gray-400">{filteredUsers.length} users</span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">User</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden md:table-cell">Department</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Role</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden sm:table-cell">Status</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden lg:table-cell">Joined</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar initials={user.avatar} size="sm" />
                        <div>
                          <p className="font-medium text-gray-800">{user.name}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell text-gray-600">{user.department}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded font-medium">
                        {ROLE_LABEL[user.role] ?? user.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell">
                      <UserStatusBadge status={user.status} />
                    </td>
                    <td className="px-5 py-3 text-gray-400 hidden lg:table-cell text-xs">{user.createdAt}</td>
                    <td className="px-5 py-3">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedUser(user)}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <EmptyState icon={Users} title="No users found" description="Try adjusting your search." />
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_ROLES.map((role) => (
            <Card key={role.id}>
              <CardHeader
                title={role.name}
                subtitle={`${role.userCount} users`}
                action={
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-blue-600" />
                  </div>
                }
              />
              <p className="text-sm text-gray-500 mb-4">{role.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {role.permissions.slice(0, 4).map((p) => (
                  <span key={p} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded font-mono">
                    {p}
                  </span>
                ))}
                {role.permissions.length > 4 && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">
                    +{role.permissions.length - 4} more
                  </span>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-xs text-gray-400">
                <span>Created {role.createdAt}</span>
                <Button variant="ghost" size="sm">Edit</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />
    </div>
  );
};
