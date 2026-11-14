import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, ThinkingLevel, type GenerateContentResponse } from '@google/genai';
import {
  buildSearchQuery,
  filterRelevantSearchHits,
  shouldPerformWebSearch,
  stripHtmlTags,
} from './src/utils/webSearch.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const MODEL_NAME = 'gemini-4-hydrogen';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

const WIKI_LANG_CODES = new Set([
  'en',
  'es',
  'fr',
  'ar',
  'zh',
  'hi',
  'pt',
  'sw',
  'de',
  'ja',
  'ko',
  'id',
  'tr',
  'ru',
]);

const TOPIC_INSTRUCTIONS: Record<string, string> = {
  general:
    'Provide clear, accurate, well-structured answers across everyday questions, global knowledge, and research.',
  education:
    'Act as a supportive tutor for homework and education. Break down explanations step by step, show reasoning clearly, and help the learner understand why each step works.',
  technology:
    'Act as a practical technology and computer support specialist. Offer clear troubleshooting steps from simplest to advanced, and clean, well-explained code when asked.',
  business:
    'Act as a pragmatic entrepreneurship and business advisor. Provide concrete frameworks, market validation steps, unit economics considerations, and actionable next steps.',
  science:
    'Act as a clear science and world geography communicator. Explain mechanisms accurately with intuitive examples and precise terminology.',
  language:
    'Act as an expert writer, translator, and language coach. Preserve tone and cultural nuance, and briefly explain grammar or phrasing choices when helpful.',
  creative:
    'Act as a creative strategist and problem-solving partner. Offer original angles, structured frameworks, and concrete options.',
};

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish (Español)',
  fr: 'French (Français)',
  ar: 'Arabic (العربية)',
  zh: 'Chinese (中文)',
  hi: 'Hindi (हिन्दी)',
  pt: 'Portuguese (Português)',
  sw: 'Swahili (Kiswahili)',
  de: 'German (Deutsch)',
  ja: 'Japanese (日本語)',
  ko: 'Korean (한국어)',
  id: 'Indonesian (Bahasa Indonesia)',
  tr: 'Turkish (Türkçe)',
  ru: 'Russian (Русский)',
};

interface ModeDirective {
  thinkingDepth: 'fast' | 'balanced';
  directive: string;
}

