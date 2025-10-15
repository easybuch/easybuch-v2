import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export interface ReceiptData {
  betrag_netto: number | null;
  mwst_betrag: number | null;
  betrag_brutto: number | null;
  mwst_satz: number | null;
  datum: string | null; // Format: YYYY-MM-DD
  lieferant: string | null;
  kategorie: string | null;
  raw_text?: string;
}

export const RECEIPT_CATEGORIES = [
  'Büromaterial & Ausstattung',
  'Fahrtkosten (Kraftstoff & Parkplatz)',
  'Fahrtkosten (ÖPNV & Bahn)',
  'Verpflegung & Bewirtung',
  'Unterkunft & Reisen',
  'Software & Lizenzen',
  'Hardware & Elektronik',
  'Telekommunikation & Internet',
  'Marketing & Werbung',
  'Website & Online-Dienste',
  'Steuerberatung',
  'Rechtsberatung',
  'Versicherungen',
  'Miete & Nebenkosten',
  'Weiterbildung',
  'Sonstiges',
] as const;

export type ReceiptCategory = typeof RECEIPT_CATEGORIES[number];

/**
 * Extracts receipt data from an image or PDF using Claude 3.5 Sonnet
 * @param fileBuffer - The file buffer (image or PDF)
 * @param mimeType - The MIME type of the file (e.g., 'image/jpeg', 'application/pdf')
 * @returns Extracted receipt data
 */
export async function extractReceiptData(
  fileBuffer: Buffer,
  mimeType: string
): Promise<ReceiptData> {
  try {
    // Validate API key
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    // Convert buffer to base64
    const base64Data = fileBuffer.toString('base64');

    // Determine media type for Claude
    // Note: Claude API supports PDFs via document type, not image type
    let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
    let contentType: 'image' | 'document' = 'image';
    
    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
      mediaType = 'image/jpeg';
    } else if (mimeType === 'image/png') {
      mediaType = 'image/png';
    } else if (mimeType === 'application/pdf') {
      // For PDFs, we'll use document type
      mediaType = 'image/png'; // placeholder, will use document type
      contentType = 'document';
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

    // Create the prompt for Claude
    const prompt = `Analysiere diesen Beleg und extrahiere die folgenden Informationen. Gib die Daten im JSON-Format zurück.

WICHTIG:
- Alle Beträge in Euro (€) als Zahlen ohne Währungssymbol
- Datum im Format YYYY-MM-DD
- Falls ein Wert nicht gefunden wird, setze ihn auf null
- Bei mehreren MwSt.-Sätzen, nimm den höchsten
- Kategorie muss eine der folgenden sein: ${RECEIPT_CATEGORIES.join(', ')}

JSON-Schema:
{
  "betrag_netto": number | null,
  "mwst_betrag": number | null,
  "betrag_brutto": number | null,
  "mwst_satz": number | null,
  "datum": "YYYY-MM-DD" | null,
  "lieferant": string | null,
  "kategorie": string | null
}

Beispiel:
{
  "betrag_netto": 84.03,
  "mwst_betrag": 15.97,
  "betrag_brutto": 100.00,
  "mwst_satz": 19,
  "datum": "2024-03-15",
  "lieferant": "REWE",
  "kategorie": "Verpflegung"
}

Gib NUR das JSON zurück, ohne zusätzlichen Text oder Markdown-Formatierung.`;

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            contentType === 'document' 
              ? {
                  type: 'document' as const,
                  source: {
                    type: 'base64',
                    media_type: 'application/pdf',
                    data: base64Data,
                  },
                }
              : {
                  type: 'image' as const,
                  source: {
                    type: 'base64',
                    media_type: mediaType,
                    data: base64Data,
                  },
                },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    // Extract the response text
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse JSON response
    let extractedData: ReceiptData;
    try {
      // Remove markdown code blocks if present
      const cleanedText = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      extractedData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse Claude response:', responseText);
      throw new Error('Failed to parse OCR response');
    }

    // Validate and clean the data
    const result: ReceiptData = {
      betrag_netto: extractedData.betrag_netto ?? null,
      mwst_betrag: extractedData.mwst_betrag ?? null,
      betrag_brutto: extractedData.betrag_brutto ?? null,
      mwst_satz: extractedData.mwst_satz ?? null,
      datum: extractedData.datum ?? null,
      lieferant: extractedData.lieferant ?? null,
      kategorie: extractedData.kategorie ?? null,
      raw_text: responseText,
    };

    // Validate category
    if (result.kategorie && !RECEIPT_CATEGORIES.includes(result.kategorie as ReceiptCategory)) {
      result.kategorie = 'Sonstiges';
    }

    return result;
  } catch (error) {
    console.error('Error extracting receipt data:', error);
    throw error;
  }
}

/**
 * Fallback function using GPT-4o if Claude fails
 * This can be implemented later as a backup strategy
 */
// Commented out unused function to pass build
// export async function extractReceiptDataWithGPT4o(
//   fileBuffer: Buffer,
//   mimeType: string
// ): Promise<ReceiptData> {
//   // TODO: Implement GPT-4o fallback
//   throw new Error('GPT-4o fallback not yet implemented');
// }
