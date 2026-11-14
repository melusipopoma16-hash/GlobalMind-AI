import test from 'node:test';
import assert from 'node:assert/strict';
import { getInteractionMode, getTopicById, TOPICS } from './topics';

test('every channel defines interactionModes, quickTools, and starterPrompts', () => {
  assert.ok(TOPICS.length >= 7);
  for (const topic of TOPICS) {
    assert.ok(topic.interactionModes.length >= 3, `${topic.id} needs >= 3 interaction modes`);
    assert.ok(topic.quickTools.length >= 3, `${topic.id} needs >= 3 quick tools`);
    assert.ok(topic.starterPrompts.length >= 3, `${topic.id} needs >= 3 starter prompts`);
    const def = getInteractionMode(topic.id, topic.defaultModeId);
    assert.equal(def.id, topic.defaultModeId);
  }
});

test('getInteractionMode falls back safely to channel default on unknown mode', () => {
  const edu = getTopicById('education');
  const fallback = getInteractionMode('education', 'non_existent_mode');
  assert.equal(fallback.id, edu.defaultModeId);
  const socratic = getInteractionMode('education', 'socratic');
  assert.equal(socratic.label, 'Guided Hint');
});
