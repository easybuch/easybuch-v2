import { Noto_Sans } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { LanguageProvider } from '@/lib/language-context';

const notoSans = Noto_Sans({
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-noto-sans',
});

export const metadata = {
  title: 'EasyBuch - Digitale Belegverwaltung',
  description: 'Online-Service für Selbständige und kleine Unternehmen. Fotografieren Sie Ihren Beleg – EasyBuch erkennt, sortiert und speichert ihn automatisch.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className={notoSans.className}>
        <LanguageProvider>
          <AuthProvider>{children}</AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
