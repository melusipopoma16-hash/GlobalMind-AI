import type { ChatAttachment } from '../types/chat';

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf'] as const;
export const MAX_PDF_BYTES = 8 * 1024 * 1024; // 8 MB
export const MAX_RAW_IMAGE_BYTES = 18 * 1024 * 1024; // 18 MB before client resize
export const MAX_ATTACHMENTS_PER_MESSAGE = 3;

export function isAllowedAttachmentMime(mimeType: string): boolean {
  return (
    (ALLOWED_IMAGE_TYPES as readonly string[]).includes(mimeType) ||
    (ALLOWED_DOCUMENT_TYPES as readonly string[]).includes(mimeType)
  );
}

export function validateAttachmentFile(
  file: { name: string; type: string; size: number },
  existingCount = 0
): { valid: true } | { valid: false; reason: string } {
  if (existingCount >= MAX_ATTACHMENTS_PER_MESSAGE) {
    return {
      valid: false,
      reason: `You can attach up to ${MAX_ATTACHMENTS_PER_MESSAGE} files per message.`,
    };
  }
  if (!isAllowedAttachmentMime(file.type)) {
    return {
      valid: false,
      reason: `"${file.name}" is not supported. Please attach a PNG, JPG, WEBP image or a PDF document.`,
    };
  }
  if (file.type === 'application/pdf' && file.size > MAX_PDF_BYTES) {
    return {
      valid: false,
      reason: `"${file.name}" exceeds the 8 MB PDF limit for reliable mobile uploads.`,
    };
  }
  if (file.type.startsWith('image/') && file.size > MAX_RAW_IMAGE_BYTES) {
    return {
      valid: false,
      reason: `"${file.name}" is too large (max 18 MB).`,
    };
  }
  return { valid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function stripAttachmentPayloadsForStorage(
  attachments?: ChatAttachment[]
): ChatAttachment[] | undefined {
  if (!attachments || attachments.length === 0) return undefined;
  return attachments.map((att) => ({
    id: att.id,
    name: att.name,
    mimeType: att.mimeType,
    sizeBytes: att.sizeBytes,
  }));
}

function readFileAsBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const commaIdx = result.indexOf(',');
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(new Error('Could not read selected file.'));
    reader.readAsDataURL(blob);
  });
}

async function compressImageForUpload(
  file: File,
  lowDataMode: boolean
): Promise<{ base64Data: string; mimeType: string; sizeBytes: number; previewUrl: string }> {
  const maxDim = lowDataMode ? 800 : 1280;
  const quality = lowDataMode ? 0.65 : 0.82;

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Unable to load image preview.'));
      el.src = objectUrl;
    });

    const scale = Math.min(1, maxDim / Math.max(img.width, img.height, 1));
    const targetW = Math.max(1, Math.round(img.width * scale));
    const targetH = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      const rawBase64 = await readFileAsBase64(file);
      return {
        base64Data: rawBase64,
        mimeType: file.type,
        sizeBytes: file.size,
        previewUrl: `data:${file.type};base64,${rawBase64}`,
      };
    }

    ctx.drawImage(img, 0, 0, targetW, targetH);
    const outMime = file.type === 'image/png' && !lowDataMode ? 'image/png' : 'image/jpeg';
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Image compression failed.'))),
        outMime,
        quality
      );
    });

    const base64Data = await readFileAsBase64(blob);
    return {
      base64Data,
      mimeType: outMime,
      sizeBytes: blob.size,
      previewUrl: `data:${outMime};base64,${base64Data}`,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function prepareAttachment(
  file: File,
  lowDataMode: boolean,
  id: string
): Promise<ChatAttachment> {
  if (file.type.startsWith('image/')) {
    const compressed = await compressImageForUpload(file, lowDataMode);
    return {
      id,
      name: file.name,
      mimeType: compressed.mimeType,
      sizeBytes: compressed.sizeBytes,
      base64Data: compressed.base64Data,
      previewUrl: compressed.previewUrl,
    };
  }

  const base64Data = await readFileAsBase64(file);
  return {
    id,
    name: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    base64Data,
  };
}
