import { useState } from 'react';
import {
  Check,
  ChevronRight,
  Download,
  MessageSquarePlus,
  Pencil,
  Pin,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { getTopicById, TOPICS } from '../data/topics';
import type { Conversation, TopicId } from '../types/chat';
import {
  filterConversations,
  formatConversationAsMarkdown,
  formatRelativeTime,
  groupConversationsByRecency,
} from '../utils/chatLogic';
import { TopicIcon } from './TopicIcon';

interface HistoryViewProps {
  conversations: Conversation[];
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onTogglePinConversation: (id: string) => void;
  onRenameConversation: (id: string, title: string) => void;
  onClearAllHistory: () => void;
  onNewChat: () => void;
}

export function HistoryView({
  conversations,
  onSelectConversation,
  onDeleteConversation,
  onTogglePinConversation,
  onRenameConversation,
  onClearAllHistory,
  onNewChat,
}: HistoryViewProps) {
  const [query, setQuery] = useState('');
  const [topicFilter, setTopicFilter] = useState<TopicId | 'all'>('all');
  const [confirmClear, setConfirmClear] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');

  const nonEmpty = conversations.filter((c) => c.messages.length > 0);
  const filtered = filterConversations(nonEmpty, query, topicFilter);
  const groups = groupConversationsByRecency(filtered);

  const startEditing = (conv: Conversation) => {
    setEditingId(conv.id);
    setDraftTitle(conv.title);
  };

  const commitRename = (id: string) => {
    if (draftTitle.trim()) {
      onRenameConversation(id, draftTitle);
    }
    setEditingId(null);
  };

  const handleExportMarkdown = (conv: Conversation) => {
    const md = formatConversationAsMarkdown(conv);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeSlug = conv.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'globalmind-chat';
    a.download = `${safeSlug}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Your chat history
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 tabular-nums">
              {nonEmpty.length === 0
                ? 'No saved conversations yet'
                : `${nonEmpty.length} saved conversation${nonEmpty.length === 1 ? '' : 's'}`}
            </p>
          </div>

          {nonEmpty.length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              {!confirmClear ? (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="min-h-[44px] px-4 py-2 rounded-full border border-sky-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/70 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shadow-2xs"
                >
                  Clear all
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClearAllHistory();
                      setConfirmClear(false);
                    }}
                    className="min-h-[44px] px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold whitespace-nowrap transition-colors"
                  >
                    Confirm clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="min-h-[44px] px-3.5 py-2 rounded-full border border-sky-100 dark:border-slate-700 bg-white/90 dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </header>

        {nonEmpty.length > 0 && (
          <div className="space-y-3">
            <div className="relative">
              <label htmlFor="history-search" className="sr-only">
                Search conversations
              </label>
              <Search
                className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="history-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search past questions and answers..."
                className="w-full min-h-[46px] pl-11 pr-10 py-2.5 rounded-full border border-sky-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 shadow-[0_4px_16px_rgba(148,187,233,0.12)] dark:shadow-none focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear search query"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              <button
                type="button"
                onClick={() => setTopicFilter('all')}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-all ${
                  topicFilter === 'all'
                    ? 'azure-gradient text-white shadow-[0_3px_10px_rgba(47,134,255,0.28)]'
                    : 'bg-white/85 dark:bg-slate-900 border border-sky-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All channels
              </button>
              {TOPICS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTopicFilter(t.id)}
                  className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-all ${
                    topicFilter === t.id
                      ? 'azure-gradient text-white shadow-[0_3px_10px_rgba(47,134,255,0.28)]'
                      : 'bg-white/85 dark:bg-slate-900 border border-sky-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t.shortLabel}
                </button>
              ))}
            </div>
          </div>
        )}

        {nonEmpty.length === 0 ? (
          <div className="rounded-[24px] border border-sky-100/90 dark:border-slate-800 bg-white/90 dark:bg-[#0F172A]/90 shadow-[0_6px_24px_rgba(148,187,233,0.12)] dark:shadow-none p-8 text-center space-y-4">
            <p className="font-display font-semibold text-lg text-slate-900 dark:text-white">
              No saved chats yet
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Start a conversation on homework, coding, business ideas, science, or languages and GlobalMind AI will organize it here.
            </p>
            <button
              type="button"
              onClick={onNewChat}
              className="min-h-[44px] px-5 py-2.5 rounded-full azure-gradient hover:opacity-95 text-white text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap transition-opacity shadow-[0_6px_18px_rgba(47,134,255,0.28)]"
            >
              <MessageSquarePlus className="w-4 h-4" aria-hidden="true" />
              <span>Start a new chat</span>
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[24px] border border-sky-100/90 dark:border-slate-800 bg-white/90 dark:bg-[#0F172A]/90 p-8 text-center space-y-2">
            <p className="font-display font-semibold text-base text-slate-900 dark:text-white">
              No matching conversations
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Try a different keyword or switch back to all channels.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <section key={group.label} aria-label={group.label} className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">
                  {group.label}
                </h3>
                <div className="rounded-[24px] border border-sky-100/90 dark:border-slate-800 bg-white/90 dark:bg-[#0F172A]/90 shadow-[0_6px_24px_rgba(148,187,233,0.12)] dark:shadow-none divide-y divide-sky-100/70 dark:divide-slate-800 overflow-hidden">
                  {group.items.map((conv) => {
                    const topic = getTopicById(conv.topicId);
                    const lastAssistant = [...conv.messages]
                      .reverse()
                      .find((m) => m.role === 'assistant' && m.content.trim().length > 0);
                    const isEditing = editingId === conv.id;

                    return (
                      <div key={conv.id} className="p-2 sm:px-3 flex items-center gap-1.5">
                        {isEditing ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              commitRename(conv.id);
                            }}
                            className="flex-1 flex items-center gap-2 px-2 py-2"
                          >
                            <label htmlFor={`rename-${conv.id}`} className="sr-only">
                              Rename conversation
                            </label>
                            <input
                              id={`rename-${conv.id}`}
                              type="text"
                              autoFocus
                              value={draftTitle}
                              onChange={(e) => setDraftTitle(e.target.value)}
                              className="flex-1 min-h-[40px] px-3.5 py-1.5 rounded-full border border-sky-400 bg-sky-50/40 dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none"
                            />
                            <button
                              type="submit"
                              aria-label="Save conversation title"
                              className="min-h-[40px] min-w-[40px] rounded-full azure-gradient text-white flex items-center justify-center"
                            >
                              <Check className="w-4 h-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              aria-label="Cancel renaming"
                              className="min-h-[40px] min-w-[40px] rounded-full border border-sky-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center"
                            >
                              <X className="w-4 h-4" aria-hidden="true" />
                            </button>
                          </form>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => onSelectConversation(conv.id)}
                              className="flex-1 min-w-0 text-left px-2 py-2.5 rounded-2xl hover:bg-sky-50/60 dark:hover:bg-slate-800/60 transition-colors flex items-center gap-3 min-h-[60px]"
                            >
                              <div
                                className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 ${topic.accentClass}`}
                              >
                                <TopicIcon topicId={conv.topicId} className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm sm:text-[15px] text-slate-900 dark:text-slate-100 truncate">
                                  {conv.title}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate tabular-nums">
                                  {topic.shortLabel} · {conv.messages.length} messages ·{' '}
                                  {formatRelativeTime(conv.updatedAt)}
                                </div>
                                {lastAssistant && (
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                                    {lastAssistant.content.replace(/[#*`>_]/g, '')}
                                  </p>
                                )}
                              </div>
                              <ChevronRight
                                className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block"
                                aria-hidden="true"
                              />
                            </button>

                            <div className="flex items-center shrink-0">
                              <button
                                type="button"
                                onClick={() => onTogglePinConversation(conv.id)}
                                aria-label={
                                  conv.pinned
                                    ? `Unpin conversation "${conv.title}"`
                                    : `Pin conversation "${conv.title}"`
                                }
                                className={`min-h-[44px] min-w-[40px] rounded-full flex items-center justify-center transition-colors ${
                                  conv.pinned
                                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50'
                                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-800'
                                }`}
                              >
                                <Pin className="w-4 h-4" aria-hidden="true" />
                              </button>

                              <button
                                type="button"
                                onClick={() => startEditing(conv)}
                                aria-label={`Rename conversation "${conv.title}"`}
                                className="flex min-h-[44px] min-w-[38px] rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-800 items-center justify-center transition-colors"
                              >
                                <Pencil className="w-4 h-4" aria-hidden="true" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleExportMarkdown(conv)}
                                aria-label={`Export conversation "${conv.title}" as Markdown`}
                                className="flex min-h-[44px] min-w-[38px] rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-800 items-center justify-center transition-colors"
                              >
                                <Download className="w-4 h-4" aria-hidden="true" />
                              </button>

                              <button
                                type="button"
                                onClick={() => onDeleteConversation(conv.id)}
                                aria-label={`Delete conversation "${conv.title}"`}
                                className="min-h-[44px] min-w-[40px] rounded-full text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
                              >
                                <Trash2 className="w-4 h-4" aria-hidden="true" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
