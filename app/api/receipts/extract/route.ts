import { NextRequest, NextResponse } from 'next/server';
import { extractReceiptData } from '@/lib/receipt-ocr';

export const runtime = 'nodejs';
export const maxDuration = 30; // 30 seconds timeout for OCR processing

/**
 * Validates file signature (magic numbers) to ensure file content matches declared type
 * This prevents malicious files disguised with wrong extensions
 */
function validateFileSignature(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 4) return false;

  const header = buffer.slice(0, 8);
  
  // JPEG: FF D8 FF
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    return header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF;
  }
  
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (mimeType === 'image/png') {
    return header[0] === 0x89 && header[1] === 0x50 && 
           header[2] === 0x4E && header[3] === 0x47;
  }
  
  // PDF: 25 50 44 46 (%PDF)
  if (mimeType === 'application/pdf') {
    return header[0] === 0x25 && header[1] === 0x50 && 
           header[2] === 0x44 && header[3] === 0x46;
  }
  
  return false;
}

/**
 * POST /api/receipts/extract
 * Extracts data from a receipt image or PDF using Claude 3.5 Sonnet
 */
export async function POST(request: NextRequest) {
  try {
    // Get the file from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type (browser-provided MIME type)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG, PNG, and PDF are supported.' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate actual file content (Magic Number validation)
    // This prevents malicious files disguised with wrong extensions
    const isValidFile = validateFileSignature(buffer, file.type);
    if (!isValidFile) {
      return NextResponse.json(
        { error: 'File content does not match the declared type. Possible security risk.' },
        { status: 400 }
      );
    }

    // Extract receipt data using Claude
    const extractedData = await extractReceiptData(buffer, file.type);

    return NextResponse.json({
      success: true,
      data: extractedData,
    });
  } catch (error) {
    console.error('Error in receipt extraction API:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('ANTHROPIC_API_KEY')) {
        return NextResponse.json(
          { error: 'OCR service not configured. Please contact support.' },
          { status: 500 }
        );
      }

      if (error.message.includes('Unsupported file type')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to extract receipt data. Please try again.' },
      { status: 500 }
    );
  }
}
