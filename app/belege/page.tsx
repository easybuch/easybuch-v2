'use client';

import Link from 'next/link';
import { DashboardLayout } from '@/components/templates/DashboardLayout';
import { Button } from '@/components/atoms/Button';
import { Card, CardTitle, CardContent } from '@/components/atoms/Card';
import { Upload, FileText, Search } from 'lucide-react';
import { Input } from '@/components/atoms/Input';

export default function BelegePage() {
  const breadcrumbs = [{ label: 'Dashboard', href: '/' }, { label: 'Meine Belege' }];

  return (
    <DashboardLayout breadcrumbs={breadcrumbs}>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-section font-bold text-text-primary mb-2">
            Meine Belege
          </h1>
          <p className="text-text-secondary">
            Verwalten und durchsuchen Sie Ihre hochgeladenen Belege
          </p>
        </div>
        <Link href="/upload">
          <Button variant="primary" className="mt-4 md:mt-0">
            <Upload size={20} className="mr-2" />
            Neuen Beleg hochladen
          </Button>
        </Link>
      </div>

      {/* Search and Filter */}
      <Card className="mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-text-footer"
            />
            <Input placeholder="Belege durchsuchen..." className="pl-12" />
          </div>
          <Button variant="secondary" className="md:w-auto">
            Filter
          </Button>
        </div>
      </Card>

      {/* Empty State */}
      <Card className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-brand/10 flex items-center justify-center">
            <FileText size={48} className="text-brand" />
          </div>
          <CardTitle className="mb-4">Noch keine Belege vorhanden</CardTitle>
          <CardContent>
            <p className="text-text-secondary mb-6">
              Laden Sie Ihren ersten Beleg hoch, um mit der digitalen Belegverwaltung zu starten.
            </p>
            <Link href="/upload">
              <Button variant="primary">
                <Upload size={20} className="mr-2" />
                Ersten Beleg hochladen
              </Button>
            </Link>
          </CardContent>
        </div>
      </Card>
    </DashboardLayout>
  );
}
