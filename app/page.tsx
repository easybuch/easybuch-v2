'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/templates/DashboardLayout';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { Upload, FileText, Euro } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';

export default function HomePage() {
  const { t } = useLanguage();
  const breadcrumbs = [{ label: t('navigation.dashboard') }];
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [receiptCount, setReceiptCount] = useState<number>(0);
  const [monthlyCount, setMonthlyCount] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [monthlyAmount, setMonthlyAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchStatistics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Show loading state while checking authentication
  if (authLoading) {
    return null;
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  const fetchStatistics = async () => {
    if (!user) return;

    try {
      // Get all receipts for the user
      const { data: receipts, error } = await supabase
        .from('receipts')
        .select('amount_gross, receipt_date, created_at')
        .eq('user_id', user.id);

      if (error) throw error;

      // Type guard for receipts
      type ReceiptStats = {
        amount_gross: number | null;
        receipt_date: string | null;
        created_at: string;
      };
      const typedReceipts = (receipts || []) as ReceiptStats[];

      // Calculate statistics
      const total = typedReceipts.length;
      setReceiptCount(total);

      // Get current month start date
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthStartStr = monthStart.toISOString().split('T')[0];

      // Filter receipts uploaded this month (based on created_at)
      const monthlyReceipts = typedReceipts.filter((r) => {
        return r.created_at >= monthStartStr;
      });

      setMonthlyCount(monthlyReceipts.length);

      // Calculate total amount
      const totalSum = typedReceipts.reduce((sum, r) => sum + (r.amount_gross || 0), 0);
      setTotalAmount(totalSum);

      // Calculate monthly amount (also based on upload date)
      const monthlySum = monthlyReceipts.reduce((sum, r) => sum + (r.amount_gross || 0), 0);
      setMonthlyAmount(monthlySum);
    } catch (err) {
      console.error('Error fetching statistics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout breadcrumbs={breadcrumbs}>
      {/* Hero Section */}
      <section className="max-w-4xl mx-auto text-center py-12 md:py-20">
        <h1 className="text-3xl md:text-section font-bold text-text-primary mb-8">
          {t('dashboard.welcome')}
        </h1>
        <p className="text-lg md:text-xl text-text-secondary mb-5">
          {t('dashboard.subtitle')}
        </p>
        <p className="text-base text-text-light mb-14 max-w-2xl mx-auto">
          {t('dashboard.description')}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/upload" className="w-full sm:w-auto">
            <Button variant="primary" className="w-full min-w-[240px]">
              <span className="text-lg font-semibold mr-1">+</span>
              {t('receipts.addReceipt')}
            </Button>
          </Link>
          <Link href="/belege" className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full min-w-[240px]">
              <FileText size={20} className="mr-2" />
              {t('navigation.receipts')}
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-4xl mx-auto mt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Receipts Card */}
          <Card className="p-8">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <p className="text-sm text-text-footer mb-2">{t('dashboard.totalReceipts')}</p>
                <p className="text-4xl font-bold text-text-primary mb-3">
                  {isLoading ? '...' : receiptCount}
                </p>
                <div className="flex items-center gap-2 text-text-secondary">
                  <div className="w-2 h-2 rounded-full bg-brand"></div>
                  <p className="text-sm">
                    {isLoading ? '...' : monthlyCount} {t('dashboard.thisMonth')}
                  </p>
                </div>
              </div>
              <div className="w-14 h-14 rounded-button bg-brand/10 flex items-center justify-center flex-shrink-0">
                <FileText size={28} className="text-brand" />
              </div>
            </div>
          </Card>

          {/* Expenses Card */}
          <Card className="p-8">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <p className="text-sm text-text-footer mb-2">{t('dashboard.totalAmount')}</p>
                <p className="text-4xl font-bold text-text-primary mb-3">
                  {isLoading ? '...' : `${totalAmount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
                </p>
                <div className="flex items-center gap-2 text-text-secondary">
                  <div className="w-2 h-2 rounded-full bg-green-600"></div>
                  <p className="text-sm">
                    {isLoading ? '...' : `${monthlyAmount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`} {t('dashboard.thisMonth')}
                  </p>
                </div>
              </div>
              <div className="w-14 h-14 rounded-button bg-green-100 flex items-center justify-center flex-shrink-0">
                <Euro size={28} className="text-green-600" />
              </div>
            </div>
          </Card>
        </div>
      </section>
    </DashboardLayout>
  );
}