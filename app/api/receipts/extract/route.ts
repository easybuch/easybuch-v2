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
    // Get the files from the request
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Validate file types and sizes
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const maxFiles = 5;

    if (files.length > maxFiles) {
      return NextResponse.json(
        { error: `Maximum ${maxFiles} files allowed` },
        { status: 400 }
      );
    }

    // Process all files
    const fileBuffers: { buffer: Buffer; mimeType: string }[] = [];

    for (const file of files) {
      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.name}. Only JPG, PNG, and PDF are supported.` },
          { status: 400 }
        );
      }

      // Validate file size
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: `File too large: ${file.name}. Maximum size is 10MB.` },
          { status: 400 }
        );
      }

      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Validate actual file content (Magic Number validation)
      const isValidFile = validateFileSignature(buffer, file.type);
      if (!isValidFile) {
        return NextResponse.json(
          { error: `File content does not match the declared type: ${file.name}. Possible security risk.` },
          { status: 400 }
        );
      }

      fileBuffers.push({ buffer, mimeType: file.type });
    }

    // Extract receipt data using Claude (with multi-image support)
    const extractedData = await extractReceiptData(fileBuffers);

    return NextResponse.json({
      success: true,
      data: extractedData,
    });
  } catch (error) {
    console.error('Error in receipt extraction API:', error);

    // Extract error message safely from various error types
    let errorMessage = 'Failed to extract receipt data. Please try again.';
    let statusCode = 500;

    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('ANTHROPIC_API_KEY')) {
        errorMessage = 'OCR service not configured. Please contact support.';
      } else if (error.message.includes('Unsupported file type')) {
        errorMessage = error.message;
        statusCode = 400;
      } else {
        // Use the error message but sanitize it
        errorMessage = error.message;
      }
    } else if (error && typeof error === 'object') {
      // Handle Anthropic SDK errors which may have various structures
      if ('message' in error && typeof error.message === 'string') {
        errorMessage = error.message;
      } else if ('error' in error && typeof error.error === 'object' && error.error !== null) {
        const err = error.error as Record<string, unknown>;
        if ('message' in err && typeof err.message === 'string') {
          errorMessage = err.message;
        }
      }
      
      // Check for status code in error object
      if ('status' in error && typeof error.status === 'number') {
        statusCode = error.status >= 400 && error.status < 600 ? error.status : 500;
      }
    }

    // Always return a valid JSON response
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}
