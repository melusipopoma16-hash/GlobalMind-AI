import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatFileSize,
  stripAttachmentPayloadsForStorage,
  validateAttachmentFile,
} from './attachments';

test('validateAttachmentFile accepts valid images and PDFs and rejects unsupported or oversized files', () => {
  assert.deepEqual(
    validateAttachmentFile({ name: 'photo.jpg', type: 'image/jpeg', size: 1024 * 500 }, 0),
    { valid: true }
  );
  assert.deepEqual(
    validateAttachmentFile({ name: 'notes.pdf', type: 'application/pdf', size: 1024 * 1024 }, 0),
    { valid: true }
  );
  const badType = validateAttachmentFile(
    { name: 'script.exe', type: 'application/x-msdownload', size: 1024 },
    0
  );
  assert.equal(badType.valid, false);

  const tooBigPdf = validateAttachmentFile(
    { name: 'huge.pdf', type: 'application/pdf', size: 12 * 1024 * 1024 },
    0
  );
  assert.equal(tooBigPdf.valid, false);

  const tooMany = validateAttachmentFile(
    { name: 'photo.png', type: 'image/png', size: 1024 },
    3
  );
  assert.equal(tooMany.valid, false);
});

test('formatFileSize formats bytes, KB, and MB cleanly', () => {
  assert.equal(formatFileSize(500), '500 B');
  assert.equal(formatFileSize(2048), '2 KB');
  assert.equal(formatFileSize(2.5 * 1024 * 1024), '2.5 MB');
});

test('stripAttachmentPayloadsForStorage removes base64Data and previewUrl', () => {
  const cleaned = stripAttachmentPayloadsForStorage([
    {
      id: 'a1',
      name: 'diagram.png',
      mimeType: 'image/png',
      sizeBytes: 12000,
      base64Data: 'huge_base64',
      previewUrl: 'data:image/png;base64,huge_base64',
    },
  ]);
  assert.ok(cleaned);
  assert.equal(cleaned[0].base64Data, undefined);
  assert.equal(cleaned[0].previewUrl, undefined);
  assert.equal(cleaned[0].name, 'diagram.png');
});
