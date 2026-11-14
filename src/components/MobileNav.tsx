import {
  Compass,
  History,
  Home,
  MessageSquare,
  Moon,
  Settings,
  SquarePen,
  Sun,
} from 'lucide-react';
import type { AppView, ThemeMode } from '../types/chat';

interface MobileHeaderProps {
  title: string;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onNewChat: () => void;
  onOpenWelcome: () => void;
}

export function MobileHeader({
  title,
  theme,
  onToggleTheme,
  onNewChat,
  onOpenWelcome,
}: MobileHeaderProps) {
  return (
    <header className="lg:hidden shrink-0 h-[56px] px-3 flex items-center justify-between gap-2 z-30 bg-transparent">
      <button
        type="button"
        onClick={onOpenWelcome}
        aria-label="Open GlobalMind AI welcome screen"
        className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-full bg-white/90 dark:bg-slate-900/85 border border-white dark:border-slate-800 shadow-[0_2px_12px_rgba(148,187,233,0.2)] dark:shadow-none flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-colors shrink-0"
      >
        <Home className="w-4 h-4" aria-hidden="true" />
      </button>

      <h1 className="font-display font-bold text-[15px] tracking-tight text-slate-900 dark:text-white truncate text-center flex-1 min-w-0">
        {title}
      </h1>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-full bg-white/90 dark:bg-slate-900/85 border border-white dark:border-slate-800 shadow-[0_2px_12px_rgba(148,187,233,0.2)] dark:shadow-none flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-colors"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Moon className="w-4 h-4" aria-hidden="true" />
          )}
        </button>

        <button
          type="button"
          onClick={onNewChat}
          aria-label="Start new conversation"
          className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-full bg-white/90 dark:bg-slate-900/85 border border-white dark:border-slate-800 shadow-[0_2px_12px_rgba(148,187,233,0.2)] dark:shadow-none flex items-center justify-center text-sky-600 dark:text-sky-400 hover:bg-white dark:hover:bg-slate-800 transition-colors"
        >
          <SquarePen className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}

interface MobileBottomNavProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
}

export function MobileBottomNav({ activeView, onNavigate }: MobileBottomNavProps) {
  const tabs: Array<{ id: AppView; label: string; icon: typeof MessageSquare }> = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'topics', label: 'Channels', icon: Compass },
    { id: 'history', label: 'History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="lg:hidden shrink-0 border-t border-sky-100/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#0D1626]/95 backdrop-blur-md pb-safe z-30"
    >
      <div className="grid grid-cols-4 h-[62px] px-2 items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeView === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onNavigate(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className="min-h-[44px] flex items-center justify-center"
            >
              <span
                className={`inline-flex items-center justify-center gap-1.5 rounded-full transition-all whitespace-nowrap ${
                  isActive
                    ? 'azure-gradient text-white px-3.5 py-2 shadow-[0_4px_14px_rgba(47,134,255,0.32)]'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 px-2 py-2 flex-col gap-0.5'
                }`}
              >
                <Icon
                  className={isActive ? 'w-4 h-4 shrink-0' : 'w-[18px] h-[18px] shrink-0'}
                  strokeWidth={isActive ? 2.25 : 1.75}
                  aria-hidden="true"
                />
                <span
                  className={
                    isActive
                      ? 'text-xs font-semibold tracking-tight leading-none'
                      : 'text-[10px] font-medium tracking-tight leading-none'
                  }
                >
                  {tab.label}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
