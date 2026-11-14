import type {
  ChatAttachment,
  ChatMessage,
  Conversation,
  TopicId,
  UserPreferences,
  WebSource,
} from '../types/chat';
import { getTopicById } from '../data/topics';
import { stripAttachmentPayloadsForStorage } from './attachments';

export const STORAGE_KEY = 'globalmind_conversations_v1';
export const THEME_STORAGE_KEY = 'globalmind_theme';
export const PREFS_STORAGE_KEY = 'globalmind_preferences_v1';

export const DEFAULT_PREFERENCES: UserPreferences = {
  languageCode: 'auto',
  webSearchEnabled: true,
  lowDataMode: false,
  saveHistory: true,
  autoSpeak: false,
};

export function createId(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function deriveConversationTitle(text: string, attachments?: ChatAttachment[]): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    if (attachments && attachments.length > 0) {
      return `Analysis: ${attachments[0].name}`.slice(0, 48);
    }
    return 'New conversation';
  }
  if (normalized.length <= 48) return normalized;
  const sliced = normalized.slice(0, 48);
  const lastSpace = sliced.lastIndexOf(' ');
  const clean = lastSpace > 24 ? sliced.slice(0, lastSpace) : sliced;
  return `${clean.trim()}…`;
}

export function createConversation(
  topicId: TopicId = 'general',
  now = Date.now(),
  interactionMode?: string
): Conversation {
  const topic = getTopicById(topicId);
  return {
    id: createId('conv'),
    title: 'New conversation',
    topicId,
    interactionMode: interactionMode ?? topic.defaultModeId,
    messages: [],
    createdAt: now,
    updatedAt: now,
    pinned: false,
  };
}

export function upsertConversation(
  conversations: Conversation[],
  updated: Conversation
): Conversation[] {
  const exists = conversations.some((c) => c.id === updated.id);
  const next = exists
    ? conversations.map((c) => (c.id === updated.id ? updated : c))
    : [updated, ...conversations];
  return [...next].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function appendUserAndPendingAssistant(
  conversation: Conversation,
  userText: string,
  now = Date.now(),
  attachments?: ChatAttachment[]
): { conversation: Conversation; userMessage: ChatMessage; assistantMessage: ChatMessage } {
  const trimmed = userText.trim();
  const userMessage: ChatMessage = {
    id: createId('msg'),
    role: 'user',
    content: trimmed,
    createdAt: now,
    attachments: attachments && attachments.length > 0 ? attachments : undefined,
  };
  const assistantMessage: ChatMessage = {
    id: createId('msg'),
    role: 'assistant',
    content: '',
    createdAt: now + 1,
  };

  const isFirstMessage = conversation.messages.length === 0;
  const title = isFirstMessage ? deriveConversationTitle(trimmed, attachments) : conversation.title;

  return {
    userMessage,
    assistantMessage,
    conversation: {
      ...conversation,
      title,
      messages: [...conversation.messages, userMessage, assistantMessage],
      updatedAt: now,
    },
  };
}

export function updateMessageContent(
  conversation: Conversation,
  messageId: string,
  content: string,
  error = false,
  now = Date.now(),
  sources?: WebSource[]
): Conversation {
  return {
    ...conversation,
    updatedAt: now,
    messages: conversation.messages.map((m) =>
      m.id === messageId
        ? {
            ...m,
            content,
            error,
            sources: sources && sources.length > 0 ? sources : m.sources,
          }
        : m
    ),
  };
}

export function togglePinConversation(
  conversations: Conversation[],
  conversationId: string
): Conversation[] {
  return conversations.map((c) =>
    c.id === conversationId ? { ...c, pinned: !c.pinned } : c
  );
}

export function renameConversation(
  conversations: Conversation[],
  conversationId: string,
  nextTitle: string
): Conversation[] {
  const clean = nextTitle.replace(/\s+/g, ' ').trim();
  if (!clean) return conversations;
  return conversations.map((c) =>
    c.id === conversationId ? { ...c, title: clean.slice(0, 80) } : c
  );
}

export function filterConversations(
  conversations: Conversation[],
  query: string,
  topicFilter: TopicId | 'all' = 'all'
): Conversation[] {
  const q = query.trim().toLowerCase();
  return conversations
    .filter((conv) => {
      if (topicFilter !== 'all' && conv.topicId !== topicFilter) return false;
      if (!q) return true;
      if (conv.title.toLowerCase().includes(q)) return true;
      return conv.messages.some((m) => m.content.toLowerCase().includes(q));
    })
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export interface ConversationGroup {
  label: string;
  items: Conversation[];
}

export function groupConversationsByRecency(
  conversations: Conversation[],
  nowMs = Date.now()
): ConversationGroup[] {
  const pinned: Conversation[] = [];
  const unpinned: Conversation[] = [];
  for (const conv of conversations) {
    if (conv.pinned) {
      pinned.push(conv);
    } else {
      unpinned.push(conv);
    }
  }

  const startOfToday = new Date(nowMs);
  startOfToday.setHours(0, 0, 0, 0);
  const todayMs = startOfToday.getTime();
  const yesterdayMs = todayMs - 24 * 60 * 60 * 1000;
  const lastWeekMs = todayMs - 7 * 24 * 60 * 60 * 1000;

  const buckets: Record<string, Conversation[]> = {
    Pinned: [...pinned].sort((a, b) => b.updatedAt - a.updatedAt),
    Today: [],
    Yesterday: [],
    'Previous 7 days': [],
    Earlier: [],
  };

  const sorted = [...unpinned].sort((a, b) => b.updatedAt - a.updatedAt);
  for (const conv of sorted) {
    if (conv.updatedAt >= todayMs) {
      buckets['Today'].push(conv);
    } else if (conv.updatedAt >= yesterdayMs) {
      buckets['Yesterday'].push(conv);
    } else if (conv.updatedAt >= lastWeekMs) {
      buckets['Previous 7 days'].push(conv);
    } else {
      buckets['Earlier'].push(conv);
    }
  }

  return Object.entries(buckets)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }));
}

