'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/templates/DashboardLayout';
import { Button } from '@/components/atoms/Button';
import { Card, CardTitle, CardContent } from '@/components/atoms/Card';
import { FileText, Search, Calendar, Loader2 } from 'lucide-react';
import { ReceiptDetailModal } from '@/components/molecules/ReceiptDetailModal';
import { CategoryFilter } from '@/components/molecules/CategoryFilter';
import { AccordionGroupedView } from '@/components/organisms/AccordionGroupedView';
import { supabase, supabaseUntyped } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import type { Receipt } from '@/lib/database.types';

export default function BelegePage() {
  const { t } = useLanguage();
  const breadcrumbs = [{ label: t('navigation.dashboard'), href: '/' }, { label: t('navigation.receipts') }];
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [signedUrls, setSignedUrls] = useState<string[] | null>(null);
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    fetchReceipts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show loading state while checking authentication
  if (authLoading) {
    return null;
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  const fetchReceipts = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('receipts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setReceipts(data || []);
    } catch (err) {
      console.error('Error fetching receipts:', err);
      setError(t('receipts.uploadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const filteredReceipts = receipts.filter((receipt) => {
    // Search filter
    const matchesSearch = receipt.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (receipt.vendor && receipt.vendor.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Date filter
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const receiptDate = new Date(receipt.created_at);
      const now = new Date();
      const diffInDays = (now.getTime() - receiptDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (dateFilter === 'last7days') {
        matchesDate = diffInDays <= 7;
      } else if (dateFilter === 'last30days') {
        matchesDate = diffInDays <= 30;
      } else if (dateFilter === 'last90days') {
        matchesDate = diffInDays <= 90;
      }
    }
    
    // Category filter
    const matchesCategory = categoryFilter === 'all' || receipt.category === categoryFilter;
    
    return matchesSearch && matchesDate && matchesCategory;
  });


  // Removed unused formatFileSize and formatDate functions

  const handleViewReceipt = async (receipt: Receipt) => {
    try {
      // Check if multi-image receipt
      if (receipt.file_paths && receipt.file_paths.length > 1) {
        // Generate signed URLs for all files
        const urls: string[] = [];
        for (const filePath of receipt.file_paths) {
          const { data, error } = await supabase.storage
            .from('receipts')
            .createSignedUrl(filePath.path, 3600);

          if (error) throw error;
          if (data?.signedUrl) {
            urls.push(data.signedUrl);
          }
        }
        
        setSignedUrls(urls);
        setSignedUrl(urls[0]); // Set first as primary
      } else {
        // Single image - use file_url
        const { data, error } = await supabase.storage
          .from('receipts')
          .createSignedUrl(receipt.file_url, 3600);

        if (error) throw error;

        if (data?.signedUrl) {
          setSignedUrl(data.signedUrl);
          setSignedUrls(null);
        }
      }
      
      setSelectedReceipt(receipt);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Error generating signed URL:', err);
      alert(t('receipts.uploadError'));
    }
  };

  const handleSaveReceipt = async (id: string, updates: Partial<Receipt>) => {
    try {
      const { error } = await supabaseUntyped
        .from('receipts')
        .update({
          receipt_date: updates.receipt_date ?? null,
          category: updates.category ?? null,
          vendor: updates.vendor ?? null,
          notes: updates.notes ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      // Refresh receipts list
      await fetchReceipts();
    } catch (err) {
      console.error('Error updating receipt:', err);
      throw err;
    }
  };

  const handleDeleteReceipt = async (id: string) => {
    try {
      const receipt = receipts.find((r) => r.id === id);
      if (!receipt) return;

      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('receipts')
        .remove([receipt.file_url]);

      if (storageError) throw storageError;

      // Delete record from database
      const { error: dbError } = await supabase.from('receipts').delete().eq('id', id);

      if (dbError) throw dbError;

      // Refresh receipts list
      await fetchReceipts();
    } catch (err) {
      console.error('Error deleting receipt:', err);
      throw err;
    }
  };


  return (
    <DashboardLayout breadcrumbs={breadcrumbs}>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-section font-bold text-text-primary mb-2">
            {t('receipts.title')}
          </h1>
          <p className="text-text-secondary">
            {t('receipts.subtitle')}
          </p>
        </div>
        <Link href="/upload">
          <Button variant="primary" className="mt-4 md:mt-0">
            <span className="text-lg font-semibold mr-1">+</span>
            {t('receipts.addReceipt')}
          </Button>
        </Link>
      </div>

      {/* Category Filter */}
      <CategoryFilter value={categoryFilter} onChange={setCategoryFilter} />

{/* Search and Filter - Minimalistic */}
<div className="mb-8 flex flex-col sm:flex-row gap-2">
  {/* Search Bar */}
  <div className="flex-1 relative group">
    <Search
      size={18}
      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand transition-colors"
    />
    <input
      type="text"
      placeholder={t('receipts.searchPlaceholder')}
      className="w-full pl-11 pr-4 py-2.5 text-sm border border-gray-200 rounded-button bg-white text-text-primary placeholder:text-text-tertiary hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
    />
  </div>
  
  {/* Date Filter */}
  <div className="relative sm:w-48 group">
    <Calendar size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand transition-colors pointer-events-none z-10" />
    <select
      value={dateFilter}
      onChange={(e) => setDateFilter(e.target.value)}
      className="w-full pl-11 pr-10 py-2.5 text-sm border border-gray-200 rounded-button bg-white text-text-primary hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all appearance-none cursor-pointer"
    >
      <option value="all">{t('receipts.allDates')}</option>
      <option value="last7days">{t('receipts.last7days')}</option>
      <option value="last30days">{t('receipts.last30days')}</option>
      <option value="last90days">{t('receipts.last90days')}</option>
    </select>
    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
      <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
        <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary"/>
      </svg>
    </div>
  </div>
</div>

      {/* Loading State */}
      {isLoading && (
        <Card className="text-center py-16">
          <Loader2 size={48} className="mx-auto mb-4 text-brand animate-spin" />
          <p className="text-text-secondary">{t('common.loading')}</p>
        </Card>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Card className="text-center py-16">
          <div className="max-w-md mx-auto">
            <p className="text-red-600 mb-4">{error}</p>
            <Button variant="secondary" onClick={fetchReceipts}>
              {t('common.cancel')}
            </Button>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredReceipts.length === 0 && receipts.length === 0 && (
        <Card className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-brand/10 flex items-center justify-center">
              <FileText size={48} className="text-brand" />
            </div>
            <CardTitle className="mb-4">{t('receipts.noReceipts')}</CardTitle>
            <CardContent>
              <p className="text-text-secondary mb-6">
                {t('dashboard.uploadFirst')}
              </p>
              <Link href="/upload">
                <Button variant="primary">
                  <span className="text-lg font-semibold mr-1">+</span>
                  {t('receipts.addReceipt')}
                </Button>
              </Link>
            </CardContent>
          </div>
        </Card>
      )}

      {/* No Search Results */}
      {!isLoading && !error && filteredReceipts.length === 0 && receipts.length > 0 && (
        <Card className="text-center py-16">
          <div className="max-w-md mx-auto">
            <p className="text-text-secondary">
              {t('receipts.noReceipts')}
            </p>
          </div>
        </Card>
      )}

      {/* Detail Modal */}
      <ReceiptDetailModal
        receipt={selectedReceipt}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedReceipt(null);
          setSignedUrl(null);
          setSignedUrls(null);
        }}
        onSave={handleSaveReceipt}
        onDelete={handleDeleteReceipt}
        signedUrl={signedUrl}
        signedUrls={signedUrls}
      />

      {/* Receipts Display */}
      {!isLoading && !error && filteredReceipts.length > 0 && (
        <AccordionGroupedView
          receipts={filteredReceipts}
          onViewReceipt={handleViewReceipt}
        />
      )}
    </DashboardLayout>
  );
}
