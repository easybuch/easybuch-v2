# EasyBuch - Digitale Belegverwaltung

Ein moderner Online-Service für Selbständige und kleine Unternehmen. Fotografieren Sie Ihren Beleg – EasyBuch erkennt, sortiert und speichert ihn automatisch.

## Hauptfunktionen

- **Automatische Belegerkennung** - OCR-basierte Extraktion von Beträgen, Händler, Datum und Kategorie
- **Multi-Image Upload** - Mehrteilige Belege können als mehrere Bilder hochgeladen werden
- **MwSt-Aufschlüsselung** - Separate Erkennung von 7% und 19% Mehrwertsteuer
- **Belegverwaltung** - Übersichtliche Verwaltung aller hochgeladenen Belege
- **Filter & Suche** - Nach Kategorie, Datum und Händler filtern
- **Sichere Authentifizierung** - Mit Supabase Auth inkl. Passwort-Reset
- **Mehrsprachig** - Deutsch und Russisch vollständig unterstützt
- **Duplikat-Erkennung** - Automatische Erkennung bereits hochgeladener Belege via File-Hash
- **Dashboard** - Übersicht über Belege und Ausgaben

## Tech Stack

- **Next.js 14** mit App Router
- **TypeScript** für Type-Safety
- **Supabase** für Backend & Authentifizierung
- **Anthropic Claude 3.5 Sonnet** für OCR & Multi-Image-Analyse
- **Tailwind CSS** mit Custom Design Tokens
- **Responsive Design** (Mobile-First)
- **Atomic Design** Komponenten-Architektur
- **Lucide Icons** für moderne Icons
- **ESLint** + **Prettier** für Code-Qualität

## Installation

```bash
# Repository klonen
git clone https://github.com/Scolo2904/easybuch.git
cd easybuch

# Dependencies installieren
npm install

# Umgebungsvariablen einrichten
cp .env.example .env.local
# Fügen Sie Ihre Supabase-Credentials in .env.local ein

# Development Server starten
npm run dev

# Production Build
npm run build
npm start
```

