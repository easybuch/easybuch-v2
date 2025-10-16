# Sprachfunktion - Verwendungsanleitung

## ✅ Implementiert

Die Sprachfunktion (Deutsch/Russisch) ist vollständig implementiert und einsatzbereit!

## 🎯 Wie es funktioniert

### 1. Language Switcher
- Im Header rechts neben dem Benutzerprofil
- Klick auf das Globus-Symbol zeigt Dropdown mit Deutsch 🇩🇪 und Russisch 🇷🇺
- Die gewählte Sprache wird im Browser gespeichert (localStorage)

### 2. Bereits übersetzte Komponenten
- **Header**: Logout-Button, Benutzername
- **Sidebar**: Navigation (Dashboard, Meine Belege), App-Name

## 📝 Übersetzungen in neuen Komponenten verwenden

### In einer Client-Komponente:

```tsx
'use client';

import { useLanguage } from '@/lib/language-context';

export function MyComponent() {
  const { t } = useLanguage();
  
  return (
    <div>
      <h1>{t('dashboard.welcome')}</h1>
      <button>{t('common.save')}</button>
    </div>
  );
}
```

### Verfügbare Übersetzungsschlüssel

Alle Schlüssel finden Sie in `/messages/de.json` und `/messages/ru.json`:

```typescript
// Beispiele:
t('common.appName')           // "EasyBuch"
t('common.loading')           // "Lädt..." / "Загрузка..."
t('common.save')              // "Speichern" / "Сохранить"
t('navigation.dashboard')     // "Dashboard" / "Панель управления"
t('navigation.receipts')      // "Meine Belege" / "Мои чеки"
t('auth.login')               // "Anmelden" / "Войти"
t('auth.email')               // "E-Mail" / "Электронная почта"
t('dashboard.welcome')        // "Willkommen zurück" / "Добро пожаловать"
t('receipts.uploadNew')       // "Neuen Beleg hochladen" / "Загрузить новый чек"
```

## 🔧 Weitere Seiten übersetzen

### Login-Seite (`app/login/page.tsx`):

```tsx
'use client';

import { useLanguage } from '@/lib/language-context';

export default function LoginPage() {
  const { t } = useLanguage();
  
  return (
    <div>
      <h1>{t('auth.loginTitle')}</h1>
      <p>{t('auth.loginSubtitle')}</p>
      <input placeholder={t('auth.email')} />
      <input placeholder={t('auth.password')} />
      <button>{t('auth.login')}</button>
      <a href="/register">{t('auth.noAccount')}</a>
    </div>
  );
}
```

### Register-Seite (`app/register/page.tsx`):

```tsx
const { t } = useLanguage();

// Dann verwenden:
{t('auth.registerTitle')}
{t('auth.registerSubtitle')}
{t('auth.confirmPassword')}
{t('auth.register')}
{t('auth.hasAccount')}
```

### Belege-Seite (`app/belege/page.tsx`):

```tsx
const { t } = useLanguage();

// Dann verwenden:
{t('receipts.title')}
{t('receipts.uploadNew')}
{t('receipts.dragDrop')}
{t('receipts.date')}
{t('receipts.merchant')}
{t('receipts.amount')}
{t('receipts.category')}
```

### Dashboard-Seite (`app/page.tsx`):

```tsx
const { t } = useLanguage();

// Dann verwenden:
{t('dashboard.welcome')}
{t('dashboard.overview')}
{t('dashboard.totalReceipts')}
{t('dashboard.recentReceipts')}
```

## ➕ Neue Übersetzungen hinzufügen

1. Öffnen Sie `/messages/de.json`
2. Fügen Sie den neuen Schlüssel hinzu:
   ```json
   {
     "mySection": {
       "myKey": "Mein deutscher Text"
     }
   }
   ```

3. Öffnen Sie `/messages/ru.json`
4. Fügen Sie die russische Übersetzung hinzu:
   ```json
   {
     "mySection": {
       "myKey": "Мой русский текст"
     }
   }
   ```

5. Verwenden Sie in Ihrer Komponente:
   ```tsx
   {t('mySection.myKey')}
   ```

## 🌍 Aktuelle Sprache abrufen

```tsx
import { useLanguage } from '@/lib/language-context';

function MyComponent() {
  const { locale } = useLanguage(); // 'de' oder 'ru'
  
  return <div>Aktuelle Sprache: {locale}</div>;
}
```

## 🎨 Schriftart

Die Schriftart `Noto Sans` unterstützt sowohl lateinische als auch kyrillische Zeichen, sodass russischer Text korrekt angezeigt wird.

## 📱 Persistenz

Die gewählte Sprache wird automatisch im Browser gespeichert und beim nächsten Besuch wiederhergestellt.

## 🚀 Nächste Schritte

Um die Übersetzung zu vervollständigen, aktualisieren Sie:
1. ✅ Header (bereits erledigt)
2. ✅ Sidebar (bereits erledigt)
3. ⏳ Login-Seite
4. ⏳ Registrierungs-Seite
5. ⏳ Dashboard-Seite
6. ⏳ Belege-Seite
7. ⏳ Fehlermeldungen und Toast-Notifications

Alle Übersetzungen sind bereits in den JSON-Dateien vorhanden - Sie müssen nur `{t('key')}` in den Komponenten verwenden!
