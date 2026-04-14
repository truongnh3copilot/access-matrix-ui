import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Grid3X3,
  FileText,
  Users,
  Database,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { useStore } from '../../store/useStore';

const NAV_ITEMS = [
  { to: '/',               icon: LayoutDashboard, label: 'Dashboard'        },
  { to: '/access-matrix',  icon: Grid3X3,         label: 'Access Matrix'   },
  { to: '/requests',       icon: FileText,        label: 'Access Requests' },
  { to: '/users',          icon: Users,           label: 'Users & Roles'   },
  { to: '/data-sources',   icon: Database,        label: 'Data Sources'    },
  { to: '/audit',          icon: ScrollText,      label: 'Audit Log'       },
];

export const Sidebar: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar } = useStore();

  return (
    <aside
      className={`
        h-screen bg-gray-900 text-gray-300 flex flex-col fixed left-0 top-0 z-30
        transition-all duration-200
        ${sidebarCollapsed ? 'w-16' : 'w-60'}
      `}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-700/60 flex-shrink-0">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-white" />
        </div>
        {!sidebarCollapsed && (
          <div className="overflow-hidden">
            <p className="text-white font-semibold text-sm leading-tight">AccessMatrix</p>
            <p className="text-gray-400 text-xs">Data Governance</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto scrollbar-thin">
        {!sidebarCollapsed && (
          <p className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Main Menu
          </p>
        )}
        <ul className="space-y-0.5 px-2">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:bg-gray-700/60 hover:text-gray-100'
                  }`
                }
                title={sidebarCollapsed ? label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && <span className="truncate">{label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Collapse toggle */}
      <div className="px-2 py-3 border-t border-gray-700/60">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-700/60 hover:text-gray-100 transition-colors text-sm"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
