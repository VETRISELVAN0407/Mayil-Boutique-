/* Client-side checks and resizing for the Virtual Try-On photo. The backend validates again; this only gives quick,
   clear messages and keeps phone photos under the upload limit. Keep the limits in step with TryOnProperties. */

export const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_PHOTO_INPUT_BYTES = 25 * 1024 * 1024; // before resizing; phone photos are often large
const MIN_SIDE = 256;
const MAX_UPLOAD_SIDE = 1600; // long side after resizing
const JPEG_QUALITY = 0.9;

function loadImage(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('unreadable')); };
    img.src = url;
  });
}

function toBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode'))), 'image/jpeg', JPEG_QUALITY);
  });
}

/**
 * Validates a chosen or captured photo and returns { blob, previewUrl, width, height } (a resized JPEG).
 * Throws an Error whose message can be shown to the customer as it is.
 */
export async function prepareTryOnPhoto(file) {
  if (!file) throw new Error('Please choose a photo.');
  if (!ALLOWED_PHOTO_TYPES.includes(file.type)) throw new Error('Please use a JPG, PNG or WebP photo.');
  if (file.size > MAX_PHOTO_INPUT_BYTES) throw new Error('This photo is too large. Please choose one under 25 MB.');

  let img;
  try {
    img = await loadImage(file);
  } catch {
    throw new Error('This photo could not be read. It may be damaged. Please try another one.');
  }
  const { naturalWidth: w, naturalHeight: h } = img;
  if (Math.min(w, h) < MIN_SIDE) {
    throw new Error(`This photo is too small. It must be at least ${MIN_SIDE} pixels on each side.`);
  }
  // A landscape photo is not rejected (the result reports `landscape` so the page can hint at a standing photo).

  const scale = Math.min(1, MAX_UPLOAD_SIDE / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff'; // transparent PNGs become white, not black, in JPEG
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const blob = await toBlob(canvas);
  return { blob, previewUrl: URL.createObjectURL(blob), width: canvas.width, height: canvas.height, landscape: h < w };
}
