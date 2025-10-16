# Internationalisierung (i18n) - Implementierungsanleitung

## ✅ Was bereits implementiert ist

1. **next-intl installiert** - Die Bibliothek ist installiert und konfiguriert
2. **Sprachdateien erstellt**:
   - `/messages/de.json` - Deutsche Übersetzungen
   - `/messages/ru.json` - Russische Übersetzungen
3. **i18n-Konfiguration**: `/i18n/request.ts` und `/i18n.ts`
4. **Language Switcher Komponente**: `/components/atoms/LanguageSwitcher.tsx`
5. **Middleware aktualisiert**: Spracherkennung integriert
6. **next.config.mjs**: next-intl Plugin konfiguriert

## 🔧 Nächste Schritte zur vollständigen Implementierung

### 1. App-Struktur anpassen

Alle Seiten müssen in ein `[locale]` Verzeichnis verschoben werden:

```
app/
├── [locale]/
│   ├── layout.tsx          ← Bereits erstellt
│   ├── page.tsx            ← Bereits verschoben
│   ├── belege/
│   │   └── page.tsx
│   ├── login/
│   │   └── page.tsx
│   ├── register/
│   │   └── page.tsx
│   └── auth/
│       └── callback/
│           └── route.ts
```

### 2. Bestehende Seiten verschieben

```bash
# Im Terminal ausführen:
mv app/belege app/[locale]/belege
mv app/login app/[locale]/login
mv app/register app/[locale]/register
mv app/auth app/[locale]/auth
```

### 3. Root Layout anpassen

Die Datei `app/layout.tsx` sollte nur noch ein minimales Layout sein, das auf `/[locale]` weiterleitet:

```tsx
import { redirect } from 'next/navigation';

export default function RootLayout() {
  redirect('/de'); // Standardsprache
}
```

### 4. Komponenten mit Übersetzungen aktualisieren

In jeder Komponente, die Text anzeigt:

```tsx
import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('navigation'); // oder 'auth', 'dashboard', etc.
  
  return <h1>{t('dashboard')}</h1>;
}
```

### 5. Wichtige Komponenten aktualisieren

#### Sidebar (`components/organisms/Sidebar.tsx`):
```tsx
const t = useTranslations('navigation');
// Dann: {t('dashboard')}, {t('receipts')}
```

#### Login Page (`app/[locale]/login/page.tsx`):
```tsx
const t = useTranslations('auth');
// Dann: {t('loginTitle')}, {t('email')}, {t('password')}, etc.
```

#### Belege Page (`app/[locale]/belege/page.tsx`):
```tsx
const t = useTranslations('receipts');
// Dann: {t('title')}, {t('uploadNew')}, etc.
```

### 6. Navigation anpassen

Alle Links müssen die Locale enthalten:

```tsx
import { useLocale } from 'next-intl';
import Link from 'next/link';

function MyComponent() {
  const locale = useLocale();
  
  return <Link href={`/${locale}/belege`}>Belege</Link>;
}
```

Oder mit dem `Link` von next-intl:

```tsx
import { Link } from 'next-intl';

function MyComponent() {
  return <Link href="/belege">Belege</Link>; // Locale wird automatisch hinzugefügt
}
```

### 7. Middleware Matcher aktualisieren

Die Middleware sollte alle Routen mit Locale-Präfix matchen:

```typescript
export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
```

## 📝 Übersetzungsschlüssel

Alle verfügbaren Übersetzungsschlüssel finden Sie in:
- `/messages/de.json`
- `/messages/ru.json`

Kategorien:
- `common` - Allgemeine Begriffe (Speichern, Abbrechen, etc.)
- `navigation` - Navigationsmenü
- `auth` - Login/Registrierung
- `dashboard` - Dashboard-Seite
- `receipts` - Belege-Seite
- `categories` - Kategorien
- `status` - Status-Werte

## 🌐 Sprache wechseln

Der Language Switcher ist bereits im Header integriert. Benutzer können zwischen Deutsch und Russisch wechseln.

## 🔗 Wichtige Links

- [next-intl Dokumentation](https://next-intl-docs.vercel.app/)
- [Next.js i18n Routing](https://nextjs.org/docs/app/building-your-application/routing/internationalization)

## ⚠️ Bekannte Probleme

1. **TypeScript-Warnung in `i18n/request.ts`**: Dies ist ein bekanntes Issue mit next-intl und kann ignoriert werden. Die Funktionalität ist nicht beeinträchtigt.

2. **Bestehende Routen**: Alle bestehenden Routen ohne Locale-Präfix müssen auf `/de/...` oder `/ru/...` umgeleitet werden.

## 🚀 Deployment

Nach der vollständigen Implementierung:

1. Testen Sie beide Sprachen lokal: `npm run dev`
2. Besuchen Sie `http://localhost:3000/de` und `http://localhost:3000/ru`
3. Testen Sie den Language Switcher
4. Deployen Sie auf Vercel: `vercel --prod`

## 📧 Supabase Email-Templates

Vergessen Sie nicht, auch die Supabase Email-Templates zu übersetzen oder dynamisch basierend auf der Benutzersprache anzupassen.
