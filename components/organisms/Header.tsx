'use client';

import { ChevronRight, Bell, User } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface HeaderProps {
  breadcrumbs?: { label: string; href?: string }[];
  className?: string;
}

export function Header({ breadcrumbs = [], className }: HeaderProps) {
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
        <button
          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-button transition-colors"
          aria-label="Benutzermenu"
        >
          <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center">
            <User size={16} className="text-brand" />
          </div>
          <span className="text-sm font-medium text-text-primary hidden md:block">Benutzer</span>
        </button>
      </div>
    </header>
  );
}
