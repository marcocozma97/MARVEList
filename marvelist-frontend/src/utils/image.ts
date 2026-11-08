const MAX_SIDE = 1280;
const MAX_BYTES = 560 * 1024;

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, quality));

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

export const compressImage = async (file: File): Promise<string> => {
  if (!file.type.startsWith('image/')) throw new Error('Il file scelto non è un\'immagine');

  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error('Impossibile leggere questa immagine');
  });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Impossibile elaborare l\'immagine');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  for (const quality of [0.82, 0.7, 0.55, 0.4]) {
    let blob = await canvasToBlob(canvas, 'image/webp', quality);
    if (!blob || blob.type !== 'image/webp') blob = await canvasToBlob(canvas, 'image/jpeg', quality);
    if (blob && blob.size <= MAX_BYTES) return blobToDataUrl(blob);
  }
  throw new Error('Immagine troppo pesante anche dopo la compressione');
};
