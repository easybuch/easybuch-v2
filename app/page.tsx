'use client';

import Link from 'next/link';
import { DashboardLayout } from '@/components/templates/DashboardLayout';
import { Button } from '@/components/atoms/Button';
import { Upload, FileText } from 'lucide-react';

export default function HomePage() {
  const breadcrumbs = [{ label: 'Dashboard' }];

  return (
    <DashboardLayout breadcrumbs={breadcrumbs}>
      {/* Hero Section */}
      <section className="max-w-4xl mx-auto text-center py-12 md:py-20">
        <h1 className="text-4xl md:text-section font-bold text-text-primary mb-6">
          Willkommen bei EasyBuch
        </h1>
        <p className="text-lg md:text-xl text-text-secondary mb-4">
          Ihre digitale Belegverwaltung für Selbständige und kleine Unternehmen
        </p>
        <p className="text-base text-text-light mb-12 max-w-2xl mx-auto">
          Fotografieren Sie Ihren Beleg – EasyBuch erkennt, sortiert und speichert ihn automatisch.
          Sparen Sie Zeit und behalten Sie den Überblick über Ihre Ausgaben.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/upload" className="w-full sm:w-auto">
            <Button variant="primary" className="w-full min-w-[240px]">
              <Upload size={20} className="mr-2" />
              Neuen Beleg hochladen
            </Button>
          </Link>
          <Link href="/belege" className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full min-w-[240px]">
              <FileText size={20} className="mr-2" />
              Meine Belege
            </Button>
          </Link>
        </div>
      </section>
    </DashboardLayout>
  );
}
