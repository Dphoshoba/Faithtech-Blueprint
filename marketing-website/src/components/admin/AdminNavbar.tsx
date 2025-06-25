import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import useAdminAuth from '../../hooks/useAdminAuth';

interface AdminNavbarProps {
  onLogout?: () => void;
}

export default function AdminNavbar({ onLogout }: AdminNavbarProps) {
  const router = useRouter();
  const { logout } = useAdminAuth();
  const currentPath = router.pathname;
  
  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
    } else {
      await logout();
    }
  };
  
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-blue-600">FaithTech Admin</h1>
            </div>
            <div data-testid="desktop-nav-links" className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link href="/admin/leads">
                <span className={`${
                  currentPath === '/admin/leads' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium cursor-pointer`}>
                  Leads
                </span>
              </Link>
              <Link href="/admin/analytics">
                <span className={`${
                  currentPath === '/admin/analytics' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium cursor-pointer`}>
                  Analytics
                </span>
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div data-testid="mobile-nav-links" className="sm:hidden">
        <div className="pt-2 pb-3 space-y-1">
          <Link href="/admin/leads">
            <span className={`${
              currentPath === '/admin/leads'
                ? 'bg-blue-50 border-blue-500 text-blue-700'
                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
            } block pl-3 pr-4 py-2 border-l-4 text-base font-medium cursor-pointer`}>
              Leads
            </span>
          </Link>
          <Link href="/admin/analytics">
            <span className={`${
              currentPath === '/admin/analytics'
                ? 'bg-blue-50 border-blue-500 text-blue-700'
                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
            } block pl-3 pr-4 py-2 border-l-4 text-base font-medium cursor-pointer`}>
              Analytics
            </span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
