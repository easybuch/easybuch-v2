'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { Input } from '@/components/atoms/Input';
import { UserPlus, Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await signUp(email, password);

      if (error) {
        if (error.message.includes('already registered')) {
          setError(t('auth.registerError'));
        } else {
          setError(error.message);
        }
        return;
      }

      // Success
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      setError(t('auth.registerError'));
      console.error('Registration error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={48} className="text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-brand mb-2">{t('common.appName')}</h1>
          <p className="text-text-secondary">{t('auth.registerSubtitle')}</p>
        </div>

        {/* Register Card */}
        <Card className="p-8">
          <h2 className="text-2xl font-bold text-text-primary mb-6">{t('auth.register')}</h2>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-button flex items-center gap-3">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-button flex items-center gap-3">
              <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800">{t('auth.checkEmail')}</p>
                <p className="text-sm text-green-700">
                  {t('auth.confirmationSent')}
                </p>
              </div>
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
                disabled={isSubmitting || success}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                {t('auth.password')}
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.password')}
                  required
                  disabled={isSubmitting || success}
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-footer hover:text-text-primary transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                {t('auth.confirmPassword')}
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('auth.confirmPassword')}
                  required
                  disabled={isSubmitting || success}
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-footer hover:text-text-primary transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isSubmitting || success || !email || !password || !confirmPassword}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={20} className="mr-2 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <UserPlus size={20} className="mr-2" />
                  {t('auth.register')}
                </>
              )}
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-text-secondary">
              {t('auth.hasAccount')}{' '}
              <Link href="/login" className="text-brand font-medium hover:underline">
                {t('auth.login')}
              </Link>
            </p>
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
