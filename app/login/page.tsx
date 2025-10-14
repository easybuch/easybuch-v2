'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { Input } from '@/components/atoms/Input';
import { LogIn, Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      console.log('Attempting login...');
      const { error } = await signIn(email, password);

      if (error) {
        console.error('Login error:', error);
        if (error.message.includes('Invalid login credentials')) {
          setError('Ungültige E-Mail oder Passwort');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse');
        } else {
          setError(error.message);
        }
        setIsSubmitting(false);
        return;
      }

      console.log('Login successful, redirecting...');
      // Wait a bit for session to be set
      await new Promise((resolve) => setTimeout(resolve, 500));
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('Unexpected login error:', err);
      setError('Ein unerwarteter Fehler ist aufgetreten');
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
          <h1 className="text-4xl font-bold text-brand mb-2">EasyBuch</h1>
          <p className="text-text-secondary">Digitale Belegverwaltung</p>
        </div>

        {/* Login Card */}
        <Card className="p-8">
          <h2 className="text-2xl font-bold text-text-primary mb-6">Anmelden</h2>

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
                E-Mail
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ihre@email.de"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                Passwort
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isSubmitting}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isSubmitting || !email || !password}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={20} className="mr-2 animate-spin" />
                  Wird angemeldet...
                </>
              ) : (
                <>
                  <LogIn size={20} className="mr-2" />
                  Anmelden
                </>
              )}
            </Button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-text-secondary">
              Noch kein Konto?{' '}
              <Link href="/register" className="text-brand font-medium hover:underline">
                Jetzt registrieren
              </Link>
            </p>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-text-footer mt-8">
          © 2024 EasyBuch. Alle Rechte vorbehalten.
        </p>
      </div>
    </div>
  );
}
