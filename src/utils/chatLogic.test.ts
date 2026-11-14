import test from 'node:test';
import assert from 'node:assert/strict';
import {
  appendUserAndPendingAssistant,
  createConversation,
  deduplicateSources,
  deriveConversationTitle,
  filterConversations,
  formatConversationAsMarkdown,
  groupConversationsByRecency,
  parseSseChunk,
  renameConversation,
  serializeConversationsForStorage,
  stripMarkdownForSpeech,
  togglePinConversation,
  updateMessageContent,
  upsertConversation,
} from './chatLogic';

test('deriveConversationTitle truncates cleanly at word boundary and falls back to attachment name', () => {
  assert.equal(deriveConversationTitle('  Hello   world  '), 'Hello world');
  const long =
    'How can I build a resilient offline-capable Android app for rural teachers?';
  const title = deriveConversationTitle(long);
  assert.ok(title.length <= 49);
  assert.ok(title.endsWith('…'));

  const attachmentTitle = deriveConversationTitle('', [
    { id: 'a1', name: 'physics-lab.pdf', mimeType: 'application/pdf', sizeBytes: 1024 },
  ]);
  assert.equal(attachmentTitle, 'Analysis: physics-lab.pdf');
});

test('appendUserAndPendingAssistant sets first-message title and preserves order', () => {
  const conv = createConversation('education', 1000);
  const { conversation, assistantMessage } = appendUserAndPendingAssistant(
    conv,
    'Explain Newton second law clearly',
    2000
  );
  assert.equal(conversation.title, 'Explain Newton second law clearly');
  assert.equal(conversation.messages.length, 2);
  assert.equal(conversation.messages[0].role, 'user');
  assert.equal(conversation.messages[1].id, assistantMessage.id);

  const updated = updateMessageContent(
    conversation,
    assistantMessage.id,
    'Force equals mass times acceleration.',
    false,
    3000,
    [{ title: 'NASA', uri: 'https://www.nasa.gov' }]
  );
  assert.equal(updated.messages[1].content, 'Force equals mass times acceleration.');
  assert.equal(updated.messages[1].sources?.[0].uri, 'https://www.nasa.gov');
});

test('filterConversations searches titles, content, and topics', () => {
  const c1 = {
    ...createConversation('technology', 1000),
    id: 'c1',
    title: 'Android storage cleanup',
    updatedAt: 5000,
    messages: [{ id: 'm1', role: 'user' as const, content: 'clear cache', createdAt: 1000 }],
  };
  const c2 = {
    ...createConversation('business', 2000),
    id: 'c2',
    title: 'Coffee cart launch',
    updatedAt: 4000,
    messages: [{ id: 'm2', role: 'user' as const, content: 'unit economics', createdAt: 2000 }],
  };
  const all = upsertConversation([c2], c1);
  assert.equal(filterConversations(all, 'unit').length, 1);
  assert.equal(filterConversations(all, 'unit')[0].id, 'c2');
  assert.equal(filterConversations(all, '', 'technology').length, 1);
});

test('groupConversationsByRecency places pinned chats first and groups unpinned by date', () => {
  const now = new Date(2026, 10, 14, 15, 0, 0).getTime();
  const today = { ...createConversation('general', now - 1000), id: 't1', updatedAt: now - 1000 };
  const yesterday = {
    ...createConversation('general', now - 24 * 60 * 60 * 1000),
    id: 'y1',
    updatedAt: now - 24 * 60 * 60 * 1000,
  };
  const pinnedOlder = {
    ...createConversation('general', now - 12 * 24 * 60 * 60 * 1000),
    id: 'p1',
    updatedAt: now - 12 * 24 * 60 * 60 * 1000,
    pinned: true,
  };
  const groups = groupConversationsByRecency([pinnedOlder, yesterday, today], now);
  assert.deepEqual(
    groups.map((g) => g.label),
    ['Pinned', 'Today', 'Yesterday']
  );
});

test('togglePinConversation and renameConversation update target conversation cleanly', () => {
  const c1 = { ...createConversation('general', 1000), id: 'c1', title: 'Old title' };
  const pinned = togglePinConversation([c1], 'c1');
  assert.equal(pinned[0].pinned, true);
  const renamed = renameConversation(pinned, 'c1', '  Updated   title  ');
  assert.equal(renamed[0].title, 'Updated title');
});

test('deduplicateSources filters unsafe URIs and deduplicates by URL', () => {
  const deduped = deduplicateSources([
    { title: 'Wikipedia', uri: 'https://en.wikipedia.org/wiki/Solar_power' },
    { title: 'Duplicate', uri: 'https://en.wikipedia.org/wiki/Solar_power' },
    { title: 'Bad', uri: 'javascript:alert(1)' },
    { title: '', uri: 'https://www.bbc.com/news' },
  ]);
  assert.equal(deduped.length, 2);
  assert.equal(deduped[0].title, 'Wikipedia');
  assert.equal(deduped[1].title, 'bbc.com');
});

test('stripMarkdownForSpeech removes markdown syntax and code fences cleanly', () => {
  const spoken = stripMarkdownForSpeech(
    '# Heading\nUse **Newton** law with [wiki](https://en.wikipedia.org).\n```js\nconsole.log(1)\n```'
  );
  assert.equal(spoken.includes('**'), false);
  assert.equal(spoken.includes('console.log'), false);
  assert.ok(spoken.includes('Heading'));
  assert.ok(spoken.includes('Newton'));
  assert.ok(spoken.includes('wiki'));
});

test('serializeConversationsForStorage strips raw attachment base64 payloads', () => {
  const conv = {
    ...createConversation('education', 1000),
    id: 'c1',
    messages: [
      {
        id: 'm1',
        role: 'user' as const,
        content: 'Check this',
        createdAt: 1000,
        attachments: [
          {
            id: 'a1',
            name: 'hw.jpg',
            mimeType: 'image/jpeg',
            sizeBytes: 25000,
            base64Data: 'SUPER_LONG_BASE64',
            previewUrl: 'data:image/jpeg;base64,SUPER_LONG_BASE64',
          },
        ],
      },
    ],
  };
  const json = serializeConversationsForStorage([conv]);
  assert.equal(json.includes('SUPER_LONG_BASE64'), false);
  assert.ok(json.includes('hw.jpg'));
});

test('formatConversationAsMarkdown includes title, messages, and sources', () => {
  const conv = {
    ...createConversation('science', 1000),
    title: 'Ocean Currents',
    messages: [
      { id: 'm1', role: 'user' as const, content: 'How do currents work?', createdAt: 1000 },
      {
        id: 'm2',
        role: 'assistant' as const,
        content: 'Driven by wind and density.',
        createdAt: 1001,
        sources: [{ title: 'NOAA', uri: 'https://noaa.gov' }],
      },
    ],
  };
  const md = formatConversationAsMarkdown(conv);
  assert.ok(md.includes('# Ocean Currents'));
  assert.ok(md.includes('[NOAA](https://noaa.gov)'));
});

test('parseSseChunk handles split frames and sources payloads', () => {
  const part1 = 'data: {"text":"Hello "}\n\ndata: {"sources":[{"title":"N';
  const part2 = 'ASA","uri":"https://nasa.gov"}]}\n\ndata: {"done":true}\n\n';
  const r1 = parseSseChunk('', part1);
  assert.equal(r1.events.length, 1);
  const r2 = parseSseChunk(r1.remainder, part2);
  assert.equal(r2.events.length, 2);
  assert.equal(r2.events[0].sources?.[0].title, 'NASA');
  assert.equal(r2.events[1].done, true);
});
