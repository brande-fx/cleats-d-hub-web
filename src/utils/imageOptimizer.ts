/**
 * Compresses and resizes uploaded footwear images in the browser before uploading
 * to Supabase Storage. Keeps file sizes lightweight (typically 60-180 KB) to
 * improve storefront load speed and stay well within Supabase Free Tier limits.
 */
export async function optimizeProductImage(
  file: File,
  maxDimension = 1200,
  quality = 0.84
): Promise<{blob: Blob; fileName: string; mimeType: string}> {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Only JPG, PNG, and WebP images are supported.');
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Image file must be under 10 MB.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read selected image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid or corrupted image file.'));
      img.onload = () => {
        let {width, height} = img;
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable for image optimization.'));
          return;
        }

        ctx.fillStyle = '#DDDCDB';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const targetMime = 'image/webp';
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              // Fallback to JPEG if browser cannot encode WebP
              canvas.toBlob(
                (jpegBlob) => {
                  if (!jpegBlob) {
                    reject(new Error('Image compression failed.'));
                    return;
                  }
                  const base = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '-');
                  resolve({
                    blob: jpegBlob,
                    fileName: `${base}-${Date.now()}.jpg`,
                    mimeType: 'image/jpeg',
                  });
                },
                'image/jpeg',
                quality
              );
              return;
            }
            const base = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '-');
            resolve({
              blob,
              fileName: `${base}-${Date.now()}.webp`,
              mimeType: targetMime,
            });
          },
          targetMime,
          quality
        );
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to convert image to data URL.'));
    reader.readAsDataURL(blob);
  });
}
