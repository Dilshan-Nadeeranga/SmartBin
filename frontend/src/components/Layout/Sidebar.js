import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Home, 
  Map, 
  QrCode, 
  User, 
  Settings,
  BarChart3,
  Truck,
  Users,
  Shield,
  Trash2,
  CreditCard,
  Bell,
  FileText
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();

  const getNavigationItems = () => {
    const baseItems = [
      {
        name: 'Dashboard',
        href: getDashboardPath(),
        icon: Home,
        exact: true
      },
      {
        name: 'Map',
        href: '/map',
        icon: Map
      },
      {
        name: 'QR Scanner',
        href: '/scanner',
        icon: QrCode
      },
      {
        name: 'Profile',
        href: '/profile',
        icon: User
      }
    ];

    // Add role-specific items
    switch (user?.role) {
      case 'resident':
        return [
          ...baseItems,
          {
            name: 'Upgrade to Premium',
            href: '/upgrade',
            icon: CreditCard,
            highlight: true
          }
        ];

      case 'premium_resident':
        return [
          ...baseItems,
          {
            name: 'Bulk Collection',
            href: '/bulk-collection',
            icon: Trash2
          },
          {
            name: 'Payment History',
            href: '/payments',
            icon: CreditCard
          }
        ];

      case 'collector':
        return [
          ...baseItems,
          {
            name: 'My Routes',
            href: '/routes',
            icon: Truck
          },
          {
            name: 'Collections',
            href: '/collections',
            icon: Trash2
          },
          {
            name: 'Performance',
            href: '/performance',
            icon: BarChart3
          }
        ];

      case 'admin':
        return [
          ...baseItems,
          {
            name: 'Bins Management',
            href: '/admin/bins',
            icon: Trash2
          },
          {
            name: 'Collectors',
            href: '/admin/collectors',
            icon: Users
          },
          {
            name: 'Routes',
            href: '/admin/routes',
            icon: Truck
          },
          {
            name: 'Reports',
            href: '/admin/reports',
            icon: FileText
          },
          {
            name: 'System Settings',
            href: '/admin/settings',
            icon: Settings
          }
        ];

      default:
        return baseItems;
    }
  };

  const getDashboardPath = () => {
    switch (user?.role) {
      case 'resident':
        return '/dashboard/resident';
      case 'premium_resident':
        return '/dashboard/premium';
      case 'collector':
        return '/dashboard/collector';
      case 'admin':
        return '/dashboard/admin';
      default:
        return '/dashboard/resident';
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">🗑️</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Smart Waste</h2>
            <p className="text-xs text-gray-500">Management System</p>
          </div>
        </div>
      </div>

      <nav className="mt-6">
        <div className="px-3">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.exact}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2 mb-1 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                      : item.highlight
                      ? 'text-primary-600 hover:bg-primary-50 hover:text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
                {item.highlight && (
                  <span className="ml-auto px-2 py-0.5 text-xs bg-primary-100 text-primary-700 rounded-full">
                    Pro
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* User info section */}
        <div className="mt-8 px-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <div className="mt-2">
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                user?.role === 'admin' ? 'role-admin' :
                user?.role === 'collector' ? 'role-collector' :
                user?.role === 'premium_resident' ? 'role-premium' :
                'role-resident'
              }`}>
                {user?.role === 'premium_resident' ? 'Premium User' :
                 user?.role === 'collector' ? 'Collector' :
                 user?.role === 'admin' ? 'Administrator' :
                 'Resident'}
              </span>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
