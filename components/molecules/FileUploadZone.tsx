'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Camera, X, FileText, ZoomIn, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import { cn } from '@/utils/cn';

export interface UploadedFile {
  file: File;
  preview?: string;
}

export interface FileUploadZoneProps {
  onFileSelect: (file: UploadedFile | null) => void;
  uploadedFile: UploadedFile | null;
  error?: string | null;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/pdf': ['.pdf'],
};

export function FileUploadZone({ onFileSelect, uploadedFile, error }: FileUploadZoneProps) {
  const { t } = useLanguage();
  const [localError, setLocalError] = useState<string | null>(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: unknown[]) => {
      setLocalError(null);

      if (rejectedFiles.length > 0) {
        setLocalError(t('receipts.uploadError'));
        return;
      }

      if (acceptedFiles.length === 0) {
        return;
      }

      const file = acceptedFiles[0];

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setLocalError(t('receipts.uploadError'));
        return;
      }

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          onFileSelect({
            file,
            preview: reader.result as string,
          });
        };
        reader.readAsDataURL(file);
      } else {
        onFileSelect({ file });
      }
    },
    [onFileSelect, t]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxFiles: 1,
    multiple: false,
    noClick: true, // Disable default click to use custom handler
    noKeyboard: false,
  });

  // Custom click handler for better mobile support
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  // Handle manual file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const filesArray = Array.from(files);
      onDrop(filesArray, []);
    }
  };

  const handleChangeFile = () => {
    onFileSelect(null);
    setLocalError(null);
    setShowLightbox(false);
  };

  const isImage = uploadedFile?.file.type.startsWith('image/');

  // Keyboard support for lightbox (ESC to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showLightbox) {
        setShowLightbox(false);
      }
    };

    if (showLightbox) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when lightbox is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [showLightbox]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const displayError = error || localError;

  return (
    <div className="w-full h-full">
      {!uploadedFile ? (
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
              : 'bg-gray-50 hover:bg-brand/5',
            displayError && 'bg-red-50'
          )}
        >
          {/* Hidden file input for better mobile support */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf"
            capture="environment"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />
          <input {...getInputProps()} style={{ display: 'none' }} />

          {/* Icon */}
          <div className="mb-6">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-brand/10 flex items-center justify-center mx-auto">
              {isDragActive ? (
                <Upload size={40} className="text-brand animate-bounce" />
              ) : (
                <div className="relative">
                  <Upload size={40} className="text-brand" />
                  <Camera
                    size={20}
                    className="text-brand absolute -bottom-1 -right-1 md:hidden"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Text */}
          <div className="space-y-2">
            <p className="text-lg md:text-xl font-semibold text-text-primary">
              {isDragActive ? t('receipts.uploading') : t('receipts.dragDrop')}
            </p>
            <p className="text-sm md:text-base text-text-secondary">
              {t('receipts.dragDrop')}
            </p>
            <p className="text-xs md:text-sm text-text-footer mt-4">
              {t('receipts.supportedFormats')}
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
      ) : (
        <div className="border-2 border-brand rounded-card overflow-hidden bg-white">
          {/* Image Preview (Large) */}
          {isImage && uploadedFile.preview ? (
            <div className="relative">
              <div className="w-full bg-gray-50 flex items-center justify-center p-8">
                <img
                  src={uploadedFile.preview}
                  alt={t('receipts.viewDetails')}
                  className="max-h-[200px] md:max-h-[250px] w-auto rounded-button shadow-lg object-contain cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setShowLightbox(true)}
                />
              </div>
              {/* Zoom Button Overlay */}
              <button
                onClick={() => setShowLightbox(true)}
                className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-button shadow-md transition-all group"
                aria-label={t('receipts.viewDetails')}
              >
                <ZoomIn size={20} className="text-text-secondary group-hover:text-brand" />
              </button>
            </div>
          ) : (
            /* PDF Preview (Small) */
            <div className="p-6 md:p-8 bg-brand/5 flex items-center gap-4">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-button bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                <FileText size={32} className="text-brand" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-text-primary truncate">
                  {uploadedFile.file.name}
                </p>
                <p className="text-sm text-text-footer mt-1">
                  {formatFileSize(uploadedFile.file.size)}
                </p>
              </div>
            </div>
          )}

          {/* File Info & Actions */}
          <div className="p-6 md:p-8 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* File Details (for images) */}
              {isImage && (
                <div className="flex-1">
                  <p className="font-semibold text-text-primary truncate">
                    {uploadedFile.file.name}
                  </p>
                  <p className="text-sm text-text-footer mt-1">
                    {formatFileSize(uploadedFile.file.size)}
                  </p>
                </div>
              )}

              {/* Status Badge */}
              <div className={cn('flex items-center gap-3', !isImage && 'flex-1')}>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-pill">
                  <div className="w-2 h-2 rounded-full bg-green-600" />
                  <span className="text-xs font-medium text-green-800">{t('common.save')}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons - Only for Images */}
            {isImage && (
              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  onClick={handleChangeFile}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand hover:bg-brand/10 rounded-button transition-colors"
                >
                  <RefreshCw size={16} />
                  {t('receipts.uploadNew')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {displayError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-button">
          <p className="text-sm text-red-800 font-medium">{displayError}</p>
        </div>
      )}

      {/* Lightbox Modal */}
      {showLightbox && isImage && uploadedFile?.preview && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowLightbox(false)}
        >
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-button transition-colors"
            aria-label={t('common.close')}
          >
            <X size={24} className="text-white" />
          </button>
          <div className="max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <img
              src={uploadedFile.preview}
              alt={t('receipts.viewDetails')}
              className="max-w-full max-h-full object-contain rounded-button"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-button">
            <p className="text-white text-sm font-medium">{uploadedFile.file.name}</p>
          </div>
        </div>
      )}
    </div>
  );
}