const MODE_DIRECTIVES: Record<string, ModeDirective> = {
  balanced: {
    thinkingDepth: 'fast',
    directive: 'Give a well-balanced, clear answer with key takeaways.',
  },
  concise: {
    thinkingDepth: 'fast',
    directive: 'Keep the answer brief and scannable using concise bullet points.',
  },
  detailed: {
    thinkingDepth: 'balanced',
    directive: 'Provide a thorough, structured guide covering nuances, trade-offs, and concrete examples.',
  },
  worked: {
    thinkingDepth: 'balanced',
    directive:
      'Show a complete step-by-step worked explanation, numbering each step clearly and verifying the final result.',
  },
  socratic: {
    thinkingDepth: 'balanced',
    directive:
      'Use Socratic tutoring: explain the core concept, give a helpful first-step hint without spoiling the entire answer immediately, and ask the student a guiding question to check understanding.',
  },
  quiz: {
    thinkingDepth: 'fast',
    directive:
      'Generate 3 progressive practice questions (easy, medium, challenge) on the requested topic and wait for the learner to answer before revealing solutions.',
  },
  validate: {
    thinkingDepth: 'balanced',
    directive:
      'Evaluate the business idea candidly: identify the target customer, biggest risk assumption, realistic startup costs, and a concrete week-1 validation experiment under $100.',
  },
  lean: {
    thinkingDepth: 'balanced',
    directive:
      'Present a concise Lean Canvas as a structured Markdown table covering Problem, Customer Segments, Unique Value Proposition, Channels, Revenue Model, and Key Metrics.',
  },
  pitch: {
    thinkingDepth: 'fast',
    directive:
      'Craft a crisp 30-second elevator pitch, 3 value-proposition headlines, and actionable local or online customer acquisition channels.',
  },
  translate: {
    thinkingDepth: 'fast',
    directive:
      'Translate accurately while preserving tone. Provide both a natural everyday version and a polite/formal version, plus brief notes on key idioms or register.',
  },
  tutor: {
    thinkingDepth: 'fast',
    directive:
      'Conduct an interactive dialogue in the target language at the learner’s level. Gently correct any mistakes in a brief note, then continue the conversation with a natural follow-up question.',
  },
  grammar: {
    thinkingDepth: 'balanced',
    directive:
      'Explain the grammar rule or sentence correction clearly with side-by-side examples and simple phonetic pronunciation tips.',
  },
  brainstorm: {
    thinkingDepth: 'balanced',
    directive:
      'Generate distinct, original ideas grouped from grounded/practical to bold/unconventional so the user has real variety.',
  },
  story: {
    thinkingDepth: 'balanced',
    directive:
      'Focus on vivid storytelling craft: strong hooks, character motivation, sensory detail, and narrative tension.',
  },
  matrix: {
    thinkingDepth: 'balanced',
    directive:
      'Apply structured problem-solving frameworks (such as weighted decision matrices, First Principles, or SCAMPER) to help clarify choices objectively.',
  },
  troubleshoot: {
    thinkingDepth: 'balanced',
    directive:
      'Provide numbered troubleshooting steps ordered from fastest/safest check to advanced fix, warning clearly before any destructive action like resetting data.',
  },
  code: {
    thinkingDepth: 'balanced',
    directive:
      'Provide clean, idiomatic, well-commented code inside fenced code blocks and explain the root cause or key logic clearly.',
  },
  explain: {
    thinkingDepth: 'fast',
    directive:
      'Explain the technical concept in plain everyday language with a concrete real-world analogy.',
  },
  concept: {
    thinkingDepth: 'fast',
    directive:
      'Explain the scientific or geographic mechanism clearly using an intuitive everyday analogy alongside accurate terminology.',
  },
  deep: {
    thinkingDepth: 'balanced',
    directive:
      'Provide a rigorous, structured scientific breakdown including physical/biological mechanisms, key principles, and real-world evidence.',
  },
  facts: {
    thinkingDepth: 'fast',
    directive:
      'Present key geographic, environmental, or factual data in clean bullet points or a comparison table.',
  },
};

interface IncomingAttachment {
  name?: string;
  mimeType?: string;
  base64Data?: string;
}

interface IncomingMessage {
  role: 'user' | 'assistant';
  content: string;
  attachments?: IncomingAttachment[];
}

interface ChatRequestBody {
  messages?: IncomingMessage[];
  topicId?: string;
  interactionMode?: string;
  languageCode?: string;
  webSearchEnabled?: boolean;
  lowDataMode?: boolean;
}

interface WebSource {
  title: string;
  uri: string;
}

