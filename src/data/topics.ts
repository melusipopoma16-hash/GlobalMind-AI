import type { InteractionModeOption, TopicDefinition, TopicId } from '../types/chat';

export const TOPICS: TopicDefinition[] = [
  {
    id: 'general',
    title: 'General Assistant',
    shortLabel: 'General',
    tagline: 'Everyday questions, planning & global knowledge',
    description:
      'Clear, accurate answers for daily questions, travel planning, comparisons, and everyday life.',
    systemFocus:
      'Provide clear, well-structured, accurate answers across any topic. Adapt tone and depth to the user, and offer practical next steps when helpful.',
    accentClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/70',
    defaultModeId: 'balanced',
    interactionModes: [
      {
        id: 'balanced',
        label: 'Balanced',
        description: 'Clear summary plus practical next steps.',
        thinkingDepth: 'fast',
        promptDirective: 'Give a well-balanced, clear answer with key takeaways.',
      },
      {
        id: 'concise',
        label: 'Quick Brief',
        description: 'Short bulleted answer for rapid reading.',
        thinkingDepth: 'fast',
        promptDirective: 'Keep the answer brief and scannable using concise bullet points.',
      },
      {
        id: 'detailed',
        label: 'Deep Guide',
        description: 'Thorough breakdown with examples and caveats.',
        thinkingDepth: 'balanced',
        promptDirective: 'Provide a thorough, structured guide covering nuances, trade-offs, and concrete examples.',
      },
    ],
    quickTools: [
      { label: 'Compare options', prefill: 'Compare the pros, cons, and costs of: ' },
      { label: 'Plan a schedule', prefill: 'Create a practical day-by-day plan for: ' },
      { label: 'Summarize clearly', prefill: 'Summarize the key facts about: ' },
    ],
    starterPrompts: [
      'Plan a realistic 5-day budget itinerary for Kyoto in spring.',
      'Compare electric and hybrid vehicles for city commuting.',
      'Summarize the major turning points of the Renaissance.',
    ],
  },
  {
    id: 'education',
    title: 'Homework Help',
    shortLabel: 'Homework Help',
    tagline: 'Step-by-step tutoring, essays & exam prep',
    description:
      'Patient academic tutoring across math, science, history, and essays—designed to help you truly learn.',
    systemFocus:
      'Act as an encouraging, clear academic tutor. Break down concepts logically, verify calculations carefully, and explain why each step works.',
    accentClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/70',
    defaultModeId: 'worked',
    interactionModes: [
      {
        id: 'worked',
        label: 'Step-by-Step Solution',
        description: 'Full breakdown showing every intermediate step.',
        thinkingDepth: 'balanced',
        promptDirective:
          'Show a complete step-by-step worked explanation, numbering each step clearly and verifying the final result.',
      },
      {
        id: 'socratic',
        label: 'Guided Hint',
        description: 'Teaches with hints and a check-in question first.',
        thinkingDepth: 'balanced',
        promptDirective:
          'Use Socratic tutoring: explain the core concept, give a helpful first-step hint without spoiling the entire answer immediately, and ask the student a guiding question to check understanding.',
      },
      {
        id: 'quiz',
        label: 'Practice Quiz',
        description: 'Creates 3 progressive practice questions.',
        thinkingDepth: 'fast',
        promptDirective:
          'Generate 3 progressive practice questions (easy, medium, challenge) on the requested topic and wait for the learner to answer before revealing solutions.',
      },
    ],
    quickTools: [
      { label: 'Solve math step-by-step', prefill: 'Solve this problem step by step and explain each rule: ' },
      { label: 'Outline an essay', prefill: 'Help me build a strong thesis and 5-paragraph outline for: ' },
      { label: 'Create flashcards', prefill: 'Create 6 concise study flashcards (question & answer) for: ' },
    ],
    starterPrompts: [
      'Walk me through solving quadratic equations by completing the square.',
      'Help me structure an analytical essay on climate policy.',
      'Explain supply and demand elasticity with everyday examples.',
    ],
  },
  {
    id: 'business',
    title: 'Business Ideas',
    shortLabel: 'Business Ideas',
    tagline: 'Startup validation, pricing & lean strategy',
    description:
      'Pragmatic entrepreneurship support for idea validation, Lean Canvas planning, unit economics, and pitches.',
    systemFocus:
      'Act as a pragmatic startup advisor and business strategist. Ground advice in real customer demand, unit economics, risks, and low-cost validation.',
    accentClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/70',
    defaultModeId: 'validate',
    interactionModes: [
      {
        id: 'validate',
        label: 'Idea Validator',
        description: 'Tests demand, risks, and $0 week-one experiments.',
        thinkingDepth: 'balanced',
        promptDirective:
          'Evaluate the business idea candidly: identify the target customer, biggest risk assumption, realistic startup costs, and a concrete week-1 validation experiment under $100.',
      },
      {
        id: 'lean',
        label: 'Lean Canvas',
        description: 'Structured table of problem, model & pricing.',
        thinkingDepth: 'balanced',
        promptDirective:
          'Present a concise Lean Canvas as a structured Markdown table covering Problem, Customer Segments, Unique Value Proposition, Channels, Revenue Model, and Key Metrics.',
      },
      {
        id: 'pitch',
        label: 'Pitch & Marketing',
        description: 'Sharp elevator pitch and go-to-market copy.',
        thinkingDepth: 'fast',
        promptDirective:
          'Craft a crisp 30-second elevator pitch, 3 value-proposition headlines, and actionable local or online customer acquisition channels.',
      },
    ],
    quickTools: [
      { label: 'Validate an idea', prefill: 'Evaluate and stress-test this business idea: ' },
      { label: 'Calculate unit economics', prefill: 'Break down startup costs, pricing, and break-even math for: ' },
      { label: 'Draft launch plan', prefill: 'Create a 14-day low-budget launch plan for: ' },
    ],
    starterPrompts: [
      'How can I validate a local meal-prep delivery business with under $500?',
      'Help me create a simple pricing tier structure for a B2B SaaS tool.',
      'Outline a crisp 6-slide pitch deck for an agricultural supply platform.',
    ],
  },
  {
    id: 'language',
    title: 'Language Learning',
    shortLabel: 'Language Learning',
    tagline: 'Translations, grammar coaching & dialogues',
    description:
      'Natural translations, cultural register notes, grammar breakdowns, and interactive conversation practice.',
    systemFocus:
      'Act as a warm, precise multilingual language coach and editor. Preserve nuance, explain grammar briefly, and provide natural phrasing alternatives.',
    accentClass: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800/70',
    defaultModeId: 'translate',
    interactionModes: [
      {
        id: 'translate',
        label: 'Nuanced Translate',
        description: 'Natural translation + formal/casual alternatives.',
        thinkingDepth: 'fast',
        promptDirective:
          'Translate accurately while preserving tone. Provide both a natural everyday version and a polite/formal version, plus brief notes on key idioms or register.',
      },
      {
        id: 'tutor',
        label: 'Conversation Practice',
        description: 'Interactive roleplay with gentle corrections.',
        thinkingDepth: 'fast',
        promptDirective:
          'Conduct an interactive dialogue in the target language at the learner’s level. Gently correct any mistakes in a brief note, then continue the conversation with a natural follow-up question.',
      },
      {
        id: 'grammar',
        label: 'Grammar & Pronunciation',
        description: 'Breaks down rules, tense & phonetic tips.',
        thinkingDepth: 'balanced',
        promptDirective:
          'Explain the grammar rule or sentence correction clearly with side-by-side examples and simple phonetic pronunciation tips.',
      },
    ],
    quickTools: [
      { label: 'Correct my writing', prefill: 'Correct my grammar and make this sound natural (explain changes): ' },
      { label: 'Start a roleplay', prefill: 'Let’s practice a 5-turn beginner/intermediate dialogue in [language] at a: ' },
      { label: 'Translate with context', prefill: 'Translate into [language] with formal and casual options: ' },
    ],
    starterPrompts: [
      'Translate this email to polite professional Spanish and explain key phrases.',
      'Start a short French café ordering dialogue with me and correct my replies.',
      'Teach me 10 essential Swahili travel phrases with pronunciation tips.',
    ],
  },
  {
    id: 'creative',
    title: 'Creative Thinking',
    shortLabel: 'Creative Thinking',
    tagline: 'Brainstorming, storytelling & problem frameworks',
    description:
      'Unlock fresh ideas for stories, projects, design challenges, and complex life or work decisions.',
    systemFocus:
      'Act as an imaginative creative strategist and lateral thinker. Offer distinct, non-obvious angles and practical creative frameworks.',
    accentClass: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/70',
    defaultModeId: 'brainstorm',
    interactionModes: [
      {
        id: 'brainstorm',
        label: '10x Brainstorm',
        description: 'Diverse angles from practical to bold.',
        thinkingDepth: 'balanced',
        promptDirective:
          'Generate distinct, original ideas grouped from grounded/practical to bold/unconventional so the user has real variety.',
      },
      {
        id: 'story',
        label: 'Story & Craft',
        description: 'Characters, worldbuilding, hooks & tone.',
        thinkingDepth: 'balanced',
        promptDirective:
          'Focus on vivid storytelling craft: strong hooks, character motivation, sensory detail, and narrative tension.',
      },
      {
        id: 'matrix',
        label: 'Decision Framework',
        description: 'First Principles, SCAMPER & weighted trade-offs.',
        thinkingDepth: 'balanced',
        promptDirective:
          'Apply structured problem-solving frameworks (such as weighted decision matrices, First Principles, or SCAMPER) to help clarify choices objectively.',
      },
    ],
    quickTools: [
      { label: 'SCAMPER reframe', prefill: 'Apply the SCAMPER creativity method to improve: ' },
      { label: 'Build a decision matrix', prefill: 'Help me compare these options using weighted criteria: ' },
      { label: 'Story hook generator', prefill: 'Generate 5 compelling opening hooks and twists for a story about: ' },
    ],
    starterPrompts: [
      'Give me 5 unexpected sci-fi short story premises set aboard an orbital farm.',
      'Help me use a decision matrix to choose between two job offers.',
      'Design a 45-minute team brainstorming exercise for remote colleagues.',
    ],
  },
  {
    id: 'technology',
    title: 'Tech Support',
    shortLabel: 'Tech Support',
    tagline: 'Android, computer fixes, Wi-Fi & coding',
    description:
      'Step-by-step troubleshooting for Android phones, Windows/macOS, networking, and programming.',
    systemFocus:
      'Act as a calm, practical technology and software specialist. Order troubleshooting steps from safest/simplest to advanced, and provide clean commented code.',
    accentClass: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/70',
    defaultModeId: 'troubleshoot',
    interactionModes: [
      {
        id: 'troubleshoot',
        label: 'Troubleshooter',
        description: 'Safe step-by-step diagnostics from simplest fix up.',
        thinkingDepth: 'balanced',
        promptDirective:
          'Provide numbered troubleshooting steps ordered from fastest/safest check to advanced fix, warning clearly before any destructive action like resetting data.',
      },
      {
        id: 'code',
        label: 'Code & Debug',
        description: 'Clean commented code & root-cause analysis.',
        thinkingDepth: 'balanced',
        promptDirective:
          'Provide clean, idiomatic, well-commented code inside fenced code blocks and explain the root cause or key logic clearly.',
      },
      {
        id: 'explain',
        label: 'Plain-English Tech',
        description: 'Jargon-free explanation of tech concepts.',
        thinkingDepth: 'fast',
        promptDirective:
          'Explain the technical concept in plain everyday language with a concrete real-world analogy.',
      },
    ],
    quickTools: [
      { label: 'Fix an Android issue', prefill: 'Help me troubleshoot this Android phone issue safely: ' },
      { label: 'Debug code error', prefill: 'Find the bug and fix this code snippet: ' },
      { label: 'Compare hardware/apps', prefill: 'Recommend reliable budget options for: ' },
    ],
    starterPrompts: [
      'My Android phone storage is almost full—what can I safely clean up?',
      'Write a Python script that renames and organizes downloaded files by date.',
      'Why is my home Wi-Fi fast near the router but dropping in the bedroom?',
    ],
  },
  {
    id: 'science',
    title: 'Science & World',
    shortLabel: 'Science & World',
    tagline: 'Physics, biology, climate & world geography',
    description:
      'Accurate explanations of natural phenomena, space, health science, earth systems, and geography.',
    systemFocus:
      'Act as a rigorous science and geography communicator. Combine intuitive analogies with accurate scientific terminology and real-world scale.',
    accentClass: 'bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800/70',
    defaultModeId: 'concept',
    interactionModes: [
      {
        id: 'concept',
        label: 'Intuitive Explainer',
        description: 'Clear science paired with everyday analogies.',
        thinkingDepth: 'fast',
        promptDirective:
          'Explain the scientific or geographic mechanism clearly using an intuitive everyday analogy alongside accurate terminology.',
      },
      {
        id: 'deep',
        label: 'Scientific Deep Dive',
        description: 'Detailed processes, laws & empirical context.',
        thinkingDepth: 'balanced',
        promptDirective:
          'Provide a rigorous, structured scientific breakdown including physical/biological mechanisms, key principles, and real-world evidence.',
      },
      {
        id: 'facts',
        label: 'World Atlas & Facts',
        description: 'Structured geographic & factual overview.',
        thinkingDepth: 'fast',
        promptDirective:
          'Present key geographic, environmental, or factual data in clean bullet points or a comparison table.',
      },
    ],
    quickTools: [
      { label: 'Explain how it works', prefill: 'Explain the science behind how this works: ' },
      { label: 'Compare regions/ecosystems', prefill: 'Compare the climate, geography, and ecology of: ' },
      { label: 'Myth vs science check', prefill: 'Fact-check this common claim using scientific evidence: ' },
    ],
    starterPrompts: [
      'How do ocean currents regulate Europe’s winter temperatures?',
      'Explain CRISPR gene editing in plain language without losing accuracy.',
      'Why do tectonic plates move and how are mountain ranges formed?',
    ],
  },
];

export function getTopicById(id: TopicId): TopicDefinition {
  return TOPICS.find((t) => t.id === id) ?? TOPICS[0];
}

export function getInteractionMode(
  topicId: TopicId,
  modeId?: string
): InteractionModeOption {
  const topic = getTopicById(topicId);
  return (
    topic.interactionModes.find((m) => m.id === modeId) ??
    topic.interactionModes.find((m) => m.id === topic.defaultModeId) ??
    topic.interactionModes[0]
  );
}
