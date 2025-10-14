'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/templates/DashboardLayout';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { Upload, FileText, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

export default function HomePage() {
  const breadcrumbs = [{ label: 'Dashboard' }];
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [receiptCount, setReceiptCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchReceiptCount();
    }
  }, [user]);

  const fetchReceiptCount = async () => {
    if (!user) return;

    try {
      const { count, error } = await supabase
        .from('receipts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (error) throw error;
      setReceiptCount(count || 0);
    } catch (err) {
      console.error('Error fetching receipt count:', err);
    } finally {
      setIsLoading(false);
    }
  };

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

      {/* Stats Section */}
      <section className="max-w-4xl mx-auto mt-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-footer mb-1">Gespeicherte Belege</p>
                <p className="text-3xl font-bold text-text-primary">
                  {isLoading ? '...' : receiptCount}
                </p>
              </div>
              <div className="w-12 h-12 rounded-button bg-brand/10 flex items-center justify-center">
                <FileText size={24} className="text-brand" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-footer mb-1">Diesen Monat</p>
                <p className="text-3xl font-bold text-text-primary">0</p>
              </div>
              <div className="w-12 h-12 rounded-button bg-green-100 flex items-center justify-center">
                <TrendingUp size={24} className="text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-footer mb-1">Verarbeitet</p>
                <p className="text-3xl font-bold text-text-primary">0</p>
              </div>
              <div className="w-12 h-12 rounded-button bg-blue-100 flex items-center justify-center">
                <Upload size={24} className="text-blue-600" />
              </div>
            </div>
          </Card>
        </div>
      </section>
    </DashboardLayout>
  );
}
