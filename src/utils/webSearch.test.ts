import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSearchQuery,
  filterRelevantSearchHits,
  shouldPerformWebSearch,
  stripHtmlTags,
} from './webSearch';

test('stripHtmlTags removes search highlight tags and decodes entities', () => {
  assert.equal(
    stripHtmlTags('The <span class="searchmatch">Everest</span> &amp; &quot;K2&quot;'),
    'The Everest & "K2"'
  );
});

test('shouldPerformWebSearch skips trivial greetings, attachments, math, creative, and language channels', () => {
  assert.equal(shouldPerformWebSearch('hello', true, false), false);
  assert.equal(shouldPerformWebSearch('What is Mount Everest elevation?', true, false), true);
  assert.equal(shouldPerformWebSearch('What is Mount Everest elevation?', false, false), false);
  assert.equal(shouldPerformWebSearch('What is in this photo?', true, true), false);
  assert.equal(shouldPerformWebSearch('Guide me step-by-step on solving 2x + 6 = 14', true, false, 'education', 'socratic'), false);
  assert.equal(shouldPerformWebSearch('Write a short poem about rain', true, false, 'creative', 'story'), false);
  assert.equal(shouldPerformWebSearch('Translate good morning to Spanish', true, false, 'language', 'translate'), false);
  assert.equal(shouldPerformWebSearch('Quiz me on photosynthesis', true, false, 'education', 'quiz'), false);
});

test('buildSearchQuery strips URLs and punctuation cleanly', () => {
  assert.equal(
    buildSearchQuery('Who won the 2024 Olympics 100m? https://example.com'),
    'Who won the 2024 Olympics 100m'
  );
});

test('filterRelevantSearchHits keeps matching articles and drops unrelated ones', () => {
  const hits = [
    { title: 'Mount Everest', snippet: 'Highest mountain on Earth at 8848m.' },
    { title: 'Peter Thiel', snippet: 'American entrepreneur.' },
  ];
  const filtered = filterRelevantSearchHits('What is Mount Everest elevation?', hits);
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].title, 'Mount Everest');
});
