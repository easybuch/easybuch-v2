'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/language-context';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { Input } from '@/components/atoms/Input';
import { Mail, Loader2, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        throw resetError;
      }

      setSuccess(true);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(t('auth.resetPasswordError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-brand mb-2">{t('common.appName')}</h1>
            <p className="text-text-secondary">{t('auth.resetPasswordSuccess')}</p>
          </div>

          {/* Success Card */}
          <Card className="p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                {t('auth.resetPasswordSuccess')}
              </h2>
              <p className="text-text-secondary mb-6">
                {t('auth.resetPasswordSuccessMessage')}
              </p>
              <Link href="/login">
                <Button variant="primary" className="w-full">
                  <ArrowLeft size={20} className="mr-2" />
                  {t('auth.backToLogin')}
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-brand mb-2">{t('common.appName')}</h1>
          <p className="text-text-secondary">{t('auth.resetPasswordSubtitle')}</p>
        </div>

        {/* Reset Password Card */}
        <Card className="p-8">
          <h2 className="text-2xl font-bold text-text-primary mb-6">
            {t('auth.resetPasswordTitle')}
          </h2>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-button flex items-center gap-3">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
                {t('auth.email')}
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.email')}
                required
                disabled={isSubmitting}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isSubmitting || !email}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={20} className="mr-2 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <Mail size={20} className="mr-2" />
                  {t('auth.resetPassword')}
                </>
              )}
            </Button>
          </form>

          {/* Back to Login Link */}
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-text-secondary hover:text-brand transition-colors inline-flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              {t('auth.backToLogin')}
            </Link>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-text-footer mt-8">
          © 2025 {t('common.appName')}
        </p>
      </div>
    </div>
  );
}
