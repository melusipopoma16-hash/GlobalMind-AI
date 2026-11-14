export type TopicId =
  | 'general'
  | 'education'
  | 'technology'
  | 'business'
  | 'science'
  | 'language'
  | 'creative';

export type MessageRole = 'user' | 'assistant';

export type ThemeMode = 'light' | 'dark';

export type AppView = 'welcome' | 'chat' | 'topics' | 'history' | 'settings';

export interface ChatAttachment {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  base64Data?: string;
  previewUrl?: string;
}

export interface WebSource {
  title: string;
  uri: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
  error?: boolean;
  attachments?: ChatAttachment[];
  sources?: WebSource[];
}

export interface Conversation {
  id: string;
  title: string;
  topicId: TopicId;
  interactionMode?: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
}

export interface InteractionModeOption {
  id: string;
  label: string;
  description: string;
  thinkingDepth: 'fast' | 'balanced';
  promptDirective: string;
}

export interface ModuleQuickTool {
  label: string;
  prefill: string;
}

export interface TopicDefinition {
  id: TopicId;
  title: string;
  shortLabel: string;
  tagline: string;
  description: string;
  systemFocus: string;
  accentClass: string;
  defaultModeId: string;
  interactionModes: InteractionModeOption[];
  quickTools: ModuleQuickTool[];
  starterPrompts: string[];
}

export interface UserPreferences {
  languageCode: string;
  webSearchEnabled: boolean;
  lowDataMode: boolean;
  saveHistory: boolean;
  autoSpeak: boolean;
}
