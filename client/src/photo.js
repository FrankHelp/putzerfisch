// Client-seitige Bild-Kompression (Spec: max. 1512px längste Kante, Export als JPG).
const MAX_EDGE = 1512;
const QUALITY = 0.82;

/**
 * Skaliert eine Bilddatei herunter und liefert ein JPEG als data-URL
 * (data:image/jpeg;base64, …) für den Upload.
 */
export async function compressToJpegDataUrl(file) {
  const bitmap = await loadImage(file);
  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', QUALITY);
  } finally {
    // ImageBitmap (createImageBitmap) braucht explizite Freigabe.
    if (typeof bitmap.close === 'function') bitmap.close();
  }
}

async function loadImage(file) {
  // createImageBitmap respektiert die EXIF-Orientierung (iPhone-Fotos).
  // Fallback: klassisches <img> (dreht Fotos auf alten Browsern ggf. nicht).
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      // Fallback unten
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error('Bild konnte nicht geladen werden.'));
      img.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}
