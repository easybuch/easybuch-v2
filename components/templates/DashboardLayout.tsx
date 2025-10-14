'use client';

import { ReactNode } from 'react';
import { Sidebar } from '@/components/organisms/Sidebar';
import { Header } from '@/components/organisms/Header';
import { cn } from '@/utils/cn';

export interface DashboardLayoutProps {
  children: ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  className?: string;
}

export function DashboardLayout({ children, breadcrumbs, className }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Header */}
        <Header breadcrumbs={breadcrumbs} />

        {/* Content Area */}
        <main className={cn('container-custom py-8 md:py-12', className)}>{children}</main>
      </div>
    </div>
  );
}
