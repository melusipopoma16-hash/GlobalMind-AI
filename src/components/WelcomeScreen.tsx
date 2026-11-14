import { ArrowRight, History, Moon, Sun } from 'lucide-react';
import { motion } from 'motion/react';
import { TOPICS } from '../data/topics';
import type { ThemeMode, TopicId } from '../types/chat';
import { BrandSparkle, GlobalMindOrb } from './BrandMark';
import { TopicIcon } from './TopicIcon';

interface WelcomeScreenProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  onStartChat: (topicId?: TopicId) => void;
  onOpenHistory: () => void;
  historyCount: number;
}

export function WelcomeScreen({
  theme,
  onToggleTheme,
  onStartChat,
  onOpenHistory,
  historyCount,
}: WelcomeScreenProps) {
  const featuredTopics = TOPICS.filter((t) => t.id !== 'general');

  return (
    <div className="min-h-[100dvh] flex flex-col sky-atmosphere text-slate-900 dark:text-slate-100">
      <header className="w-full border-b border-sky-100/80 dark:border-slate-800/80 bg-white/55 dark:bg-[#0D1B2E]/65 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="w-9 h-9 rounded-full azure-gradient text-white flex items-center justify-center shadow-[0_4px_12px_rgba(47,134,255,0.28)]">
              <BrandSparkle className="w-4 h-4" />
            </span>
            <span className="font-display font-bold text-lg tracking-tight whitespace-nowrap">
              GlobalMind AI
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="min-h-[44px] min-w-[44px] px-3.5 rounded-full border border-white dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 shadow-[0_2px_10px_rgba(148,187,233,0.18)] dark:shadow-none transition-colors inline-flex items-center justify-center gap-2 text-sm font-medium whitespace-nowrap shrink-0"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Moon className="w-4 h-4" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>

            <button
              type="button"
              onClick={() => onStartChat('general')}
              className="min-h-[44px] px-4 rounded-full azure-gradient hover:opacity-95 text-white text-sm font-semibold transition-opacity inline-flex items-center gap-2 whitespace-nowrap shrink-0 shadow-[0_6px_18px_rgba(47,134,255,0.28)]"
            >
              <span>Open Chat</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 space-y-6"
          >
            <p className="text-xs sm:text-sm font-semibold text-sky-700 dark:text-sky-400 tracking-wide">
              100% Free Personal AI · Live Web Search · Voice & File Analysis
            </p>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.12] [text-wrap:balance]">
              Clear answers and practical help for any question, anywhere.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              GlobalMind AI helps students, builders, entrepreneurs, and curious minds worldwide solve homework, analyze images and PDFs, search the live web with citations, translate languages, and work smoothly even on slower mobile connections.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onStartChat('general')}
                className="min-h-[48px] px-6 py-3 rounded-full azure-gradient hover:opacity-95 text-white font-semibold text-sm sm:text-base transition-opacity inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 shadow-[0_8px_22px_rgba(47,134,255,0.3)]"
              >
                <span>Start a conversation</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>

              {historyCount > 0 && (
                <button
                  type="button"
                  onClick={onOpenHistory}
                  className="min-h-[48px] px-5 py-3 rounded-full border border-sky-100 dark:border-slate-700 bg-white/90 dark:bg-slate-900 hover:bg-white dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium text-sm sm:text-base transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 shadow-[0_3px_14px_rgba(148,187,233,0.16)] dark:shadow-none"
                >
                  <History className="w-4 h-4 text-sky-600 dark:text-sky-400" aria-hidden="true" />
                  <span className="tabular-nums">Saved chats ({historyCount})</span>
                </button>
              )}
            </div>
          </motion.section>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 flex items-center justify-center py-6"
          >
            <div className="w-full max-w-[340px] rounded-[32px] border border-white/90 dark:border-slate-800 bg-white/75 dark:bg-[#0F172A]/85 backdrop-blur-md shadow-[0_18px_48px_rgba(78,168,255,0.18)] dark:shadow-none p-8 flex flex-col items-center text-center space-y-5">
              <GlobalMindOrb size="lg" />
              <div className="space-y-1">
                <p className="font-display font-semibold text-base text-slate-900 dark:text-white">
                  What can I do for you now?
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  7 specialized channels · Instant streaming replies
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <section aria-labelledby="capabilities-heading" className="mt-12 lg:mt-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-5">
            <div>
              <h2
                id="capabilities-heading"
                className="font-display text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white"
              >
                Choose a specialized channel
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Tap any domain to launch a tailored AI assistant with interaction modes and tools.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {featuredTopics.map((topic, index) => (
              <motion.button
                key={topic.id}
                type="button"
                aria-label={`Start ${topic.title} conversation`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.2,
                  delay: Math.min(index * 0.03, 0.18),
                  ease: [0.16, 1, 0.3, 1],
                }}
                onClick={() => onStartChat(topic.id)}
                className="group text-left p-5 rounded-[24px] border border-sky-100/90 dark:border-slate-800 bg-white/90 dark:bg-[#0F172A]/90 hover:border-sky-300 dark:hover:border-sky-600 shadow-[0_4px_20px_rgba(148,187,233,0.12)] dark:shadow-none transition-colors min-h-[124px] flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`w-11 h-11 rounded-full border flex items-center justify-center shrink-0 ${topic.accentClass}`}
                  >
                    <TopicIcon topicId={topic.id} className="w-5 h-5" />
                  </div>
                  <ArrowRight
                    className="w-4 h-4 text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 group-hover:translate-x-0.5 transition-transform"
                    aria-hidden="true"
                  />
                </div>
                <div className="mt-4">
                  <h3 className="font-display font-semibold text-base text-slate-900 dark:text-slate-100">
                    {topic.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-snug">
                    {topic.description}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