Die Anwendung läuft auf [http://localhost:3000](http://localhost:3000)

## Umgebungsvariablen

Erstellen Sie eine `.env.local` Datei mit folgenden Variablen:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

## Design System

### Farbpalette

- **Brand Color**: `#00c853` (Haupt-Grün)
- **Brand Dark**: `#00a63e`
- **Text Primary**: `#364153` (Dunkler Text)
- **Text Secondary**: `#4a5565` (Body Text)
- **Text Light**: `#6a7282` (Heller Text)
- **Text Footer**: `#99a1af` (Footer Text)
- **Black**: `#101828`
- **White**: `#fefefe`

### Typografie

- **Font Family**: Noto Sans (Light 300, Regular 400, Medium 500, SemiBold 600, Bold 700)
- **Fallback**: Arial, sans-serif

**Größen:**
- Hero Title: 72px / Bold / 120% line-height
- Section Title: 48px / Bold / 100% line-height
- Card Title: 24px / Bold / 32px line-height
- Body Text: 16-20px / Regular / 24-30px line-height
- Small Text: 14px / Regular / 20px line-height

### Spacing & Layout

- **Container**: max-width 1360px, padding 20px
- **Sections**: padding-top/bottom 80-96px (Desktop), 40-60px (Mobile)
- **Grid Gaps**: 24px standard
- **Border Radius**: 12-16px für Cards/Buttons, 24px für größere Elemente

### Responsive Breakpoints

- **Desktop**: 1440px+
- **Tablet**: 991px - 767px
- **Mobile**: 767px - 479px
- **Small Mobile**: < 479px

## Projektstruktur

```
easybuch/
├── app/
│   ├── layout.tsx              # Root Layout mit Font Setup
│   ├── page.tsx                # Dashboard Homepage
│   ├── login/                  # Login-Seite
│   ├── register/               # Registrierungs-Seite
│   ├── forgot-password/        # Passwort vergessen
│   ├── reset-password/         # Passwort zurücksetzen
│   ├── belege/                 # Belege-Übersicht
│   ├── upload/                 # Beleg-Upload
│   ├── api/
│   │   ├── receipts/extract/   # OCR API Route
│   │   └── analyze-receipt/    # Beleg-Analyse
│   └── auth/callback/          # Auth Callback
├── components/
│   ├── atoms/                  # Basis-Komponenten
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   └── LanguageSwitcher.tsx
│   ├── molecules/              # Zusammengesetzte Komponenten
│   │   ├── FileUploadZone.tsx
│   │   └── ReceiptDetailModal.tsx
│   ├── organisms/              # Komplexe Komponenten
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   └── templates/              # Layout Templates
│       └── DashboardLayout.tsx
├── lib/
│   ├── supabase.ts            # Supabase Client
│   ├── auth-context.tsx       # Auth Context Provider
│   ├── language-context.tsx   # Mehrsprachigkeit
│   ├── receipt-ocr.ts         # OCR Logik
│   └── database.types.ts      # TypeScript Types
├── messages/
│   ├── de.json                # Deutsche Übersetzungen
│   └── ru.json                # Russische Übersetzungen
├── utils/
│   ├── cn.ts                  # Tailwind Merge Utility
│   └── file-hash.ts           # Duplikat-Erkennung
├── middleware.ts              # Next.js Middleware
├── tailwind.config.ts         # Tailwind Konfiguration
└── package.json
```

## Komponenten

### Atoms (Basis-Komponenten)

- **Button**: Primary/Secondary Varianten mit Hover-Effekten
- **Card**: Standard Cards mit optionalem Icon-Container
- **Input**: Form Fields mit Validierung
- **Badge**: Status-Badges mit verschiedenen Varianten
- **LanguageSwitcher**: Sprachwechsel zwischen DE/RU

### Molecules (Zusammengesetzte Komponenten)

- **FileUploadZone**: Drag & Drop Upload mit Multi-File-Support und Grid-Vorschau
- **ReceiptDetailModal**: Detailansicht mit Bearbeitung und Multi-Image-Display

### Organisms (Komplexe Komponenten)

- **Sidebar**: Navigation mit Logo, Menu-Items und User-Section
- **Header**: Breadcrumbs, Sprachwechsel und User-Dropdown

### Templates

- **DashboardLayout**: Haupt-Layout mit Sidebar, Header und Content Area

## Internationalisierung

Die Anwendung unterstützt mehrere Sprachen:

- Deutsch (Standard)
- Russisch

Übersetzungen werden über den `LanguageContext` verwaltet und in `messages/` gespeichert.

```tsx
import { useLanguage } from '@/lib/language-context';

function MyComponent() {
  const { t, locale, setLocale } = useLanguage();
  return <h1>{t('common.appName')}</h1>;
}
```

## Best Practices

- Alle Komponenten sind **fully responsive**
- **TypeScript** wird strikt verwendet (kein `any`)
- **Named Exports** für alle Komponenten
- **PascalCase** für Komponenten-Dateinamen
- **camelCase** für Props
- **ARIA-Attribute** für Accessibility
- **Keyboard-Navigation** wird unterstützt

## Authentifizierung

Die Anwendung nutzt Supabase Auth mit folgenden Features:

- E-Mail/Passwort Registrierung
- E-Mail-Bestätigung
- Login/Logout
- Passwort vergessen/zurücksetzen
- Geschützte Routen mit Middleware
- Session Management

## Datenbank

Supabase PostgreSQL mit folgenden Haupttabellen:

### receipts
Beleg-Daten mit OCR-Ergebnissen:
- `file_url`: Primärer Dateipfad (Haupt-Bild)
- `file_paths`: JSONB Array für Multi-Image-Belege `[{path, order}]`
- `file_hash`: SHA-256 Hash für Duplikat-Erkennung
- `amount_net`, `amount_tax`, `amount_gross`: Basis-Beträge
- `vat_7_net`, `vat_7_tax`: 7% MwSt-Aufschlüsselung
- `vat_19_net`, `vat_19_tax`: 19% MwSt-Aufschlüsselung
- `receipt_date`, `category`, `vendor`, `notes`: Metadaten
- `raw_ocr_text`: Vollständiger OCR-Text

### users
Benutzer-Authentifizierung (Supabase Auth)

### Migrations
- `add_file_hash.sql`: File-Hash für Duplikat-Erkennung
- `add_receipt_files_array.sql`: Multi-Image-Support mit automatischem Trigger

## Deployment

Das Projekt ist für Vercel optimiert:

```bash
# Build testen
npm run build

# Auf Vercel deployen
vercel --prod
```

Stellen Sie sicher, dass alle Umgebungsvariablen in Vercel konfiguriert sind.

## Changelog

### Version 2.0 (Oktober 2025)
- ✅ Multi-Image Upload für mehrteilige Belege
- ✅ MwSt-Aufschlüsselung (7% und 19%)
- ✅ Claude 3.5 Sonnet Integration
- ✅ Grid-Ansicht für mehrere Bilder
- ✅ Verbesserte Download-Funktionalität

### Version 1.0 (Initial Release)
- ✅ Basis OCR-Funktionalität
- ✅ Beleg-Verwaltung
- ✅ Authentifizierung
- ✅ Duplikat-Erkennung

## Roadmap

- [ ] Export-Funktionen (PDF, CSV)
- [ ] Erweiterte Statistiken und Reports
- [ ] Mobile App (React Native)
- [ ] Weitere Sprachen (EN, FR, ES)
- [ ] Automatische Kategorisierung mit KI
- [ ] Steuerberater-Integration
- [ ] Bulk-Upload für mehrere Belege

## Lizenz

Privates Projekt
