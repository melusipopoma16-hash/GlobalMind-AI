import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import {
  AlertCircle,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  FileText,
  Globe,
  Mic,
  MicOff,
  Plus,
  RotateCcw,
  Send,
  ShieldAlert,
  Square,
  Volume2,
  VolumeX,
  WifiOff,
  Wrench,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { getLanguageByCode, LANGUAGES } from '../data/languages';
import { getInteractionMode, getTopicById, TOPICS } from '../data/topics';
import type { ChatAttachment, Conversation, TopicId, UserPreferences } from '../types/chat';
import { formatFileSize, prepareAttachment, validateAttachmentFile } from '../utils/attachments';
import { createId, formatDomainFromUrl, stripMarkdownForSpeech } from '../utils/chatLogic';
import {
  createSpeechRecognition,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  speakText,
  stopSpeaking,
  type SpeechRecognitionLike,
} from '../utils/speech';
import { BrandSparkle, GlobalMindOrb } from './BrandMark';
import { MarkdownRenderer } from './MarkdownRenderer';
import { TopicIcon } from './TopicIcon';

interface ChatViewProps {
  conversation: Conversation;
  isStreaming: boolean;
  isOnline: boolean;
  preferences: UserPreferences;
  onUpdatePreferences: (patch: Partial<UserPreferences>) => void;
  onChangeTopic: (topicId: TopicId) => void;
  onChangeInteractionMode: (modeId: string) => void;
  onSendMessage: (text: string, attachments?: ChatAttachment[]) => void;
  onStopStreaming: () => void;
  onRegenerate: () => void;
}

export function ChatView({
  conversation,
  isStreaming,
  isOnline,
  preferences,
  onUpdatePreferences,
  onChangeTopic,
  onChangeInteractionMode,
  onSendMessage,
  onStopStreaming,
  onRegenerate,
}: ChatViewProps) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [toolsOpen, setToolsOpen] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const preSpeechInputRef = useRef('');

  const activeTopic = getTopicById(conversation.topicId);
  const activeMode = getInteractionMode(conversation.topicId, conversation.interactionMode);
  const speechInputSupported = isSpeechRecognitionSupported();
  const speechOutputSupported = isSpeechSynthesisSupported();

  useEffect(() => {
    if (conversation.messages.length === 0) {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
      return;
    }
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [conversation.id, conversation.messages, isStreaming]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 144)}px`;
  }, [input]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      stopSpeaking();
    };
  }, []);

  const handleApplyQuickTool = (prefill: string) => {
    setInput(prefill);
    setToolsOpen(false);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(prefill.length, prefill.length);
      }
    });
  };

  const handleSubmit = () => {
    const trimmed = input.trim();
    if ((!trimmed && attachments.length === 0) || isStreaming) return;
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
    const outgoingAttachments = [...attachments];
    setInput('');
    setAttachments([]);
    setAttachmentError(null);
    onSendMessage(trimmed, outgoingAttachments);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;
    setAttachmentError(null);

    let currentCount = attachments.length;
    const prepared: ChatAttachment[] = [];

    for (const file of files) {
      const check = validateAttachmentFile(file, currentCount);
      if (!check.valid) {
        setAttachmentError(check.reason);
        break;
      }
      try {
        const item = await prepareAttachment(file, preferences.lowDataMode, createId('att'));
        prepared.push(item);
        currentCount += 1;
      } catch (err) {
        setAttachmentError(
          err instanceof Error ? err.message : `Could not prepare "${file.name}".`
        );
        break;
      }
    }

    if (prepared.length > 0) {
      setAttachments((prev) => [...prev, ...prepared]);
    }
  };

  const handleToggleVoiceInput = () => {
    if (!speechInputSupported) return;
    setVoiceError(null);

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const locale = getLanguageByCode(preferences.languageCode).speechLocale;
    const rec = createSpeechRecognition(locale);
    if (!rec) return;

    preSpeechInputRef.current = input.trim();
    recognitionRef.current = rec;

    rec.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript;
      }
      const prefix = preSpeechInputRef.current;
      const combined = prefix ? `${prefix} ${transcript.trim()}` : transcript.trim();
      setInput(combined);
    };

    rec.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setVoiceError('Microphone permission was denied. Allow mic access in browser settings.');
      } else if (event.error !== 'aborted' && event.error !== 'no-speech') {
        setVoiceError('Voice input interrupted. Please try again or type your message.');
      }
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    try {
      rec.start();
      setIsListening(true);
    } catch {
      setVoiceError('Could not start voice input right now.');
      setIsListening(false);
    }
  };

  const handleToggleSpeak = (id: string, markdown: string) => {
    if (!speechOutputSupported) return;
    if (speakingId === id) {
      stopSpeaking();
      setSpeakingId(null);
      return;
    }
    const plain = stripMarkdownForSpeech(markdown);
    const locale = getLanguageByCode(preferences.languageCode).speechLocale;
    setSpeakingId(id);
    const started = speakText(plain, locale, () => {
      setSpeakingId((prev) => (prev === id ? null : prev));
    });
    if (!started) setSpeakingId(null);
  };

  const handleCopyMessage = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1800);
    } catch {
      // Clipboard unavailable
    }
  };

  const hasMessages = conversation.messages.length > 0;
  const canSend = (Boolean(input.trim()) || attachments.length > 0) && isOnline;

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Frosted channel & AI interaction mode strip */}
      <div className="shrink-0 border-b border-sky-100/80 dark:border-slate-800/80 bg-white/45 dark:bg-[#0D1B2E]/55 backdrop-blur-md">
        <div
          role="tablist"
          aria-label="Specialized channels"
          className="max-w-3xl mx-auto px-3 sm:px-6 pt-2 pb-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar"
        >
          {TOPICS.map((topic) => {
            const selected = topic.id === conversation.topicId;
            return (
              <button
                key={topic.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => onChangeTopic(topic.id)}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-all ${
                  selected
                    ? 'azure-gradient text-white shadow-[0_3px_10px_rgba(47,134,255,0.28)]'
                    : 'bg-white/85 dark:bg-slate-900/75 border border-sky-100/90 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <TopicIcon topicId={topic.id} className="w-3.5 h-3.5" />
                <span>{topic.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Channel-specific AI interaction mode selector */}
        <div className="max-w-3xl mx-auto px-3 sm:px-6 pb-2 flex items-center justify-between gap-2">
          <div
            role="radiogroup"
            aria-label={`${activeTopic.title} AI mode`}
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar"
          >
            {activeTopic.interactionModes.map((mode) => {
              const checked = mode.id === activeMode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  onClick={() => onChangeInteractionMode(mode.id)}
                  className={`min-h-[32px] px-3 py-1 rounded-full text-[11px] sm:text-xs font-medium whitespace-nowrap shrink-0 transition-colors border ${
                    checked
                      ? activeTopic.accentClass
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/70 dark:hover:bg-slate-800/70'
                  }`}
                >
                  {mode.label}
                </button>
              );
            })}
          </div>

          {hasMessages && (
            <button
              type="button"
              aria-expanded={toolsOpen}
              onClick={() => setToolsOpen((prev) => !prev)}
              className="min-h-[32px] px-3 py-1 rounded-full bg-white/85 dark:bg-slate-900/80 border border-sky-100 dark:border-slate-800 text-[11px] sm:text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 inline-flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors shadow-2xs"
            >
              <Wrench className="w-3 h-3 text-sky-600 dark:text-sky-400" aria-hidden="true" />
              <span>Tools</span>
              <ChevronDown
                className={`w-3 h-3 transition-transform ${toolsOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>
          )}
        </div>

        {hasMessages && toolsOpen && (
          <div className="max-w-3xl mx-auto px-3 sm:px-6 pb-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-t border-sky-100/70 dark:border-slate-800/80 pt-2">
            {activeTopic.quickTools.map((tool) => (
              <button
                key={tool.label}
                type="button"
                onClick={() => handleApplyQuickTool(tool.prefill)}
                className="min-h-[34px] px-3.5 py-1 rounded-full border border-sky-100 dark:border-slate-700 bg-white/90 dark:bg-slate-900 hover:border-sky-400 text-xs font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0 transition-colors shadow-2xs"
              >
                {tool.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Status notices (offline / private mode) */}
      {(!isOnline || !preferences.saveHistory) && (
        <div className="shrink-0 bg-white/70 dark:bg-slate-900/80 border-b border-sky-100 dark:border-slate-800 px-4 py-2 text-xs text-slate-700 dark:text-slate-300">
          <div className="max-w-3xl mx-auto flex flex-wrap items-center gap-x-4 gap-y-1">
            {!isOnline && (
              <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium">
                <WifiOff className="w-3.5 h-3.5" aria-hidden="true" />
                You are offline — saved conversations remain readable. Reconnect to send new prompts.
              </span>
            )}
            {!preferences.saveHistory && (
              <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
                Private mode active · New messages are not saved to device storage.
              </span>
            )}
          </div>
        </div>
      )}

      {/* Message thread or luminous orb empty state */}
      <div
        ref={scrollContainerRef}
        data-testid="chat-messages"
        aria-live="polite"
        className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4 sm:py-7"
      >
        <div className="max-w-3xl mx-auto">
          {!hasMessages ? (
            <motion.div
              key={`${activeTopic.id}-${activeMode.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="py-1 sm:py-5 flex flex-col items-center text-center space-y-4 sm:space-y-5"
            >
              <GlobalMindOrb size="md" />

              <div className="space-y-1.5 max-w-lg">
                <h2 className="font-display text-xl sm:text-[28px] leading-snug tracking-tight [text-wrap:balance]">
                  <span className="font-normal text-slate-500 dark:text-slate-400">
                    {activeTopic.id === 'general' ? 'GlobalMind AI,' : `${activeTopic.title},`}
                  </span>{' '}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {activeTopic.id === 'general'
                      ? 'what can I do for you now?'
                      : 'how can we solve this together?'}
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  {activeMode.label} · {activeMode.description}
                </p>
              </div>

              {/* Frosted Tools button & quick-prefill tools */}
              <div className="w-full max-w-xl space-y-2.5">
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => textareaRef.current?.focus()}
                    className="min-h-[38px] px-4 py-1.5 rounded-full bg-white/95 dark:bg-slate-900 border border-sky-100 dark:border-slate-700/90 shadow-[0_4px_16px_rgba(148,187,233,0.2)] dark:shadow-none text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 inline-flex items-center gap-2 hover:border-sky-300 transition-colors"
                  >
                    <BrandSparkle className="w-3.5 h-3.5 text-sky-500" />
                    <span>Tools</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                  {activeTopic.quickTools.map((tool) => (
                    <button
                      key={tool.label}
                      type="button"
                      onClick={() => handleApplyQuickTool(tool.prefill)}
                      className="min-h-[36px] px-3 py-1.5 rounded-full border border-sky-100/90 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 hover:border-sky-300 dark:hover:border-sky-600 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors shadow-[0_2px_10px_rgba(148,187,233,0.12)] dark:shadow-none"
                    >
                      {tool.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Starter prompts */}
              <div className="w-full max-w-xl space-y-2 text-left">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 text-center">
                  Try a starter prompt
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {activeTopic.starterPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => onSendMessage(prompt)}
                      className="text-left min-h-[44px] px-4 py-2.5 rounded-2xl border border-sky-100/90 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 hover:border-sky-300 dark:hover:border-sky-600 hover:bg-white dark:hover:bg-slate-800/80 text-xs sm:text-sm text-slate-800 dark:text-slate-200 transition-colors shadow-[0_2px_12px_rgba(148,187,233,0.12)] dark:shadow-none"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {conversation.messages.map((msg, index) => {
                const isLastMessage = index === conversation.messages.length - 1;
                const isCurrentlyStreaming =
                  isStreaming && isLastMessage && msg.role === 'assistant';

                if (msg.role === 'user') {
                  return (
                    <div key={msg.id} className="flex flex-col items-end gap-1.5">
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap justify-end gap-2 max-w-[85%] sm:max-w-[75%]">
                          {msg.attachments.map((att) =>
                            att.previewUrl ? (
                              <img
                                key={att.id}
                                src={att.previewUrl}
                                alt={att.name}
                                className="w-36 h-36 object-cover rounded-2xl border border-sky-100 dark:border-slate-700 shadow-xs"
                              />
                            ) : (
                              <div
                                key={att.id}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl border border-sky-100 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-200 shadow-xs"
                              >
                                <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" aria-hidden="true" />
                                <span className="truncate max-w-[160px] font-medium">{att.name}</span>
                                <span className="text-slate-400 tabular-nums">
                                  {formatFileSize(att.sizeBytes)}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      )}
                      {msg.content && (
                        <>
                          <div className="max-w-[85%] sm:max-w-[75%] rounded-[20px] rounded-br-[6px] bg-white dark:bg-slate-800/95 border border-sky-100/90 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap break-words shadow-[0_2px_14px_rgba(148,187,233,0.16)] dark:shadow-none">
                            {msg.content}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyMessage(msg.id, msg.content)}
                            aria-label="Copy your message"
                            className="min-h-[30px] px-2 rounded-lg text-[11px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 inline-flex items-center gap-1 transition-colors"
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                            ) : (
                              <Copy className="w-3 h-3" aria-hidden="true" />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  );
                }

                return (
                  <article key={msg.id} className="space-y-2.5">
                    {/* Open editorial assistant header matching reference */}
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full azure-gradient text-white flex items-center justify-center shadow-[0_3px_10px_rgba(47,134,255,0.28)] shrink-0">
                        <BrandSparkle className="w-4 h-4" />
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-display font-bold text-xs tracking-wide text-slate-900 dark:text-white">
                          GlobalMind AI
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">·</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {activeTopic.shortLabel}
                        </span>
                      </div>
                    </div>

                    <div className="pl-0 sm:pl-10 space-y-2.5">
                      {msg.error ? (
                        <div
                          role="alert"
                          className="rounded-2xl border border-rose-200 dark:border-rose-900/70 bg-rose-50/90 dark:bg-rose-950/40 px-4 py-3 text-sm text-rose-900 dark:text-rose-200 space-y-3"
                        >
                          <div className="flex items-start gap-2.5">
                            <AlertCircle
                              className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5"
                              aria-hidden="true"
                            />
                            <p className="leading-relaxed">{msg.content}</p>
                          </div>
                          <button
                            type="button"
                            onClick={onRegenerate}
                            className="min-h-[38px] px-3.5 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Try again</span>
                          </button>
                        </div>
                      ) : msg.content.length === 0 && isCurrentlyStreaming ? (
                        <div className="py-1.5 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                          <span className="inline-block w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                          <span>Thinking…</span>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <MarkdownRenderer content={msg.content} />

                          {msg.sources && msg.sources.length > 0 && (
                            <div className="pt-3 border-t border-sky-100 dark:border-slate-800 space-y-1.5">
                              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                Sources
                              </p>
                              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {msg.sources.map((src) => (
                                  <li key={src.uri}>
                                    <a
                                      href={src.uri}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center justify-between gap-2 px-3 py-2 rounded-2xl bg-white/85 dark:bg-slate-900/80 hover:bg-sky-50/70 dark:hover:bg-slate-800 border border-sky-100 dark:border-slate-800 text-xs transition-colors shadow-2xs"
                                    >
                                      <span className="min-w-0">
                                        <span className="block font-medium text-slate-800 dark:text-slate-100 truncate">
                                          {src.title}
                                        </span>
                                        <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                          {formatDomainFromUrl(src.uri)}
                                        </span>
                                      </span>
                                      <ExternalLink
                                        className="w-3.5 h-3.5 text-slate-400 shrink-0"
                                        aria-hidden="true"
                                      />
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {!msg.error && msg.content.length > 0 && !isCurrentlyStreaming && (
                        <div className="flex flex-wrap items-center gap-1 pt-0.5">
                          <button
                            type="button"
                            onClick={() => handleCopyMessage(msg.id, msg.content)}
                            aria-label="Copy assistant response"
                            className="min-h-[36px] px-2.5 py-1 rounded-full text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/80 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 transition-colors"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          {speechOutputSupported && (
                            <button
                              type="button"
                              onClick={() => handleToggleSpeak(msg.id, msg.content)}
                              aria-label={
                                speakingId === msg.id
                                  ? 'Stop reading response'
                                  : 'Listen to response'
                              }
                              className="min-h-[36px] px-2.5 py-1 rounded-full text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/80 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 transition-colors"
                            >
                              {speakingId === msg.id ? (
                                <>
                                  <VolumeX className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" aria-hidden="true" />
                                  <span>Stop</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>Listen</span>
                                </>
                              )}
                            </button>
                          )}

                          {isLastMessage && (
                            <button
                              type="button"
                              onClick={onRegenerate}
                              aria-label="Regenerate response"
                              className="min-h-[36px] px-2.5 py-1 rounded-full text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/80 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Regenerate</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          <div ref={scrollEndRef} />
        </div>
      </div>

      {/* Floating pill composer */}
      <div className="shrink-0 bg-gradient-to-t from-white/95 via-white/85 to-transparent dark:from-[#090F1A]/95 dark:via-[#090F1A]/85 px-3 sm:px-6 pt-1.5 pb-2.5 sm:py-3">
        <div className="max-w-3xl mx-auto space-y-2">
          {(attachmentError || voiceError) && (
            <div
              role="alert"
              className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/70 text-xs text-rose-800 dark:text-rose-200"
            >
              <span>{attachmentError ?? voiceError}</span>
              <button
                type="button"
                aria-label="Dismiss notice"
                onClick={() => {
                  setAttachmentError(null);
                  setVoiceError(null);
                }}
                className="min-h-[28px] min-w-[28px] flex items-center justify-center rounded-full hover:bg-rose-100 dark:hover:bg-rose-900/50"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          )}

          {attachments.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="relative inline-flex items-center gap-2 px-2.5 py-1.5 rounded-2xl border border-sky-100 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xs shrink-0"
                >
                  {att.previewUrl ? (
                    <img
                      src={att.previewUrl}
                      alt={att.name}
                      className="w-9 h-9 rounded-xl object-cover"
                    />
                  ) : (
                    <FileText className="w-5 h-5 text-sky-600 dark:text-sky-400" aria-hidden="true" />
                  )}
                  <div className="min-w-0 max-w-[130px]">
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate">
                      {att.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                      {formatFileSize(att.sizeBytes)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                    aria-label={`Remove attachment ${att.name}`}
                    className="min-h-[28px] min-w-[28px] rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center"
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              aria-pressed={preferences.webSearchEnabled}
              onClick={() =>
                onUpdatePreferences({ webSearchEnabled: !preferences.webSearchEnabled })
              }
              className={`min-h-[32px] px-3 py-1 rounded-full text-[11px] sm:text-xs font-medium inline-flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors border ${
                preferences.webSearchEnabled
                  ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300'
                  : 'bg-white/80 dark:bg-slate-900 border-sky-100 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Globe className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Search: {preferences.webSearchEnabled ? 'On' : 'Off'}</span>
            </button>

            <label htmlFor="chat-language-select" className="sr-only">
              Response language
            </label>
            <select
              id="chat-language-select"
              aria-label="Response language"
              value={preferences.languageCode}
              onChange={(e) => onUpdatePreferences({ languageCode: e.target.value })}
              className="min-h-[32px] px-2.5 py-1 rounded-full border border-sky-100 dark:border-slate-800 bg-white/85 dark:bg-slate-900 text-[11px] sm:text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/40 shrink-0"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.code === 'auto' ? 'Lang: Auto' : lang.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              aria-pressed={preferences.lowDataMode}
              onClick={() => onUpdatePreferences({ lowDataMode: !preferences.lowDataMode })}
              className={`min-h-[32px] px-3 py-1 rounded-full text-[11px] sm:text-xs font-medium whitespace-nowrap shrink-0 transition-colors border ${
                preferences.lowDataMode
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100'
                  : 'bg-white/85 dark:bg-slate-900 border-sky-100 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Low data: {preferences.lowDataMode ? 'On' : 'Off'}
            </button>
          </div>

          <form
            data-testid="chat-composer"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="flex items-end gap-1 rounded-[28px] bg-white dark:bg-slate-900/95 border border-sky-100 dark:border-slate-700/80 shadow-[0_6px_26px_rgba(59,130,246,0.12)] dark:shadow-[0_6px_26px_rgba(0,0,0,0.4)] p-1.5"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,application/pdf"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              aria-hidden="true"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isStreaming}
              aria-label="Attach image or PDF"
              className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-full bg-slate-100/90 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors shrink-0 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
            </button>

            <label htmlFor="chat-prompt-input" className="sr-only">
              Ask GlobalMind AI anything
            </label>
            <textarea
              id="chat-prompt-input"
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isListening
                  ? 'Listening…'
                  : activeTopic.id === 'general'
                    ? 'Ask anything...'
                    : `Ask ${activeTopic.shortLabel}...`
              }
              className="flex-1 min-h-[44px] max-h-[144px] resize-none bg-transparent px-2.5 py-2.5 text-[15px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
            />

            {speechInputSupported && (
              <button
                type="button"
                onClick={handleToggleVoiceInput}
                disabled={isStreaming}
                aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                className={`w-10 h-10 min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center transition-colors shrink-0 disabled:opacity-50 ${
                  isListening
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {isListening ? (
                  <MicOff className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Mic className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            )}

            {isStreaming ? (
              <button
                type="button"
                onClick={onStopStreaming}
                aria-label="Stop generating"
                className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 flex items-center justify-center transition-colors shrink-0"
              >
                <Square className="w-4 h-4 fill-current" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!canSend}
                aria-label="Send message"
                className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-full azure-gradient hover:opacity-95 disabled:bg-none disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 text-white flex items-center justify-center transition-all shrink-0 shadow-[0_4px_12px_rgba(47,134,255,0.34)] disabled:shadow-none"
              >
                <Send className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
