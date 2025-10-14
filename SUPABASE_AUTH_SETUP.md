# Supabase Authentication Setup

## 1. Email Authentication aktivieren

Gehen Sie zu **Supabase Dashboard → Authentication → Providers**

### Email Provider konfigurieren:
- ✅ **Enable Email provider** aktivieren
- ✅ **Confirm email** aktivieren (empfohlen für Production)
- ⚠️ Für Development: **Confirm email** deaktivieren (schnelleres Testing)

## 2. Email Templates anpassen (Optional)

Gehen Sie zu **Supabase Dashboard → Authentication → Email Templates**

### Verfügbare Templates:
- **Confirm signup** - Bestätigungs-Email nach Registrierung
- **Invite user** - Einladungs-Email
- **Magic Link** - Passwortloser Login
- **Change Email Address** - Email-Änderung bestätigen
- **Reset Password** - Passwort zurücksetzen

### Beispiel: Confirm Signup Template anpassen

```html
<h2>Willkommen bei EasyBuch!</h2>
<p>Bitte bestätigen Sie Ihre E-Mail-Adresse:</p>
<p><a href="{{ .ConfirmationURL }}">E-Mail bestätigen</a></p>
```

## 3. Site URL konfigurieren

Gehen Sie zu **Supabase Dashboard → Authentication → URL Configuration**

### Für Development:
- **Site URL:** `http://localhost:3000`
- **Redirect URLs:** `http://localhost:3000/auth/callback`

### Für Production:
- **Site URL:** `https://ihre-domain.de`
- **Redirect URLs:** `https://ihre-domain.de/auth/callback`

## 4. Email Rate Limiting (Optional)

Gehen Sie zu **Supabase Dashboard → Authentication → Rate Limits**

Empfohlene Einstellungen:
- **Email sends per hour:** 10 (verhindert Spam)
- **SMS sends per hour:** 5

## 5. Testing ohne Email-Bestätigung

Für schnelleres Development können Sie Email-Bestätigung deaktivieren:

**Dashboard → Authentication → Providers → Email**
- ❌ **Confirm email** deaktivieren

Dann können sich User sofort nach Registrierung anmelden.

## 6. Production Checklist

Vor dem Live-Gang:

- [ ] **Confirm email** aktivieren
- [ ] Email Templates anpassen (Branding)
- [ ] Site URL auf Production-Domain setzen
- [ ] Redirect URLs konfigurieren
- [ ] Rate Limiting aktivieren
- [ ] SMTP Server konfigurieren (optional, für eigene Email-Domain)

## 7. SMTP Server (Optional - Eigene Email-Domain)

Gehen Sie zu **Supabase Dashboard → Project Settings → Auth**

### Custom SMTP konfigurieren:
```
Host: smtp.ihre-domain.de
Port: 587
User: noreply@ihre-domain.de
Password: ***
Sender email: noreply@ihre-domain.de
Sender name: EasyBuch
```

**Vorteile:**
- Professionellere Emails
- Bessere Zustellrate
- Eigene Domain in Absender-Adresse

## 8. Troubleshooting

### Problem: Email kommt nicht an
- Überprüfen Sie Spam-Ordner
- Prüfen Sie Email Rate Limits
- Testen Sie mit verschiedenen Email-Providern

### Problem: Confirmation Link funktioniert nicht
- Überprüfen Sie Redirect URLs
- Stellen Sie sicher, dass Site URL korrekt ist
- Prüfen Sie `/auth/callback` Route

### Problem: "Email not confirmed"
- Deaktivieren Sie "Confirm email" für Development
- Oder: Bestätigen Sie Email manuell im Dashboard

## 9. Manuelle Email-Bestätigung (Development)

Falls Sie Email-Bestätigung aktiviert haben, aber keine Emails erhalten:

**Dashboard → Authentication → Users**
- Klicken Sie auf den User
- Klicken Sie "Confirm email"

Jetzt kann sich der User anmelden.

## 10. Next Steps

Nach dem Auth-Setup:

1. Testen Sie Registration Flow
2. Testen Sie Login Flow
3. Testen Sie Logout
4. Führen Sie `PRODUCTION_POLICIES.sql` aus
5. Testen Sie Upload mit echtem User
6. Verifizieren Sie RLS Policies
