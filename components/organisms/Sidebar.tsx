'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Home, FileText, Menu, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/lib/auth-context';

export interface SidebarProps {
  className?: string;
}

const menuItems = [
  { icon: Home, label: 'Dashboard', href: '/' },
  { icon: FileText, label: 'Meine Belege', href: '/belege' },
];

export function Sidebar({ className }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  const getUserInitial = () => {
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  const getUserName = () => {
    return user?.email?.split('@')[0] || 'Benutzer';
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-brand text-white rounded-button"
        aria-label="Toggle Menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 z-40',
          'transition-transform duration-300 ease-in-out',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          className
        )}
      >
        {/* Logo */}
        <div className="h-20 flex items-center justify-center border-b border-gray-200">
          <Link href="/" className="text-2xl font-bold text-brand hover:text-brand/80 transition-colors">
            EasyBuch
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-button',
                  'text-text-secondary hover:bg-brand/10 hover:text-brand',
                  'transition-colors duration-200'
                )}
                onClick={() => setIsOpen(false)}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center">
              <span className="text-brand font-bold">{getUserInitial()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{getUserName()}</p>
              <p className="text-xs text-text-footer truncate">{user?.email || 'user@easybuch.de'}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
