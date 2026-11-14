import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { TOPICS } from '../data/topics';
import type { TopicId } from '../types/chat';
import { TopicIcon } from './TopicIcon';

interface TopicsViewProps {
  onStartTopicPrompt: (topicId: TopicId, prompt?: string, modeId?: string) => void;
}

export function TopicsView({ onStartTopicPrompt }: TopicsViewProps) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="space-y-1.5">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Specialized Channels
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl">
            Each channel adapts GlobalMind AI with domain-specific interaction modes, quick tools, and curated prompts.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TOPICS.map((topic, idx) => (
            <motion.section
              key={topic.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: Math.min(idx * 0.03, 0.15) }}
              className="rounded-[24px] border border-sky-100/90 dark:border-slate-800 bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-sm shadow-[0_6px_24px_rgba(148,187,233,0.14)] dark:shadow-none p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-full border flex items-center justify-center shrink-0 ${topic.accentClass}`}
                    >
                      <TopicIcon topicId={topic.id} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display font-semibold text-base text-slate-900 dark:text-white truncate">
                        {topic.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {topic.tagline}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onStartTopicPrompt(topic.id)}
                    aria-label={`Open ${topic.title} channel`}
                    className="min-h-[40px] px-3.5 py-1.5 rounded-full azure-gradient hover:opacity-95 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-opacity shadow-[0_4px_12px_rgba(47,134,255,0.28)]"
                  >
                    <span>Open</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {topic.description}
                </p>

                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    AI interaction modes
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {topic.interactionModes.map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => onStartTopicPrompt(topic.id, undefined, mode.id)}
                        className="min-h-[34px] px-3 py-1 rounded-full border border-sky-100 dark:border-slate-700 bg-sky-50/50 dark:bg-slate-800/70 hover:border-sky-400 dark:hover:border-sky-500 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap"
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-sky-100/80 dark:border-slate-800">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Quick start prompts
                </p>
                <div className="space-y-1.5">
                  {topic.starterPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => onStartTopicPrompt(topic.id, prompt)}
                      className="w-full text-left px-3.5 py-2.5 min-h-[44px] rounded-2xl bg-sky-50/40 dark:bg-slate-800/60 hover:bg-sky-50 dark:hover:bg-slate-800 border border-sky-100/80 dark:border-slate-700/70 text-xs sm:text-sm text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-between gap-2"
                    >
                      <span className="line-clamp-2">{prompt}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-sky-500 shrink-0" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.section>
          ))}
        </div>
      </div>
    </div>
  );
}
