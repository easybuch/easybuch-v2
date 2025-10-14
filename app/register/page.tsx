'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { Input } from '@/components/atoms/Input';
import { UserPlus, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
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
    setSuccess(false);

    // Validation
    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await signUp(email, password);

      if (error) {
        if (error.message.includes('already registered')) {
          setError('Diese E-Mail ist bereits registriert');
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
      setError('Ein unerwarteter Fehler ist aufgetreten');
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
          <h1 className="text-4xl font-bold text-brand mb-2">EasyBuch</h1>
          <p className="text-text-secondary">Digitale Belegverwaltung</p>
        </div>

        {/* Register Card */}
        <Card className="p-8">
          <h2 className="text-2xl font-bold text-text-primary mb-6">Registrieren</h2>

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
                <p className="text-sm font-semibold text-green-800">Registrierung erfolgreich!</p>
                <p className="text-sm text-green-700">
                  Bitte bestätigen Sie Ihre E-Mail. Sie werden weitergeleitet...
                </p>
              </div>
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
                disabled={isSubmitting || success}
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
                placeholder="Mindestens 6 Zeichen"
                required
                disabled={isSubmitting || success}
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                Passwort bestätigen
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Passwort wiederholen"
                required
                disabled={isSubmitting || success}
              />
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
                  Wird registriert...
                </>
              ) : (
                <>
                  <UserPlus size={20} className="mr-2" />
                  Registrieren
                </>
              )}
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-text-secondary">
              Bereits ein Konto?{' '}
              <Link href="/login" className="text-brand font-medium hover:underline">
                Jetzt anmelden
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
