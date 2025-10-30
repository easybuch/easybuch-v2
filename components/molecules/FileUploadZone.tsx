'use client';

import { useCallback, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Camera, FileText } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import { cn } from '@/utils/cn';
import { compressImage } from '@/utils/image-compression';

export interface UploadedFile {
  file: File;
  preview?: string;
  id: string;
}

export interface FileUploadZoneProps {
  onFileSelect: (files: UploadedFile[]) => void;
  uploadedFiles: UploadedFile[];
  error?: string | null;
  onStartExtraction?: () => void;
  isExtracting?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/pdf': ['.pdf'],
};

export function FileUploadZone({ onFileSelect, uploadedFiles, error, onStartExtraction, isExtracting }: FileUploadZoneProps) {
  const { t } = useLanguage();
  const [localError, setLocalError] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: unknown[]) => {
      setLocalError(null);

      if (rejectedFiles.length > 0) {
        setLocalError(t('receipts.uploadError'));
        return;
      }

      if (acceptedFiles.length === 0) {
        return;
      }

      // Validate file sizes
      const oversizedFiles = acceptedFiles.filter(file => file.size > MAX_FILE_SIZE);
      if (oversizedFiles.length > 0) {
        setLocalError(t('receipts.uploadError'));
        return;
      }

      try {
        // Compress images before processing
        const compressedFiles = await Promise.all(
          acceptedFiles.map(file => compressImage(file))
        );

        // Process all files
        const newFiles: UploadedFile[] = [];
        let processedCount = 0;

        compressedFiles.forEach((file) => {
          const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          // Create preview for images
          if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = () => {
              newFiles.push({
                file,
                preview: reader.result as string,
                id: fileId,
              });
              processedCount++;
              
              // When all files are processed, update state
              if (processedCount === compressedFiles.length) {
                onFileSelect([...uploadedFiles, ...newFiles]);
              }
            };
            reader.readAsDataURL(file);
          } else {
            newFiles.push({ file, id: fileId });
            processedCount++;
            
            // When all files are processed, update state
            if (processedCount === compressedFiles.length) {
              onFileSelect([...uploadedFiles, ...newFiles]);
            }
          }
        });
      } catch (error) {
        console.error('Compression error:', error);
        setLocalError('Fehler beim Komprimieren der Bilder. Bitte versuchen Sie es erneut.');
      }
    },
    [onFileSelect, t, uploadedFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxFiles: 5,
    multiple: true,
    noClick: true, // Disable default click to use custom handler
    noKeyboard: false,
  });

  // Handle camera input separately for mobile
  const handleCameraChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    await onDrop(fileArray, []);
    
    // Reset input so same file can be selected again
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  // Custom click handler for camera button
  const handleCameraClick = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('Camera button clicked', cameraInputRef.current); // Debug log
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    } else {
      console.error('Camera input ref is null');
    }
  };

  // Custom click handler for initial upload zone
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    cameraInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const displayError = error || localError;

  return (
    <div className="w-full h-full relative">
      {/* Hidden camera input - placed outside dropzone for direct control */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*,application/pdf"
        capture="environment"
        multiple
        onChange={handleCameraChange}
        style={{ display: 'none' }}
      />
      
      {uploadedFiles.length === 0 ? (
        /* Upload Zone - No files */
        <div
          {...getRootProps()}
          onClick={handleClick}
          className={cn(
            'relative rounded-card p-8 h-full',
            'transition-all duration-200 cursor-pointer',
            'flex flex-col items-center justify-center text-center',
            'min-h-[320px] md:min-h-[400px]',
            isDragActive
              ? 'bg-brand/10 scale-[1.02]'
              : 'bg-gray-50 hover:bg-green-50 border-2 border-dashed border-gray-300 hover:border-brand',
            displayError && 'border-red-300'
          )}
        >
          <input {...getInputProps()} />

          {/* Upload Icon */}
          <div className="mb-6">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-brand/10 flex items-center justify-center mx-auto">
              <Upload size={40} className="text-brand" />
            </div>
          </div>

          {/* Text */}
          <div className="space-y-2 mb-6">
            <h3 className="text-lg md:text-xl font-semibold text-text-primary">
              {isDragActive ? t('receipts.dropHere') : t('receipts.dragDrop')}
            </h3>
            <p className="text-sm text-text-secondary">
              {t('receipts.uploadNew')}
            </p>
            <p className="text-xs text-text-footer">
              JPG, PNG, PDF • Max. 10MB • Bis zu 5 Bilder
            </p>
          </div>

          {/* Mobile Camera Hint */}
          <div className="mt-6 md:hidden">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand/10 rounded-button">
              <Camera size={16} className="text-brand" />
              <span className="text-xs text-brand font-medium">{t('receipts.uploadNew')}</span>
            </div>
          </div>
        </div>
      ) : uploadedFiles.length === 1 ? (
        /* Single File Display - Like before */
        <div className="border-2 border-brand rounded-card overflow-hidden bg-white h-full">
          {uploadedFiles[0].preview ? (
            /* Image Preview */
            <div className="relative h-full flex flex-col">
              <div className="flex-1 bg-gray-50 flex items-center justify-center p-8">
                <img
                  src={uploadedFiles[0].preview}
                  alt={t('receipts.viewDetails')}
                  className="max-h-[300px] w-auto rounded-button shadow-lg object-contain"
                />
              </div>
              
              {/* File Info */}
              <div className="p-6 border-t border-gray-200">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-primary truncate">
                      {uploadedFiles[0].file.name}
                    </p>
                    <p className="text-sm text-text-footer mt-1">
                      {formatFileSize(uploadedFiles[0].file.size)}
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-pill">
                    <div className="w-2 h-2 rounded-full bg-green-600" />
                    <span className="text-xs font-medium text-green-800">{t('common.save')}</span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleCameraClick}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-brand hover:bg-brand/10 rounded-button transition-colors border border-brand"
                    disabled={isExtracting}
                  >
                    <Camera size={18} />
                    <span>Weiteres Foto</span>
                  </button>
                  {onStartExtraction && (
                    <button
                      onClick={onStartExtraction}
                      disabled={isExtracting}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-brand text-white hover:bg-brand/90 rounded-button transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isExtracting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Analysiere...</span>
                        </>
                      ) : (
                        <>
                          <span>✓</span>
                          <span>Jetzt analysieren</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* PDF Preview */
            <div className="h-full flex flex-col">
              <div className="flex-1 p-6 bg-brand/5 flex items-center gap-4">
                <div className="w-20 h-20 rounded-button bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                  <FileText size={32} className="text-brand" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text-primary truncate">
                    {uploadedFiles[0].file.name}
                  </p>
                  <p className="text-sm text-text-footer mt-1">
                    {formatFileSize(uploadedFiles[0].file.size)}
                  </p>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200">
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleCameraClick}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-brand hover:bg-brand/10 rounded-button transition-colors border border-brand"
                    disabled={isExtracting}
                  >
                    <Camera size={18} />
                    <span>Weiteres Foto</span>
                  </button>
                  {onStartExtraction && (
                    <button
                      onClick={onStartExtraction}
                      disabled={isExtracting}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-brand text-white hover:bg-brand/90 rounded-button transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isExtracting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Analysiere...</span>
                        </>
                      ) : (
                        <>
                          <span>✓</span>
                          <span>Jetzt analysieren</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Multiple Files Display - Grid */
        <div className="h-full flex flex-col">
          <div className="flex-1 overflow-auto">
            <div className="grid grid-cols-2 gap-3 p-4">
              {uploadedFiles.map((file, index) => (
                <div key={file.id} className="border-2 border-brand rounded-button overflow-hidden bg-white">
                  {file.preview && (
                    <div className="aspect-[3/4] bg-gray-50 flex items-center justify-center p-2">
                      <img
                        src={file.preview}
                        alt={`Teil ${index + 1}`}
                        className="max-w-full max-h-full object-contain rounded"
                      />
                    </div>
                  )}
                  <div className="p-2 bg-gray-50 border-t border-gray-200">
                    <p className="text-xs text-text-footer text-center font-medium">Teil {index + 1}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Action Bar */}
          <div className="p-4 border-t-2 border-gray-200 bg-white space-y-3">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-2 px-4 py-2 bg-green-100 rounded-pill">
                <div className="w-2 h-2 rounded-full bg-green-600" />
                <span className="text-sm font-medium text-green-800">
                  {uploadedFiles.length} {uploadedFiles.length === 1 ? 'Datei' : 'Dateien'} bereit
                </span>
              </div>
            </div>
            
            {/* Mobile: Add more photos or start extraction */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCameraClick}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-brand hover:bg-brand/10 rounded-button transition-colors border border-brand"
                disabled={isExtracting}
              >
                <Camera size={18} />
                <span>Weiteres Foto</span>
              </button>
              {onStartExtraction && (
                <button
                  onClick={onStartExtraction}
                  disabled={isExtracting}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-brand text-white hover:bg-brand/90 rounded-button transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExtracting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Analysiere...</span>
                    </>
                  ) : (
                    <>
                      <span>✓</span>
                      <span>Jetzt analysieren</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {displayError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-button">
          <p className="text-sm text-red-800 font-medium">{displayError}</p>
        </div>
      )}

    </div>
  );
}
