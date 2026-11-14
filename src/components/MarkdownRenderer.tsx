import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import {
  parseMarkdownBlocks,
  type InlineSegment,
  type MarkdownBlock,
} from '../utils/markdown';

function InlineSegments({ segments }: { segments: InlineSegment[] }) {
  return (
    <>
      {segments.map((seg, idx) => {
        if (seg.type === 'bold') {
          return (
            <strong key={idx} className="font-semibold text-slate-900 dark:text-white">
              {seg.text}
            </strong>
          );
        }
        if (seg.type === 'italic') {
          return (
            <em key={idx} className="italic">
              {seg.text}
            </em>
          );
        }
        if (seg.type === 'code') {
          return (
            <code
              key={idx}
              className="font-mono text-[0.875em] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80"
            >
              {seg.text}
            </code>
          );
        }
        if (seg.type === 'link') {
          return (
            <a
              key={idx}
              href={seg.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 dark:text-blue-400 underline underline-offset-2 hover:text-blue-800 dark:hover:text-blue-300"
            >
              {seg.label}
            </a>
          );
        }
        return <span key={idx}>{seg.text}</span>;
      })}
    </>
  );
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard unavailable
    }
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-100">
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900 border-b border-slate-800 text-xs text-slate-400">
        <span className="font-mono">{language || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy code snippet"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors min-h-[32px]"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-[13px] leading-relaxed font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function BlockRenderer({ block }: { block: MarkdownBlock }) {
  switch (block.type) {
    case 'heading': {
      if (block.level === 1) {
        return (
          <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-50 mt-4 mb-2 first:mt-0">
            <InlineSegments segments={block.segments} />
          </h3>
        );
      }
      if (block.level === 2) {
        return (
          <h4 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50 mt-3.5 mb-1.5 first:mt-0">
            <InlineSegments segments={block.segments} />
          </h4>
        );
      }
      return (
        <h5 className="font-display text-[15px] font-semibold text-slate-900 dark:text-slate-100 mt-3 mb-1 first:mt-0">
          <InlineSegments segments={block.segments} />
        </h5>
      );
    }
    case 'paragraph':
      return (
        <p className="text-[15px] leading-relaxed text-slate-800 dark:text-slate-200 my-2 first:mt-0 last:mb-0">
          <InlineSegments segments={block.segments} />
        </p>
      );
    case 'code':
      return <CodeBlock language={block.language} code={block.code} />;
    case 'blockquote':
      return (
        <blockquote className="my-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 px-4 py-2.5 text-[14px] leading-relaxed text-slate-700 dark:text-slate-300">
          {block.lines.map((line, i) => (
            <p key={i} className="my-1 first:mt-0 last:mb-0">
              <InlineSegments segments={line} />
            </p>
          ))}
        </blockquote>
      );
    case 'list': {
      const ListTag = block.ordered ? 'ol' : 'ul';
      return (
        <ListTag
          start={block.ordered ? block.start : undefined}
          className={`my-2.5 pl-5 space-y-1.5 text-[15px] leading-relaxed text-slate-800 dark:text-slate-200 ${
            block.ordered ? 'list-decimal' : 'list-disc'
          }`}
        >
          {block.items.map((item, idx) => (
            <li key={idx}>
              <InlineSegments segments={item} />
            </li>
          ))}
        </ListTag>
      );
    }
    case 'table':
      return (
        <div className="my-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left border-collapse text-sm tabular-nums">
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100">
              <tr>
                {block.headers.map((header, idx) => (
                  <th
                    key={idx}
                    className="px-3.5 py-2 font-semibold border-b border-slate-200 dark:border-slate-700"
                  >
                    <InlineSegments segments={header} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {block.rows.map((row, rIdx) => (
                <tr key={rIdx} className="bg-white dark:bg-slate-900/40">
                  {row.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className="px-3.5 py-2 text-slate-700 dark:text-slate-300"
                    >
                      <InlineSegments segments={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'hr':
      return <hr className="my-4 border-slate-200 dark:border-slate-800" />;
  }
}

export function MarkdownRenderer({ content }: { content: string }) {
  const blocks = parseMarkdownBlocks(content);
  return (
    <div className="min-w-0 break-words">
      {blocks.map((block, idx) => (
        <BlockRenderer key={idx} block={block} />
      ))}
    </div>
  );
}
