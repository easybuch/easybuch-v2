import Anthropic from '@anthropic-ai/sdk';
import sharp from 'sharp';

// Validate API key at module load time
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('[Receipt OCR] CRITICAL: ANTHROPIC_API_KEY environment variable is not set!');
  console.error('[Receipt OCR] OCR functionality will not work until this is configured.');
}

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Anthropic API has a 5MB limit for images
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

export interface ReceiptData {
  betrag_netto: number | null;
  mwst_betrag: number | null;
  betrag_brutto: number | null;
  mwst_satz: number | null;
  vat_7_net: number | null;
  vat_7_tax: number | null;
  vat_19_net: number | null;
  vat_19_tax: number | null;
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
 * Compresses an image buffer to meet Anthropic's 5MB size limit
 * @param buffer - The original image buffer
 * @param mimeType - The MIME type of the image
 * @returns Compressed image buffer and its MIME type
 */
async function compressImageIfNeeded(
  buffer: Buffer,
  mimeType: string
): Promise<{ buffer: Buffer; mimeType: string }> {
  // Skip compression for PDFs
  if (mimeType === 'application/pdf') {
    return { buffer, mimeType };
  }

  // Check if compression is needed
  const base64Size = Math.ceil((buffer.length * 4) / 3); // Base64 is ~33% larger
  
  if (base64Size <= MAX_IMAGE_SIZE) {
    return { buffer, mimeType };
  }

  console.log(`Image too large (${(base64Size / 1024 / 1024).toFixed(2)}MB), compressing...`);

  try {
    // Start with 85% quality
    let quality = 85;
    let compressedBuffer = buffer;
    let compressedSize = base64Size;

    // Iteratively reduce quality until we're under the limit
    while (compressedSize > MAX_IMAGE_SIZE && quality > 20) {
      compressedBuffer = await sharp(buffer)
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();
      
      compressedSize = Math.ceil((compressedBuffer.length * 4) / 3);
      
      console.log(`Compressed to ${(compressedSize / 1024 / 1024).toFixed(2)}MB at ${quality}% quality`);
      
      if (compressedSize > MAX_IMAGE_SIZE) {
        quality -= 10;
      }
    }

    // If still too large, resize the image
    if (compressedSize > MAX_IMAGE_SIZE) {
      console.log('Still too large, resizing image...');
      const metadata = await sharp(buffer).metadata();
      const currentWidth = metadata.width || 2000;
      const newWidth = Math.floor(currentWidth * 0.8); // Reduce by 20%

      compressedBuffer = await sharp(buffer)
        .resize(newWidth, null, { withoutEnlargement: true })
        .jpeg({ quality: 80, mozjpeg: true })
        .toBuffer();

      compressedSize = Math.ceil((compressedBuffer.length * 4) / 3);
      console.log(`Resized to ${(compressedSize / 1024 / 1024).toFixed(2)}MB`);
    }

    return { buffer: compressedBuffer, mimeType: 'image/jpeg' };
  } catch (error) {
    console.error('Error compressing image:', error);
    // Return original if compression fails
    return { buffer, mimeType };
  }
}

/**
 * Extracts receipt data from one or more images/PDFs using Claude 3.5 Sonnet
 * @param files - Array of file buffers with their MIME types, or a single buffer with mimeType (for backward compatibility)
 * @param mimeType - The MIME type (only used if files is a single Buffer)
 * @returns Extracted receipt data
 */
export async function extractReceiptData(
  files: { buffer: Buffer; mimeType: string }[] | Buffer,
  mimeType?: string
): Promise<ReceiptData> {
  // Backward compatibility: Convert single buffer to array format
  const fileArray = Array.isArray(files) 
    ? files 
    : [{ buffer: files, mimeType: mimeType! }];
  try {
    // Validate API key at runtime
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('[Receipt OCR] Runtime check: ANTHROPIC_API_KEY is missing');
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    // Validate API key format (basic check)
    if (!process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-')) {
      console.error('[Receipt OCR] Invalid API key format detected');
      throw new Error('ANTHROPIC_API_KEY has invalid format');
    }

    // Process all files
    const processedFiles: Array<{
      base64Data: string;
      mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
      contentType: 'image' | 'document';
    }> = [];

    for (const file of fileArray) {
      // Compress image if needed to meet Anthropic's 5MB limit
      const { buffer: processedBuffer, mimeType: processedMimeType } = 
        await compressImageIfNeeded(file.buffer, file.mimeType);

      // Convert buffer to base64
      const base64Data = processedBuffer.toString('base64');

      // Determine media type for Claude
      let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
      let contentType: 'image' | 'document' = 'image';
      
      if (processedMimeType === 'image/jpeg' || processedMimeType === 'image/jpg') {
        mediaType = 'image/jpeg';
      } else if (processedMimeType === 'image/png') {
        mediaType = 'image/png';
      } else if (processedMimeType === 'application/pdf') {
        // For PDFs, we'll use document type
        mediaType = 'image/png'; // placeholder, will use document type
        contentType = 'document';
      } else {
        throw new Error(`Unsupported file type: ${processedMimeType}`);
      }

      processedFiles.push({ base64Data, mediaType, contentType });
    }

    // Create the prompt for Claude
    const isMultiImage = processedFiles.length > 1;
    const multiImageNote = isMultiImage 
      ? `\n\nWICHTIG: Du erhältst ${processedFiles.length} Bilder, die TEILE EINES EINZIGEN BELEGS sind (z.B. ein langer Kassenbon, der in mehrere Teile fotografiert wurde). Analysiere ALLE Bilder zusammen als EINEN Beleg und extrahiere die Gesamtinformationen.\n\n`
      : '';
    
    const prompt = `Analysiere diesen Beleg und extrahiere die folgenden Informationen. Gib die Daten im JSON-Format zurück.${multiImageNote}

WICHTIG:
- Alle Beträge in Euro (€) als Zahlen ohne Währungssymbol
- Datum im Format YYYY-MM-DD
- Falls ein Wert nicht gefunden wird, setze ihn auf null
- Kategorie muss eine der folgenden sein: ${RECEIPT_CATEGORIES.join(', ')}

KRITISCH - MwSt.-Aufschlüsselung:
Suche auf dem Beleg nach einer MwSt.-Tabelle am Ende (oft mit "MWST%", "MWST", "Netto", "Brutto" beschriftet).
Wenn du MEHRERE MwSt.-Sätze findest (z.B. "A 7%" und "B 19%" oder ähnlich):
- Extrahiere für JEDEN Steuersatz separat die Netto- und MwSt.-Beträge
- vat_7_net = Netto-Betrag für 7% Artikel
- vat_7_tax = MwSt.-Betrag für 7% Artikel
- vat_19_net = Netto-Betrag für 19% Artikel
- vat_19_tax = MwSt.-Betrag für 19% Artikel
- betrag_netto = Summe aller Netto-Beträge
- mwst_betrag = Summe aller MwSt.-Beträge
- betrag_brutto = Gesamtbetrag (zu zahlen / Karte / Summe)
- mwst_satz = höchster vorkommender Satz (meist 19)

Wenn nur EIN MwSt.-Satz vorhanden ist:
- Fülle vat_7_net/vat_7_tax ODER vat_19_net/vat_19_tax (je nach Satz)
- Die anderen bleiben null

JSON-Schema:
{
  "betrag_netto": number | null,
  "mwst_betrag": number | null,
  "betrag_brutto": number | null,
  "mwst_satz": number | null,
  "vat_7_net": number | null,
  "vat_7_tax": number | null,
  "vat_19_net": number | null,
  "vat_19_tax": number | null,
  "datum": "YYYY-MM-DD" | null,
  "lieferant": string | null,
  "kategorie": string | null
}

Beispiel für gemischten Beleg (LIDL-Beleg mit MwSt-Tabelle am Ende):
Wenn auf dem Beleg steht:
  MWST%    MWST +   Netto  = Brutto
  A  7 %    4,13    59,03    63,16
  B 19 %    0,04     0,21     0,25
  Summe     4,17    59,24    63,41

Dann extrahiere:
{
  "betrag_netto": 59.24,
  "mwst_betrag": 4.17,
  "betrag_brutto": 63.41,
  "mwst_satz": 19,
  "vat_7_net": 59.03,
  "vat_7_tax": 4.13,
  "vat_19_net": 0.21,
  "vat_19_tax": 0.04,
  "datum": "2024-10-18",
  "lieferant": "LIDL",
  "kategorie": "Verpflegung & Bewirtung"
}

Beispiel für einfachen Beleg (nur ein MwSt.-Satz):
{
  "betrag_netto": 84.03,
  "mwst_betrag": 15.97,
  "betrag_brutto": 100.00,
  "mwst_satz": 19,
  "vat_7_net": null,
  "vat_7_tax": null,
  "vat_19_net": 84.03,
  "vat_19_tax": 15.97,
  "datum": "2024-03-15",
  "lieferant": "REWE",
  "kategorie": "Verpflegung & Bewirtung"
}

Gib NUR das JSON zurück, ohne zusätzlichen Text oder Markdown-Formatierung.`;

    // Call Claude API with fallback support
    // Note: Different API keys have access to different model versions
    const modelsToTry = [
      'claude-3-5-sonnet-20241022', // Latest 3.5 (if available)
      'claude-3-haiku-20240307',     // Haiku (cheap and fast, good for OCR)
    ];

    let message: Anthropic.Message | undefined;
    let lastError: unknown;
    
    for (const model of modelsToTry) {
      try {
        console.log(`[Receipt OCR] Trying model: ${model}`);
        
        // Build content array with all images/documents
        const content: Array<any> = [];
        
        // Add all files
        for (const file of processedFiles) {
          if (file.contentType === 'document') {
            content.push({
              type: 'document' as const,
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: file.base64Data,
              },
            });
          } else {
            content.push({
              type: 'image' as const,
              source: {
                type: 'base64',
                media_type: file.mediaType,
                data: file.base64Data,
              },
            });
          }
        }
        
        // Add prompt text at the end
        content.push({
          type: 'text',
          text: prompt,
        });
        
        message = await anthropic.messages.create({
          model: model,
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content,
            },
          ],
        });
        
        console.log(`[Receipt OCR] ✓ Successfully used model: ${model}`);
        break; // Success! Exit the loop
        
      } catch (error) {
        lastError = error;
        
        // If it's a 404 (model not found), try the next model
        if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
          console.log(`[Receipt OCR] ✗ Model ${model} not available (404), trying next...`);
          continue;
        }
        
        // For other errors (auth, rate limit, etc.), throw immediately
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Receipt OCR] ✗ Error with model ${model}:`, errorMessage);
        throw error;
      }
    }

    // If we exhausted all models, throw the last error
    if (!message) {
      console.error('[Receipt OCR] ✗ All models failed!');
      throw lastError || new Error('All Claude models unavailable');
    }

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
      vat_7_net: extractedData.vat_7_net ?? null,
      vat_7_tax: extractedData.vat_7_tax ?? null,
      vat_19_net: extractedData.vat_19_net ?? null,
      vat_19_tax: extractedData.vat_19_tax ?? null,
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
