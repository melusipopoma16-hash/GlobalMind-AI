export type InlineSegment =
  | { type: 'text'; text: string }
  | { type: 'bold'; text: string }
  | { type: 'italic'; text: string }
  | { type: 'code'; text: string }
  | { type: 'link'; label: string; href: string };

export type MarkdownBlock =
  | { type: 'heading'; level: 1 | 2 | 3; segments: InlineSegment[] }
  | { type: 'paragraph'; segments: InlineSegment[] }
  | { type: 'code'; language: string; code: string }
  | { type: 'blockquote'; lines: InlineSegment[][] }
  | { type: 'list'; ordered: boolean; start?: number; items: InlineSegment[][] }
  | { type: 'table'; headers: InlineSegment[][]; rows: InlineSegment[][][] }
  | { type: 'hr' };

export function sanitizeHref(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return null;
}

export function parseInlineMarkdown(text: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', text: text.slice(lastIndex, match.index) });
    }
    const token = match[0];
    if (token.startsWith('`') && token.endsWith('`')) {
      segments.push({ type: 'code', text: token.slice(1, -1) });
    } else if (token.startsWith('**') && token.endsWith('**')) {
      segments.push({ type: 'bold', text: token.slice(2, -2) });
    } else if (token.startsWith('*') && token.endsWith('*')) {
      segments.push({ type: 'italic', text: token.slice(1, -1) });
    } else if (token.startsWith('[')) {
      const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      if (linkMatch) {
        const safeHref = sanitizeHref(linkMatch[2]);
        if (safeHref) {
          segments.push({ type: 'link', label: linkMatch[1], href: safeHref });
        } else {
          segments.push({ type: 'text', text: linkMatch[1] });
        }
      } else {
        segments.push({ type: 'text', text: token });
      }
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', text: text.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ type: 'text', text: '' }];
}

function isTableSeparator(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes('|')) return false;
  const cells = trimmed
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());
  return cells.length > 0 && cells.every((c) => /^:?-{2,}:?$/.test(c));
}

function splitTableCells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());
}

export function parseMarkdownBlocks(input: string): MarkdownBlock[] {
  const lines = input.replace(/\r\n/g, '\n').split('\n');
  const blocks: MarkdownBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    // Fenced code block
    if (trimmed.startsWith('```')) {
      const language = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i += 1;
      }
      if (i < lines.length && lines[i].trim().startsWith('```')) {
        i += 1;
      }
      blocks.push({ type: 'code', language, code: codeLines.join('\n') });
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ type: 'hr' });
      i += 1;
      continue;
    }

    // Heading
    const headingMatch = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    if (headingMatch) {
      const level = headingMatch[1].length as 1 | 2 | 3;
      blocks.push({
        type: 'heading',
        level,
        segments: parseInlineMarkdown(headingMatch[2]),
      });
      i += 1;
      continue;
    }

    // Table
    if (
      trimmed.includes('|') &&
      i + 1 < lines.length &&
      isTableSeparator(lines[i + 1])
    ) {
      const headerCells = splitTableCells(line).map(parseInlineMarkdown);
      i += 2;
      const rows: InlineSegment[][][] = [];
      while (i < lines.length && lines[i].trim().includes('|')) {
        rows.push(splitTableCells(lines[i]).map(parseInlineMarkdown));
        i += 1;
      }
      blocks.push({ type: 'table', headers: headerCells, rows });
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      const quoteLines: InlineSegment[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(
          parseInlineMarkdown(lines[i].trim().replace(/^>\s?/, ''))
        );
        i += 1;
      }
      blocks.push({ type: 'blockquote', lines: quoteLines });
      continue;
    }

    // Unordered or Ordered List
    const ulMatch = /^[-*+]\s+(.+)$/.exec(trimmed);
    const olMatch = /^(\d+)\.\s+(.+)$/.exec(trimmed);
    if (ulMatch || olMatch) {
      const ordered = Boolean(olMatch);
      const start = olMatch ? Number(olMatch[1]) : undefined;
      const items: InlineSegment[][] = [];
      while (i < lines.length) {
        const cur = lines[i].trim();
        const m = ordered
          ? /^\d+\.\s+(.+)$/.exec(cur)
          : /^[-*+]\s+(.+)$/.exec(cur);
        if (!m) break;
        items.push(parseInlineMarkdown(m[1]));
        i += 1;
      }
      blocks.push({ type: 'list', ordered, start, items });
      continue;
    }

    // Paragraph (collect consecutive non-empty non-block lines)
    const paraLines: string[] = [trimmed];
    i += 1;
    while (i < lines.length) {
      const next = lines[i].trim();
      if (
        !next ||
        next.startsWith('```') ||
        /^(#{1,3})\s+/.test(next) ||
        /^[-*+]\s+/.test(next) ||
        /^\d+\.\s+/.test(next) ||
        next.startsWith('>') ||
        /^(-{3,}|\*{3,}|_{3,})$/.test(next)
      ) {
        break;
      }
      paraLines.push(next);
      i += 1;
    }
    blocks.push({
      type: 'paragraph',
      segments: parseInlineMarkdown(paraLines.join(' ')),
    });
  }

  return blocks;
}
