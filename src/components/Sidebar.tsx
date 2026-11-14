import {
  Compass,
  History,
  Home,
  Moon,
  Pin,
  Settings,
  SquarePen,
  Sun,
  Trash2,
} from 'lucide-react';
import { getTopicById } from '../data/topics';
import type { AppView, Conversation, ThemeMode } from '../types/chat';
import { formatRelativeTime } from '../utils/chatLogic';
import { BrandSparkle } from './BrandMark';

interface SidebarProps {
  activeView: AppView;
  conversations: Conversation[];
  activeConversationId: string;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onNavigate: (view: AppView) => void;
}

export function Sidebar({
  activeView,
  conversations,
  activeConversationId,
  theme,
  onToggleTheme,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onNavigate,
}: SidebarProps) {
  const nonEmpty = conversations.filter((c) => c.messages.length > 0);
  const ordered = [
    ...nonEmpty.filter((c) => c.pinned),
    ...nonEmpty.filter((c) => !c.pinned),
  ].slice(0, 14);

  return (
    <aside
      aria-label="Primary navigation and recent chats"
      className="hidden lg:flex lg:w-72 lg:flex-col lg:shrink-0 border-r border-sky-100/90 dark:border-slate-800/80 bg-white/80 dark:bg-[#0D1626]/90 backdrop-blur-xl h-[100dvh]"
    >
      <div className="p-4 border-b border-sky-100/80 dark:border-slate-800/80 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onNavigate('welcome')}
          aria-label="Return to GlobalMind AI welcome screen"
          className="flex items-center gap-2.5 text-left hover:opacity-85 transition-opacity min-h-[44px]"
        >
          <span className="w-9 h-9 rounded-full azure-gradient text-white flex items-center justify-center shadow-[0_4px_12px_rgba(47,134,255,0.28)] shrink-0">
            <BrandSparkle className="w-4 h-4" />
          </span>
          <span className="font-display font-bold text-base tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
            GlobalMind AI
          </span>
        </button>

        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="min-h-[40px] min-w-[40px] rounded-full border border-sky-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-800 flex items-center justify-center transition-colors shadow-2xs"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Moon className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
      </div>

      <div className="p-3.5 space-y-2 border-b border-sky-100/80 dark:border-slate-800/80">
        <button
          type="button"
          onClick={onNewChat}
          className="w-full min-h-[44px] px-4 py-2.5 rounded-full azure-gradient hover:opacity-95 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-opacity whitespace-nowrap shadow-[0_6px_18px_rgba(47,134,255,0.28)]"
        >
          <SquarePen className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>New conversation</span>
        </button>

        <nav className="space-y-1 pt-1" aria-label="Workspace sections">
          <button
            type="button"
            onClick={() => onNavigate('topics')}
            className={`w-full min-h-[40px] px-3.5 py-2 rounded-full text-sm font-medium flex items-center gap-2.5 transition-colors whitespace-nowrap ${
              activeView === 'topics'
                ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300'
                : 'text-slate-600 dark:text-slate-400 hover:bg-sky-50/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Compass className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Channels</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('history')}
            className={`w-full min-h-[40px] px-3.5 py-2 rounded-full text-sm font-medium flex items-center justify-between transition-colors whitespace-nowrap ${
              activeView === 'history'
                ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300'
                : 'text-slate-600 dark:text-slate-400 hover:bg-sky-50/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <History className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Chat history</span>
            </span>
            {nonEmpty.length > 0 && (
              <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {nonEmpty.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onNavigate('settings')}
            className={`w-full min-h-[40px] px-3.5 py-2 rounded-full text-sm font-medium flex items-center gap-2.5 transition-colors whitespace-nowrap ${
              activeView === 'settings'
                ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300'
                : 'text-slate-600 dark:text-slate-400 hover:bg-sky-50/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Settings & Privacy</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('welcome')}
            className="w-full min-h-[40px] px-3.5 py-2 rounded-full text-sm font-medium flex items-center gap-2.5 text-slate-600 dark:text-slate-400 hover:bg-sky-50/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap"
          >
            <Home className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Welcome guide</span>
          </button>
        </nav>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-3.5">
        <div className="px-2 pb-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          Recent conversations
        </div>

        {ordered.length === 0 ? (
          <p className="px-2 py-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Your saved conversations will appear here automatically after you send a message.
          </p>
        ) : (
          <ul className="space-y-1">
            {ordered.map((conv) => {
              const isSelected = activeView === 'chat' && conv.id === activeConversationId;
              const topic = getTopicById(conv.topicId);
              return (
                <li key={conv.id} className="group flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onSelectConversation(conv.id)}
                    className={`flex-1 min-w-0 text-left px-3 py-2.5 rounded-2xl transition-colors ${
                      isSelected
                        ? 'bg-sky-50/90 dark:bg-sky-950/50 text-sky-950 dark:text-sky-100 border border-sky-200/70 dark:border-sky-800/60'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-sky-50/50 dark:hover:bg-slate-800/60 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      {conv.pinned && (
                        <Pin
                          className="w-3 h-3 text-sky-600 dark:text-sky-400 shrink-0"
                          aria-hidden="true"
                        />
                      )}
                      <span className="text-sm font-medium truncate">{conv.title}</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 tabular-nums">
                      {topic.shortLabel} · {formatRelativeTime(conv.updatedAt)}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteConversation(conv.id)}
                    aria-label={`Delete conversation "${conv.title}"`}
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 min-h-[36px] min-w-[36px] rounded-full text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 flex items-center justify-center transition-opacity shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
