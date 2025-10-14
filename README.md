# EasyBuch - Digitale Belegverwaltung

Ein moderner Online-Service für Selbständige und kleine Unternehmen in Deutschland. Fotografieren Sie Ihren Beleg – EasyBuch erkennt, sortiert und speichert ihn automatisch.

## 🚀 Features

- **Next.js 14** mit App Router
- **TypeScript** für Type-Safety
- **Tailwind CSS** mit Custom Design Tokens
- **Responsive Design** (Mobile-First)
- **Atomic Design** Komponenten-Architektur
- **React Hook Form** + **Zod** für Formular-Validierung
- **TanStack Query** für Data Fetching
- **Lucide Icons** für moderne Icons
- **ESLint** + **Prettier** für Code-Qualität

## 📦 Installation

```bash
# Dependencies installieren
npm install

# Development Server starten
npm run dev

# Production Build
npm run build
npm start
```

Die Anwendung läuft auf [http://localhost:3000](http://localhost:3000)

## 🎨 Design System

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

## 📁 Projektstruktur

```
easybuch/
├── app/
│   ├── layout.tsx          # Root Layout mit Font Setup
│   ├── page.tsx            # Dashboard Homepage
│   ├── belege/
│   │   └── page.tsx        # Meine Belege Seite
│   └── globals.css         # Global Styles
├── components/
│   ├── atoms/              # Basis-Komponenten
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── Badge.tsx
│   ├── molecules/          # Zusammengesetzte Komponenten
│   ├── organisms/          # Komplexe Komponenten
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   └── templates/          # Layout Templates
│       └── DashboardLayout.tsx
├── utils/
│   └── cn.ts              # Tailwind Merge Utility
├── tailwind.config.ts     # Tailwind Konfiguration
├── tsconfig.json          # TypeScript Konfiguration
└── package.json
```

## 🧩 Komponenten

### Atoms (Basis-Komponenten)

- **Button**: Primary/Secondary Varianten mit Hover-Effekten
- **Card**: Standard Cards mit optionalem Icon-Container
- **Input**: Form Fields mit Validierung
- **Badge**: Status-Badges mit verschiedenen Varianten

### Organisms (Komplexe Komponenten)

- **Sidebar**: Navigation mit Logo, Menu-Items und User-Section
- **Header**: Breadcrumbs und User-Dropdown

### Templates

- **DashboardLayout**: Haupt-Layout mit Sidebar, Header und Content Area

## 🎯 Best Practices

- Alle Komponenten sind **fully responsive**
- **TypeScript** wird strikt verwendet (kein `any`)
- **Named Exports** für alle Komponenten
- **PascalCase** für Komponenten-Dateinamen
- **camelCase** für Props
- **ARIA-Attribute** für Accessibility
- **Keyboard-Navigation** wird unterstützt

## 📝 Nächste Schritte

1. Beleg-Upload Funktionalität implementieren
2. OCR-Integration für automatische Belegerkennung
3. Beleg-Liste mit Filterung und Sortierung
4. API-Integration mit TanStack Query
5. Authentifizierung implementieren
6. Tests mit Jest und React Testing Library

## 📄 Lizenz

Privates Projekt
