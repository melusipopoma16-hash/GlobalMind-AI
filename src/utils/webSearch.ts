export function stripHtmlTags(input: string): string {
  return input
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

const TRIVIAL_GREETINGS = new Set([
  'hi',
  'hello',
  'hey',
  'thanks',
  'thank you',
  'ok',
  'okay',
  'yes',
  'no',
  'bye',
]);

export function shouldPerformWebSearch(
  userQuery: string,
  webSearchEnabled: boolean,
  hasAttachments: boolean,
  topicId?: string,
  interactionMode?: string
): boolean {
  if (!webSearchEnabled || hasAttachments) return false;
  const normalized = userQuery.trim().toLowerCase().replace(/[.!?]+$/, '');
  if (!normalized || normalized.length < 3) return false;
  if (TRIVIAL_GREETINGS.has(normalized)) return false;

  if (topicId === 'creative' || topicId === 'language' || interactionMode === 'quiz') {
    return false;
  }

  // Skip pure math / algebraic equation prompts where encyclopedic search adds irrelevant links
  const hasMathExpression =
    /[=+\-*/^]\s*\d|\d[a-z]\s*[+\-=]/i.test(userQuery) ||
    (/\b(solve|equation|algebra|calculus|quadratic|derivative|integral|factor)\b/i.test(userQuery) &&
      /\d/.test(userQuery));
  if (hasMathExpression) {
    return false;
  }

  // Skip creative ideation / brainstorming prompts unless explicitly asking a factual question
  const isFactualQuestion = /^(who|what|when|where|which|how many|how much|how tall|how far|why is|is there)\b/i.test(
    normalized
  );
  if (
    !isFactualQuestion &&
    /\b(ideas?|brainstorm|playlist|poem|story|slogan|tagline|draft|rewrite)\b/i.test(normalized)
  ) {
    return false;
  }

  return true;
}

export function buildSearchQuery(userQuery: string): string {
  return userQuery
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[^\p{L}\p{N}\s'-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

const SEARCH_STOPWORDS = new Set([
  'what',
  'when',
  'where',
  'which',
  'while',
  'with',
  'from',
  'this',
  'that',
  'these',
  'those',
  'about',
  'explain',
  'compare',
  'guide',
  'step',
  'help',
  'give',
  'make',
  'create',
  'write',
  'tell',
  'could',
  'would',
  'should',
  'your',
  'their',
  'short',
  'ideas',
  'idea',
  'list',
  'best',
  'good',
  'nice',
  'ways',
  'tips',
  'steps',
  'example',
  'examples',
  'theme',
  'themes',
  'please',
  'something',
  'someone',
  'things',
  'thing',
  'using',
  'based',
  'plan',
  'draft',
  'review',
  'brainstorm',
]);

export function filterRelevantSearchHits<T extends { title: string; snippet: string }>(
  queryText: string,
  hits: T[]
): T[] {
  const keywords = Array.from(
    new Set(
      buildSearchQuery(queryText)
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length >= 4 && !SEARCH_STOPWORDS.has(word))
    )
  );

  if (keywords.length === 0) return [];

  const minMatches = keywords.length >= 2 ? 2 : 1;

  return hits.filter((hit) => {
    const titleLower = hit.title.toLowerCase();
    const haystack = `${titleLower} ${hit.snippet.toLowerCase()}`;
    const matchCount = keywords.filter((kw) => haystack.includes(kw)).length;
    const titleMatches = keywords.some((kw) => titleLower.includes(kw));
    return matchCount >= minMatches || (titleMatches && matchCount >= 1);
  });
}
