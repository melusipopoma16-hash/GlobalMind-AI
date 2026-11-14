import test from 'node:test';
import assert from 'node:assert/strict';
import { parseInlineMarkdown, parseMarkdownBlocks, sanitizeHref } from './markdown';

test('sanitizeHref permits http/https and blocks javascript URIs', () => {
  assert.equal(sanitizeHref('https://example.com'), 'https://example.com');
  assert.equal(sanitizeHref('javascript:alert(1)'), null);
});

test('parseInlineMarkdown parses bold, italic, code, and safe links', () => {
  const segs = parseInlineMarkdown('Use **bold**, *italic*, `code`, and [docs](https://ai.dev).');
  assert.ok(segs.some((s) => s.type === 'bold' && s.text === 'bold'));
  assert.ok(segs.some((s) => s.type === 'italic' && s.text === 'italic'));
  assert.ok(segs.some((s) => s.type === 'code' && s.text === 'code'));
  assert.ok(segs.some((s) => s.type === 'link' && s.href === 'https://ai.dev'));
});

test('parseMarkdownBlocks handles headings, lists, code fences, and tables', () => {
  const sample = `# Title

Paragraph line one.

- First item
- Second item

\`\`\`ts
const x = 42;
\`\`\`

| Metric | Value |
| --- | --- |
| Speed | Fast |`;

  const blocks = parseMarkdownBlocks(sample);
  assert.equal(blocks[0].type, 'heading');
  assert.equal(blocks[1].type, 'paragraph');
  assert.equal(blocks[2].type, 'list');
  assert.equal(blocks[3].type, 'code');
  if (blocks[3].type === 'code') {
    assert.equal(blocks[3].language, 'ts');
    assert.equal(blocks[3].code, 'const x = 42;');
  }
  assert.equal(blocks[4].type, 'table');
});
