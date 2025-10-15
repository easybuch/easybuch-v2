import { NextRequest, NextResponse } from 'next/server';
import { extractReceiptData } from '@/lib/receipt-ocr';

export const runtime = 'nodejs';
export const maxDuration = 30; // 30 seconds timeout for OCR processing

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

    // Validate file type
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
