'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Bell, User, LogOut } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/lib/auth-context';

export interface HeaderProps {
  breadcrumbs?: { label: string; href?: string }[];
  className?: string;
}

export function Header({ breadcrumbs = [], className }: HeaderProps) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  const getUserEmail = () => {
    return user?.email?.split('@')[0] || 'Benutzer';
  };

  return (
    <header
      className={cn(
        'h-20 bg-white border-b border-gray-200',
        'flex items-center justify-between px-6',
        className
      )}
    >
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <div key={index} className="flex items-center gap-2">
            {index > 0 && <ChevronRight size={16} className="text-text-footer" />}
            <span
              className={cn(
                index === breadcrumbs.length - 1
                  ? 'text-text-primary font-medium'
                  : 'text-text-footer'
              )}
            >
              {crumb.label}
            </span>
          </div>
        ))}
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button
          className="relative p-2 hover:bg-gray-100 rounded-button transition-colors"
          aria-label="Benachrichtigungen"
        >
          <Bell size={20} className="text-text-secondary" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User Dropdown */}
        <div className="relative">
          <button
            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-button transition-colors"
            aria-label="Benutzermenu"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center">
              <User size={16} className="text-brand" />
            </div>
            <span className="text-sm font-medium text-text-primary hidden md:block">
              {getUserEmail()}
            </span>
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-button shadow-lg border border-gray-200 py-2 z-20">
                <div className="px-4 py-2 border-b border-gray-200">
                  <p className="text-sm font-medium text-text-primary">{getUserEmail()}</p>
                  <p className="text-xs text-text-footer truncate">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-text-secondary hover:bg-gray-50 flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Abmelden
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