export function formatRelativeTime(timestampMs: number, nowMs = Date.now()): string {
  const diffSeconds = Math.max(0, Math.floor((nowMs - timestampMs) / 1000));
  if (diffSeconds < 60) return 'Just now';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(timestampMs).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function deduplicateSources(sources: WebSource[]): WebSource[] {
  const seen = new Set<string>();
  const result: WebSource[] = [];
  for (const src of sources) {
    if (!src || typeof src.uri !== 'string') continue;
    const uri = src.uri.trim();
    if (!/^https?:\/\//i.test(uri) || seen.has(uri)) continue;
    seen.add(uri);
    const title = (src.title || '').trim() || formatDomainFromUrl(uri);
    result.push({ title, uri });
  }
  return result;
}

export function formatDomainFromUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return rawUrl;
  }
}

export function stripMarkdownForSpeech(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' Code snippet omitted. ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/(\*\*|__|\*|_)/g, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\|/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function formatConversationAsMarkdown(conv: Conversation): string {
  const lines: string[] = [
    `# ${conv.title}`,
    `Topic: ${conv.topicId} | Updated: ${new Date(conv.updatedAt).toISOString()}`,
    '',
  ];
  for (const msg of conv.messages) {
    lines.push(msg.role === 'user' ? '## User' : '## GlobalMind AI');
    if (msg.attachments && msg.attachments.length > 0) {
      lines.push(
        `Attachments: ${msg.attachments.map((a) => `${a.name} (${a.mimeType})`).join(', ')}`
      );
    }
    lines.push(msg.content);
    if (msg.sources && msg.sources.length > 0) {
      lines.push('');
      lines.push('Sources:');
      for (const s of msg.sources) {
        lines.push(`- [${s.title}](${s.uri})`);
      }
    }
    lines.push('');
  }
  return lines.join('\n');
}

