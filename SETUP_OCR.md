# Setup: Beleg-Erkennung mit Claude 3.5 Sonnet

## ✅ Installation abgeschlossen

Die automatische Beleg-Erkennung wurde erfolgreich implementiert!

## 🔑 API Key konfigurieren

### Schritt 1: Anthropic API Key einfügen

Öffnen Sie die Datei `.env.local` in Ihrem Projektverzeichnis und fügen Sie Ihren API Key hinzu:

```bash
# Fügen Sie diese Zeile zu Ihrer .env.local Datei hinzu:
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Wichtig:** Ersetzen Sie `sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx` mit Ihrem echten Anthropic API Key.

### Schritt 2: Development Server neu starten

Nach dem Hinzufügen des API Keys müssen Sie den Development Server neu starten:

```bash
npm run dev
```

## 🎯 Wie es funktioniert

### Automatischer Ablauf

1. **Beleg hochladen**: Nutzer lädt ein Bild oder PDF hoch
2. **KI-Analyse**: Claude 3.5 Sonnet analysiert automatisch den Beleg
3. **Datenextraktion**: Folgende Daten werden extrahiert:
   - Bruttobetrag
   - Nettobetrag
   - MwSt.-Betrag
   - MwSt.-Satz
   - Datum
   - Lieferant/Händler
   - Kategorie (Bürobedarf, Fahrtkosten, etc.)
4. **Speicherung**: Alle Daten werden automatisch in der Datenbank gespeichert

### Unterstützte Dateiformate

- ✅ JPG/JPEG
- ✅ PNG
- ✅ PDF

### Maximale Dateigröße

- 10 MB pro Datei

## 💰 Kosten

### Claude 3.5 Sonnet Preise

- **Input**: $3 pro 1 Million Tokens
- **Output**: $15 pro 1 Million Tokens

### Geschätzte Kosten pro Beleg

- **Durchschnittlich**: ~$0.0045 pro Beleg
- **100 Belege**: ~$0.45
- **1.000 Belege**: ~$4.50
- **10.000 Belege**: ~$45.00

**Weit unter dem Budget von $1 pro 100 Belege!**

## 📁 Implementierte Dateien

### Backend

1. **`/lib/receipt-ocr.ts`**
   - Service für Beleg-Extraktion mit Claude 3.5 Sonnet
   - Unterstützt Bilder und PDFs
   - Strukturierte JSON-Ausgabe

2. **`/app/api/receipts/extract/route.ts`**
   - API-Endpunkt für OCR-Verarbeitung
   - Validierung von Dateityp und -größe
   - Error Handling

### Frontend

3. **`/app/upload/page.tsx`** (aktualisiert)
   - Automatische Extraktion beim Upload
   - Live-Anzeige der erkannten Daten
   - Fehlerbehandlung und Fallback

## 🔧 Technische Details

### API-Endpunkt

```
POST /api/receipts/extract
Content-Type: multipart/form-data

Body: FormData mit 'file' field
```

### Response Format

```json
{
  "success": true,
  "data": {
    "betrag_netto": 84.03,
    "mwst_betrag": 15.97,
    "betrag_brutto": 100.00,
    "mwst_satz": 19,
    "datum": "2024-03-15",
    "lieferant": "REWE",
    "kategorie": "Verpflegung"
  }
}
```

### Kategorien

Die KI ordnet Belege automatisch einer der folgenden Kategorien zu:

- Bürobedarf
- Fahrtkosten
- Verpflegung
- Unterkunft
- Marketing
- Software
- Hardware
- Beratung
- Versicherung
- Miete
- Sonstiges

## 🚀 Nächste Schritte (Optional)

### 1. GPT-4o als Fallback (später)

Falls Claude bei bestimmten Belegen Probleme hat, kann GPT-4o als Fallback implementiert werden:

```typescript
// In /lib/receipt-ocr.ts ist bereits eine Funktion vorbereitet:
export async function extractReceiptDataWithGPT4o(...)
```

### 2. Batch-Verarbeitung

Für große Mengen an Belegen kann eine Batch-Verarbeitung implementiert werden.

### 3. Manuelle Korrektur

In der Beleg-Detail-Ansicht können Nutzer die automatisch erkannten Daten manuell korrigieren.

## ⚠️ Troubleshooting

### "OCR service not configured"

**Problem**: API Key fehlt oder ist falsch konfiguriert

**Lösung**: 
1. Überprüfen Sie, ob `ANTHROPIC_API_KEY` in `.env.local` gesetzt ist
2. Starten Sie den Development Server neu: `npm run dev`

### "Failed to extract receipt data"

**Problem**: Claude konnte den Beleg nicht analysieren

**Lösung**:
- Überprüfen Sie die Bildqualität
- Stellen Sie sicher, dass der Text lesbar ist
- Der Beleg kann trotzdem gespeichert und später manuell bearbeitet werden

### Rate Limits

Anthropic hat Rate Limits für API-Anfragen. Bei vielen Uploads in kurzer Zeit kann es zu Fehlern kommen.

**Lösung**: Implementieren Sie Retry-Logik mit exponential backoff (kann später hinzugefügt werden)

## 📊 Monitoring

### Logs überprüfen

Die API loggt alle Fehler in der Konsole:

```bash
# Development Server Logs anschauen
npm run dev
```

### Kosten überwachen

Überwachen Sie Ihre API-Nutzung im Anthropic Dashboard:
https://console.anthropic.com/

## ✅ Fertig!

Die Beleg-Erkennung ist jetzt einsatzbereit. Testen Sie es, indem Sie einen Beleg hochladen!

---

**Bei Fragen oder Problemen**: Überprüfen Sie die Logs oder kontaktieren Sie den Support.
