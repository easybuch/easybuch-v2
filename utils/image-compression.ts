/**
 * Client-side image compression utility using native Canvas API
 * No external dependencies - 100% browser native
 */

const MAX_DIMENSION = 2048; // Max width/height in pixels
const JPEG_QUALITY = 0.85; // 85% quality
const TARGET_SIZE = 1.5 * 1024 * 1024; // Target 1.5MB per image

/**
 * Compresses an image file to reduce size while maintaining readability for OCR
 * @param file - The image file to compress
 * @returns Promise<File> - Compressed image file
 */
export async function compressImage(file: File): Promise<File> {
  // Skip if not an image
  if (!file.type.startsWith('image/')) {
    return file;
  }

  // Skip if already small enough
  if (file.size <= TARGET_SIZE) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onerror = () => reject(new Error('Failed to load image'));
      
      img.onload = () => {
        try {
          // Calculate new dimensions (maintain aspect ratio)
          let { width, height } = img;
          
          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            if (width > height) {
              height = (height / width) * MAX_DIMENSION;
              width = MAX_DIMENSION;
            } else {
              width = (width / height) * MAX_DIMENSION;
              height = MAX_DIMENSION;
            }
          }

          // Create canvas and draw resized image
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Use better image smoothing for quality
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Draw image
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              // Create new File object with compressed data
              const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^.]+$/, '.jpg'), // Force .jpg extension
                {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                }
              );

              console.log(
                `[Compression] ${file.name}: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`
              );

              resolve(compressedFile);
            },
            'image/jpeg',
            JPEG_QUALITY
          );
        } catch (error) {
          reject(error);
        }
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Compresses multiple images in parallel
 * @param files - Array of files to compress
 * @returns Promise<File[]> - Array of compressed files
 */
export async function compressImages(files: File[]): Promise<File[]> {
  return Promise.all(files.map(file => compressImage(file)));
}