export interface SseEventPayload {
  text?: string;
  sources?: WebSource[];
  error?: string;
  done?: boolean;
}

export function parseSseChunk(
  pendingBuffer: string,
  incomingText: string
): { events: SseEventPayload[]; remainder: string } {
  const combined = pendingBuffer + incomingText;
  const normalized = combined.replace(/\r\n/g, '\n');
  const frames = normalized.split('\n\n');
  const remainder = frames.pop() ?? '';
  const events: SseEventPayload[] = [];

  for (const frame of frames) {
    const lines = frame.split('\n');
    const dataLines: string[] = [];
    for (const line of lines) {
      if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trimStart());
      }
    }
    if (dataLines.length === 0) continue;
    const rawJson = dataLines.join('\n');
    try {
      const parsed = JSON.parse(rawJson) as SseEventPayload;
      events.push(parsed);
    } catch {
      // Skip malformed partial frame
    }
  }

  return { events, remainder };
}

export function serializeConversationsForStorage(conversations: Conversation[]): string {
  const sanitized = conversations
    .filter((c) => c.messages.length > 0)
    .map((conv) => ({
      ...conv,
      messages: conv.messages.map((m) => ({
        ...m,
        attachments: stripAttachmentPayloadsForStorage(m.attachments),
      })),
    }));
  return JSON.stringify(sanitized);
}

export function calculateStorageBytes(conversations: Conversation[]): number {
  const json = serializeConversationsForStorage(conversations);
  return new TextEncoder().encode(json).length;
}

export function loadStoredConversations(storage?: Pick<Storage, 'getItem'>): Conversation[] {
  try {
    const store = storage ?? (typeof localStorage !== 'undefined' ? localStorage : undefined);
    if (!store) return [];
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is Conversation =>
        Boolean(item) &&
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        typeof item.topicId === 'string' &&
        Array.isArray(item.messages)
    );
  } catch {
    return [];
  }
}

export function saveStoredConversations(
  conversations: Conversation[],
  storage?: Pick<Storage, 'setItem'>
): void {
  try {
    const store = storage ?? (typeof localStorage !== 'undefined' ? localStorage : undefined);
    if (!store) return;
    store.setItem(STORAGE_KEY, serializeConversationsForStorage(conversations));
  } catch {
    // Ignore quota or storage restriction errors gracefully
  }
}

export function clearStoredConversations(storage?: Pick<Storage, 'removeItem'>): void {
  try {
    const store = storage ?? (typeof localStorage !== 'undefined' ? localStorage : undefined);
    store?.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

export function loadPreferences(storage?: Pick<Storage, 'getItem'>): UserPreferences {
  try {
    const store = storage ?? (typeof localStorage !== 'undefined' ? localStorage : undefined);
    if (!store) return DEFAULT_PREFERENCES;
    const raw = store.getItem(PREFS_STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<UserPreferences>;
    return {
      languageCode:
        typeof parsed.languageCode === 'string'
          ? parsed.languageCode
          : DEFAULT_PREFERENCES.languageCode,
      webSearchEnabled:
        typeof parsed.webSearchEnabled === 'boolean'
          ? parsed.webSearchEnabled
          : DEFAULT_PREFERENCES.webSearchEnabled,
      lowDataMode:
        typeof parsed.lowDataMode === 'boolean'
          ? parsed.lowDataMode
          : DEFAULT_PREFERENCES.lowDataMode,
      saveHistory:
        typeof parsed.saveHistory === 'boolean'
          ? parsed.saveHistory
          : DEFAULT_PREFERENCES.saveHistory,
      autoSpeak:
        typeof parsed.autoSpeak === 'boolean'
          ? parsed.autoSpeak
          : DEFAULT_PREFERENCES.autoSpeak,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(
  prefs: UserPreferences,
  storage?: Pick<Storage, 'setItem'>
): void {
  try {
    const store = storage ?? (typeof localStorage !== 'undefined' ? localStorage : undefined);
    store?.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore
  }
}