interface SearchHit {
  title: string;
  uri: string;
  snippet: string;
}

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function formatGeminiError(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  const statusMatch = /\b(400|401|403|404|429|500|503)\b/.exec(raw);
  const statusCode = statusMatch ? Number(statusMatch[1]) : 500;

  if (statusCode === 401 || statusCode === 403 || /API_KEY_INVALID|PERMISSION_DENIED/i.test(raw)) {
    return {
      status: 403,
      message:
        'The AI service key is missing or invalid. Please check GEMINI_API_KEY in Settings > Secrets.',
    };
  }
  if (statusCode === 429 || /RESOURCE_EXHAUSTED/i.test(raw)) {
    return {
      status: 429,
      message:
        'GlobalMind AI is currently busy due to high demand on the free tier. Please wait a few seconds and tap Try again.',
    };
  }
  if (statusCode === 404 || /NOT_FOUND/i.test(raw)) {
    return {
      status: 502,
      message: 'The configured AI model is temporarily unavailable. Please retry shortly.',
    };
  }
  if (statusCode === 400) {
    return {
      status: 400,
      message:
        'The request or attached file could not be processed. Try a smaller image/PDF or rephrase your prompt.',
    };
  }
  return {
    status: 500,
    message:
      'AI service is temporarily unavailable. Please check your internet connection and try again.',
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function queryWikipediaSearch(queryText: string, lang: string): Promise<SearchHit[]> {
  const wikiLang = WIKI_LANG_CODES.has(lang) ? lang : 'en';
  const endpoint = new URL(`https://${wikiLang}.wikipedia.org/w/api.php`);
  endpoint.searchParams.set('action', 'query');
  endpoint.searchParams.set('list', 'search');
  endpoint.searchParams.set('srsearch', queryText);
  endpoint.searchParams.set('srlimit', '3');
  endpoint.searchParams.set('format', 'json');

  const res = await fetch(endpoint.toString(), {
    headers: { 'User-Agent': 'GlobalMindAI/1.0 (free educational assistant)' },
    signal: AbortSignal.timeout(2200),
  });
  if (!res.ok) return [];
  const data = (await res.json()) as {
    query?: { search?: Array<{ title?: string; snippet?: string }> };
  };
  const items = data.query?.search ?? [];
  return items
    .filter((item): item is { title: string; snippet?: string } => typeof item.title === 'string')
    .map((item) => ({
      title: item.title,
      uri: `https://${wikiLang}.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/\s+/g, '_'))}`,
      snippet: stripHtmlTags(item.snippet ?? ''),
    }));
}

async function fetchLiveWebContext(userQuery: string, languageCode: string): Promise<SearchHit[]> {
  const cleanQuery = buildSearchQuery(userQuery);
  if (!cleanQuery) return [];
  try {
    const primary = filterRelevantSearchHits(
      cleanQuery,
      await queryWikipediaSearch(cleanQuery, languageCode)
    );
    if (primary.length > 0 || languageCode === 'en' || languageCode === 'auto') {
      return primary;
    }
    return filterRelevantSearchHits(cleanQuery, await queryWikipediaSearch(cleanQuery, 'en'));
  } catch {
    return [];
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  app.get('/api/health', (_req, res) => {
    const ai = getAiClient();
    res.json({ ok: true, configured: ai !== null, model: MODEL_NAME });
  });

  app.post('/api/chat', async (req, res) => {
    const body = (req.body ?? {}) as ChatRequestBody;
    const rawMessages = Array.isArray(body.messages) ? body.messages : [];
    const topicId = typeof body.topicId === 'string' ? body.topicId : 'general';
    const interactionMode = typeof body.interactionMode === 'string' ? body.interactionMode : '';
    const languageCode = typeof body.languageCode === 'string' ? body.languageCode : 'auto';
    const webSearchEnabled = body.webSearchEnabled !== false;
    const lowDataMode = Boolean(body.lowDataMode);

    const validMessages = rawMessages.filter((m): m is IncomingMessage => {
      if (!m || (m.role !== 'user' && m.role !== 'assistant')) return false;
      const hasText = typeof m.content === 'string' && m.content.trim().length > 0;
      const hasFiles = Array.isArray(m.attachments) && m.attachments.some((a) => Boolean(a?.base64Data));
      return hasText || hasFiles;
    });

    if (validMessages.length === 0) {
      res.status(400).json({ error: 'Please enter a message or attach an image/PDF before sending.' });
      return;
    }

    const ai = getAiClient();
    if (!ai) {
      res.status(503).json({
        error:
          'GlobalMind AI service is not configured yet. Please add GEMINI_API_KEY in the Settings > Secrets panel.',
      });
      return;
    }

    let hasAttachments = false;
    const contents = validMessages.slice(-16).map((m) => {
      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

      if (Array.isArray(m.attachments)) {
        for (const att of m.attachments.slice(0, 3)) {
          if (
            att &&
            typeof att.mimeType === 'string' &&
            ALLOWED_MIME_TYPES.has(att.mimeType) &&
            typeof att.base64Data === 'string' &&
            att.base64Data.length > 0
          ) {
            hasAttachments = true;
            parts.push({
              inlineData: {
                mimeType: att.mimeType,
                data: att.base64Data,
              },
            });
          }
        }
      }

      const textValue = typeof m.content === 'string' ? m.content.trim() : '';
      if (textValue) {
        parts.push({ text: textValue });
      } else if (parts.length > 0) {
        parts.push({ text: 'Analyze the attached file and summarize the key information clearly.' });
      }

      return {
        role: m.role === 'assistant' ? 'model' : 'user',
        parts,
      };
    });

    const latestUserMessage = [...validMessages].reverse().find((m) => m.role === 'user');
    const latestQueryText = latestUserMessage?.content ?? '';

    let liveHits: SearchHit[] = [];
    if (
      shouldPerformWebSearch(
        latestQueryText,
        webSearchEnabled,
        hasAttachments,
        topicId,
        interactionMode
      )
    ) {
      liveHits = await fetchLiveWebContext(latestQueryText, languageCode);
    }

    const topicFocus = TOPIC_INSTRUCTIONS[topicId] ?? TOPIC_INSTRUCTIONS.general;
    const modeConfig = MODE_DIRECTIVES[interactionMode];
    const modeInstruction = modeConfig ? modeConfig.directive : '';
    const targetLanguage = LANGUAGE_NAMES[languageCode];
    const languageInstruction = targetLanguage
      ? `Respond in ${targetLanguage} unless the user explicitly requests translation into another language.`
      : 'Respond in the same language as the user’s latest message unless they ask for a translation.';

    const speedInstruction = lowDataMode
      ? 'Keep your answer concise, scannable, and compact to save mobile bandwidth while remaining accurate.'
      : 'Be thorough yet clear, using concise headings, bullet points, tables, or fenced code blocks where helpful.';

    const searchContextInstruction =
      liveHits.length > 0
        ? `\n\nLive reference context retrieved for the user's question (use these verified facts if relevant; do not invent extra URLs):\n${liveHits
            .map((h, i) => `[${i + 1}] ${h.title} (${h.uri}): ${h.snippet}`)
            .join('\n')}`
        : '';

    const systemInstruction = [
      'You are GlobalMind AI, a free, helpful, accurate, and thoughtful personal AI assistant designed for people worldwide.',
      topicFocus,
      modeInstruction,
      languageInstruction,
      speedInstruction,
      'Format mathematical expressions and variables cleanly using plain text or Unicode symbols (×, ÷, √, ², ³, π, ≤, ≥, ≠) rather than raw $...$ or $$...$$ LaTeX delimiters.',
      'Be honest about uncertainty and never fabricate facts, statistics, or URLs.',
      searchContextInstruction,
    ]
      .filter(Boolean)
      .join(' ');

    const thinkingLevel =
      lowDataMode || modeConfig?.thinkingDepth === 'fast'
        ? ThinkingLevel.LOW
        : ThinkingLevel.MEDIUM;

    let stream: AsyncIterable<GenerateContentResponse> | null = null;
    let lastError: unknown = null;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        stream = await ai.models.generateContentStream({
          model: MODEL_NAME,
          contents,
          config: {
            systemInstruction,
            thinkingConfig: { thinkingLevel },
          },
        });
        break;
      } catch (err) {
        lastError = err;
        const formatted = formatGeminiError(err);
        if ((formatted.status === 429 || formatted.status >= 500) && attempt < 2) {
          await sleep(600 * 2 ** attempt);
          continue;
        }
        res.status(formatted.status).json({ error: formatted.message });
        return;
      }
    }

    if (!stream) {
      const formatted = formatGeminiError(lastError);
      res.status(formatted.status).json({ error: formatted.message });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    let clientDisconnected = false;
    req.on('close', () => {
      clientDisconnected = true;
    });

    try {
      for await (const chunk of stream) {
        if (clientDisconnected) break;
        const text = chunk.text;
        if (text) {
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }

      if (!clientDisconnected) {
        if (liveHits.length > 0) {
          const sources: WebSource[] = liveHits.map((h) => ({
            title: h.title,
            uri: h.uri,
          }));
          res.write(`data: ${JSON.stringify({ sources })}\n\n`);
        }
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      }
    } catch (err) {
      const formatted = formatGeminiError(err);
      if (!clientDisconnected) {
        res.write(`data: ${JSON.stringify({ error: formatted.message })}\n\n`);
        res.end();
      }
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GlobalMind AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start GlobalMind AI server:', err);
  process.exit(1);
});
