import { useState } from 'react';
import {
  Download,
  Globe,
  HardDrive,
  Languages,
  Moon,
  ShieldCheck,
  Sun,
  Trash2,
  Volume2,
  Wifi,
} from 'lucide-react';
import { LANGUAGES } from '../data/languages';
import type { Conversation, ThemeMode, UserPreferences } from '../types/chat';
import { formatFileSize } from '../utils/attachments';
import { calculateStorageBytes } from '../utils/chatLogic';
import { isSpeechRecognitionSupported, isSpeechSynthesisSupported } from '../utils/speech';

interface SettingsViewProps {
  theme: ThemeMode;
  preferences: UserPreferences;
  conversations: Conversation[];
  serverConfigured: boolean | null;
  onToggleTheme: () => void;
  onUpdatePreferences: (patch: Partial<UserPreferences>) => void;
  onExportAllChats: () => void;
  onClearAllHistory: () => void;
}

function ToggleRow({
  id,
  icon,
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 px-4">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-10 h-10 rounded-full bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
          {icon}
        </div>
        <div className="min-w-0">
          <label
            htmlFor={id}
            className="block text-sm font-medium text-slate-900 dark:text-slate-100 cursor-pointer"
          >
            {title}
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:opacity-40 disabled:cursor-not-allowed ${
          checked ? 'azure-gradient' : 'bg-slate-300 dark:bg-slate-700'
        }`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-xs transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

export function SettingsView({
  theme,
  preferences,
  conversations,
  serverConfigured,
  onToggleTheme,
  onUpdatePreferences,
  onExportAllChats,
  onClearAllHistory,
}: SettingsViewProps) {
  const [confirmClear, setConfirmClear] = useState(false);

  const savedConversations = conversations.filter((c) => c.messages.length > 0);
  const storageBytes = calculateStorageBytes(savedConversations);
  const voiceInputSupported = isSpeechRecognitionSupported();
  const voiceOutputSupported = isSpeechSynthesisSupported();

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="space-y-1">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Settings & Privacy
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Free personal AI preferences, language, mobile data optimization, and device privacy controls.
          </p>
        </header>

        {/* Language & Voice */}
        <section className="rounded-[24px] border border-sky-100/90 dark:border-slate-800 bg-white/90 dark:bg-[#0F172A]/90 shadow-[0_6px_24px_rgba(148,187,233,0.12)] dark:shadow-none overflow-hidden">
          <div className="px-4 py-3 border-b border-sky-100/70 dark:border-slate-800">
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
              Language & Voice
            </h3>
          </div>

          <div className="divide-y divide-sky-100/70 dark:divide-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 px-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Languages className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <label
                    htmlFor="settings-language-select"
                    className="block text-sm font-medium text-slate-900 dark:text-slate-100"
                  >
                    Preferred response language
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Also sets the recognition and voice language when using microphone or Listen.
                  </p>
                </div>
              </div>

              <select
                id="settings-language-select"
                value={preferences.languageCode}
                onChange={(e) => onUpdatePreferences({ languageCode: e.target.value })}
                className="min-h-[44px] px-3.5 py-2 rounded-full border border-sky-100 dark:border-slate-700 bg-sky-50/40 dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/40 shrink-0"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label} — {lang.nativeLabel}
                  </option>
                ))}
              </select>
            </div>

            <ToggleRow
              id="toggle-auto-speak"
              icon={<Volume2 className="w-4 h-4" aria-hidden="true" />}
              title="Auto-read AI responses"
              description={
                voiceOutputSupported
                  ? `Automatically speak finished answers aloud${
                      voiceInputSupported ? ' · Voice microphone is active' : ''
                    }.`
                  : 'Text-to-speech is not supported by this browser.'
              }
              checked={preferences.autoSpeak && voiceOutputSupported}
              disabled={!voiceOutputSupported}
              onChange={(next) => onUpdatePreferences({ autoSpeak: next })}
            />
          </div>
        </section>

        {/* Search, Bandwidth & Appearance */}
        <section className="rounded-[24px] border border-sky-100/90 dark:border-slate-800 bg-white/90 dark:bg-[#0F172A]/90 shadow-[0_6px_24px_rgba(148,187,233,0.12)] dark:shadow-none overflow-hidden">
          <div className="px-4 py-3 border-b border-sky-100/70 dark:border-slate-800">
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
              Search, Speed & Appearance
            </h3>
          </div>

          <div className="divide-y divide-sky-100/70 dark:divide-slate-800">
            <ToggleRow
              id="toggle-web-search"
              icon={<Globe className="w-4 h-4" aria-hidden="true" />}
              title="Live Web Search with citations"
              description="Ground answers in real-time web results and display clickable source links."
              checked={preferences.webSearchEnabled}
              onChange={(next) => onUpdatePreferences({ webSearchEnabled: next })}
            />

            <ToggleRow
              id="toggle-low-data"
              icon={<Wifi className="w-4 h-4" aria-hidden="true" />}
              title="Low-data & fast mode"
              description="Compresses uploaded images further, requests concise replies, and turns off extra UI motion for low-end Android phones or slow connections."
              checked={preferences.lowDataMode}
              onChange={(next) => onUpdatePreferences({ lowDataMode: next })}
            />

            <ToggleRow
              id="toggle-dark-mode"
              icon={
                theme === 'dark' ? (
                  <Moon className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Sun className="w-4 h-4" aria-hidden="true" />
                )
              }
              title="Dark mode"
              description="Midnight-sky dark theme designed for comfortable night and low-light reading."
              checked={theme === 'dark'}
              onChange={() => onToggleTheme()}
            />
          </div>
        </section>

        {/* Privacy & Data Controls */}
        <section className="rounded-[24px] border border-sky-100/90 dark:border-slate-800 bg-white/90 dark:bg-[#0F172A]/90 shadow-[0_6px_24px_rgba(148,187,233,0.12)] dark:shadow-none overflow-hidden">
          <div className="px-4 py-3 border-b border-sky-100/70 dark:border-slate-800">
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
              Privacy & Device Data
            </h3>
          </div>

          <div className="divide-y divide-sky-100/70 dark:divide-slate-800">
            <ToggleRow
              id="toggle-save-history"
              icon={<ShieldCheck className="w-4 h-4" aria-hidden="true" />}
              title="Save chat history on this device"
              description="Turn off to use Private mode so new conversations are never written to browser storage."
              checked={preferences.saveHistory}
              onChange={(next) => onUpdatePreferences({ saveHistory: next })}
            />

            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                  <HardDrive className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Local storage usage
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                    {savedConversations.length} conversation
                    {savedConversations.length === 1 ? '' : 's'} · {formatFileSize(storageBytes)}{' '}
                    stored locally
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={savedConversations.length === 0}
                  onClick={onExportAllChats}
                  className="min-h-[44px] px-4 py-2 rounded-full border border-sky-100 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-sky-50 dark:hover:bg-slate-800 disabled:opacity-40 text-sm font-medium text-slate-800 dark:text-slate-200 inline-flex items-center gap-2 transition-colors whitespace-nowrap"
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                  <span>Export JSON</span>
                </button>

                {!confirmClear ? (
                  <button
                    type="button"
                    disabled={savedConversations.length === 0}
                    onClick={() => setConfirmClear(true)}
                    className="min-h-[44px] px-4 py-2 rounded-full border border-sky-100 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-40 text-sm font-medium text-rose-700 dark:text-rose-400 inline-flex items-center gap-2 transition-colors whitespace-nowrap"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                    <span>Clear all</span>
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
                      Confirm delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClear(false)}
                      className="min-h-[44px] px-3.5 py-2 rounded-full border border-sky-100 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed space-y-1.5">
              <p className="font-medium text-slate-700 dark:text-slate-300">
                Security & Free Access Guarantee
              </p>
              <p>
                GlobalMind AI is 100% free with no subscriptions or paywalls. Conversations stay in your browser on this device, and AI requests are routed securely through the server so API credentials are never exposed in frontend code.
              </p>
              <p className="tabular-nums">
                AI gateway status:{' '}
                {serverConfigured === null
                  ? 'Checking connection…'
                  : serverConfigured
                    ? 'Connected and ready'
                    : 'Server key missing (configure GEMINI_API_KEY in Settings > Secrets)'}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
