import { useEffect, useRef, useState } from 'react';
import { ChatView } from './components/ChatView';
import { HistoryView } from './components/HistoryView';
import { MobileBottomNav, MobileHeader } from './components/MobileNav';
import { SettingsView } from './components/SettingsView';
import { Sidebar } from './components/Sidebar';
import { TopicsView } from './components/TopicsView';
import { WelcomeScreen } from './components/WelcomeScreen';
import { getLanguageByCode } from './data/languages';
import { getTopicById } from './data/topics';
import type {
  AppView,
  ChatAttachment,
  Conversation,
  ThemeMode,
  TopicId,
  UserPreferences,
  WebSource,
} from './types/chat';
import {
  appendUserAndPendingAssistant,
  clearStoredConversations,
  createConversation,
  loadPreferences,
  loadStoredConversations,
  parseSseChunk,
  renameConversation,
  savePreferences,
  saveStoredConversations,
  serializeConversationsForStorage,
  stripMarkdownForSpeech,
  THEME_STORAGE_KEY,
  togglePinConversation,
  updateMessageContent,
  upsertConversation,
} from './utils/chatLogic';
import { speakText } from './utils/speech';

function getInitialTheme(): ThemeMode {
  if (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) {
    return 'dark';
  }
  return 'light';
}

function getInitialView(): AppView {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      return 'chat';
    }
  }
  return 'welcome';
}

function getInitialPreferences(): UserPreferences {
  const loaded = loadPreferences();
  if (typeof navigator !== 'undefined') {
    const conn = (navigator as unknown as {
      connection?: { saveData?: boolean; effectiveType?: string };
    }).connection;
    if (conn?.saveData || conn?.effectiveType === '2g' || conn?.effectiveType === 'slow-2g') {
      return { ...loaded, lowDataMode: true };
    }
  }
  return loaded;
}

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [activeView, setActiveView] = useState<AppView>(getInitialView);
  const [preferences, setPreferences] = useState<UserPreferences>(getInitialPreferences);
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    loadStoredConversations()
  );
  const [activeConversation, setActiveConversation] = useState<Conversation>(() => {
    const stored = loadStoredConversations();
    if (stored.length > 0 && getInitialView() === 'chat') {
      return stored[0];
    }
    return createConversation('general');
  });
  const [isStreaming, setIsStreaming] = useState(false);
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [serverConfigured, setServerConfigured] = useState<boolean | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const preferencesRef = useRef(preferences);
  preferencesRef.current = preferences;

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage failure
    }
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (preferences.lowDataMode) {
      root.classList.add('low-data-mode');
    } else {
      root.classList.remove('low-data-mode');
    }
    savePreferences(preferences);
  }, [preferences]);

  useEffect(() => {
    if (preferences.saveHistory) {
      saveStoredConversations(conversations);
    }
  }, [conversations, preferences.saveHistory]);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/health')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { configured?: boolean } | null) => {
        if (active && data && typeof data.configured === 'boolean') {
          setServerConfigured(data.configured);
        }
      })
      .catch(() => {
        if (active) setServerConfigured(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const updatePreferences = (patch: Partial<UserPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...patch }));
  };

  const stopStreaming = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsStreaming(false);
  };

  const syncConversation = (conv: Conversation) => {
    setActiveConversation(conv);
    if (conv.messages.length > 0 && preferencesRef.current.saveHistory) {
      setConversations((prev) => upsertConversation(prev, conv));
    }
  };

  const streamReply = async (conversationWithPending: Conversation, assistantMessageId: string) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsStreaming(true);

    const payloadMessages = conversationWithPending.messages
      .filter((m) => m.id !== assistantMessageId && !m.error && (m.content.trim().length > 0 || (m.attachments?.length ?? 0) > 0))
      .map((m) => ({
        role: m.role,
        content: m.content,
        attachments: m.attachments
          ?.filter((a) => Boolean(a.base64Data))
          .map((a) => ({
            name: a.name,
            mimeType: a.mimeType,
            base64Data: a.base64Data,
          })),
      }));

    let workingConv = conversationWithPending;
    let accumulatedText = '';
    let latestSources: WebSource[] | undefined;

    const timeoutId = setTimeout(() => controller.abort('timeout'), 45000);

    try {
      const currentPrefs = preferencesRef.current;
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          topicId: workingConv.topicId,
          interactionMode: workingConv.interactionMode,
          languageCode: currentPrefs.languageCode,
          webSearchEnabled: currentPrefs.webSearchEnabled,
          lowDataMode: currentPrefs.lowDataMode,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errMessage = 'Unable to get a response from GlobalMind AI.';
        try {
          const data = (await response.json()) as { error?: string };
          if (data.error) errMessage = data.error;
        } catch {
          // Keep fallback error text
        }
        workingConv = updateMessageContent(workingConv, assistantMessageId, errMessage, true);
        syncConversation(workingConv);
        return;
      }

      if (!response.body) {
        workingConv = updateMessageContent(
          workingConv,
          assistantMessageId,
          'Streaming response body was unavailable. Please try again.',
          true
        );
        syncConversation(workingConv);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const decoded = decoder.decode(value, { stream: true });
        const { events, remainder } = parseSseChunk(buffer, decoded);
        buffer = remainder;

        for (const evt of events) {
          if (evt.error) {
            workingConv = updateMessageContent(
              workingConv,
              assistantMessageId,
              evt.error,
              true
            );
            syncConversation(workingConv);
            return;
          }
          if (evt.sources && evt.sources.length > 0) {
            latestSources = evt.sources;
            workingConv = updateMessageContent(
              workingConv,
              assistantMessageId,
              accumulatedText,
              false,
              Date.now(),
              latestSources
            );
            syncConversation(workingConv);
          }
          if (evt.text) {
            accumulatedText += evt.text;
            workingConv = updateMessageContent(
              workingConv,
              assistantMessageId,
              accumulatedText,
              false,
              Date.now(),
              latestSources
            );
            syncConversation(workingConv);
          }
        }
      }

      if (!accumulatedText.trim()) {
        workingConv = updateMessageContent(
          workingConv,
          assistantMessageId,
          'No response was generated. Please try rephrasing your question.',
          true
        );
        syncConversation(workingConv);
      } else if (preferencesRef.current.autoSpeak) {
        const locale = getLanguageByCode(preferencesRef.current.languageCode).speechLocale;
        speakText(stripMarkdownForSpeech(accumulatedText), locale);
      }
    } catch (err) {
      if (controller.signal.aborted && controller.signal.reason === 'timeout') {
        workingConv = updateMessageContent(
          workingConv,
          assistantMessageId,
          'The connection timed out on a slow network. Try enabling Low data mode or tap Try again.',
          true
        );
        syncConversation(workingConv);
        return;
      }
      if (err instanceof DOMException && err.name === 'AbortError') {
        if (!accumulatedText.trim()) {
          workingConv = {
            ...workingConv,
            messages: workingConv.messages.filter((m) => m.id !== assistantMessageId),
          };
          syncConversation(workingConv);
        }
        return;
      }
      workingConv = updateMessageContent(
        workingConv,
        assistantMessageId,
        'Network connection interrupted. Please check your internet connection and try again.',
        true
      );
      syncConversation(workingConv);
    } finally {
      clearTimeout(timeoutId);
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setIsStreaming(false);
    }
  };

  const handleSendMessage = (
    text: string,
    attachments?: ChatAttachment[],
    targetConversation?: Conversation
  ) => {
    const baseConv = targetConversation ?? activeConversation;
    const { conversation: nextConv, assistantMessage } = appendUserAndPendingAssistant(
      baseConv,
      text,
      Date.now(),
      attachments
    );
    syncConversation(nextConv);
    void streamReply(nextConv, assistantMessage.id);
  };

  const handleRegenerate = () => {
    if (isStreaming || activeConversation.messages.length < 2) return;
    const lastUserIndex = [...activeConversation.messages]
      .reverse()
      .findIndex((m) => m.role === 'user');
    if (lastUserIndex === -1) return;

    const userMsgIdx = activeConversation.messages.length - 1 - lastUserIndex;
    const lastUserMsg = activeConversation.messages[userMsgIdx];
    const trimmedConversation: Conversation = {
      ...activeConversation,
      messages: activeConversation.messages.slice(0, userMsgIdx),
    };
    handleSendMessage(lastUserMsg.content, lastUserMsg.attachments, trimmedConversation);
  };

  const handleNewChat = (topicId: TopicId = 'general', modeId?: string) => {
    stopStreaming();
    const fresh = createConversation(topicId, Date.now(), modeId);
    setActiveConversation(fresh);
    setActiveView('chat');
  };

  const handleStartTopicPrompt = (topicId: TopicId, prompt?: string, modeId?: string) => {
    stopStreaming();
    const fresh = createConversation(topicId, Date.now(), modeId);
    setActiveConversation(fresh);
    setActiveView('chat');
    if (prompt) {
      handleSendMessage(prompt, undefined, fresh);
    }
  };

  const handleSelectConversation = (id: string) => {
    stopStreaming();
    const found = conversations.find((c) => c.id === id);
    if (!found) return;
    setActiveConversation(found);
    setActiveView('chat');
  };

  const handleDeleteConversation = (id: string) => {
    const nextList = conversations.filter((c) => c.id !== id);
    setConversations(nextList);
    if (activeConversation.id === id) {
      setActiveConversation(createConversation(activeConversation.topicId));
    }
  };

  const handleTogglePin = (id: string) => {
    setConversations((prev) => togglePinConversation(prev, id));
    if (activeConversation.id === id) {
      setActiveConversation((prev) => ({ ...prev, pinned: !prev.pinned }));
    }
  };

  const handleRename = (id: string, title: string) => {
    setConversations((prev) => renameConversation(prev, id, title));
    if (activeConversation.id === id) {
      setActiveConversation((prev) => ({ ...prev, title }));
    }
  };

  const handleClearAllHistory = () => {
    stopStreaming();
    setConversations([]);
    clearStoredConversations();
    setActiveConversation(createConversation('general'));
  };

  const handleExportAllChats = () => {
    const json = serializeConversationsForStorage(conversations);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `globalmind-ai-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleChangeTopic = (topicId: TopicId) => {
    const defaultMode = getTopicById(topicId).defaultModeId;
    const updated = { ...activeConversation, topicId, interactionMode: defaultMode };
    syncConversation(updated);
  };

  const handleChangeInteractionMode = (modeId: string) => {
    const updated = { ...activeConversation, interactionMode: modeId };
    syncConversation(updated);
  };

  const savedCount = conversations.filter((c) => c.messages.length > 0).length;

  if (activeView === 'welcome') {
    return (
      <WelcomeScreen
        theme={theme}
        onToggleTheme={toggleTheme}
        onStartChat={(topicId) => handleNewChat(topicId ?? 'general')}
        onOpenHistory={() => setActiveView('history')}
        historyCount={savedCount}
      />
    );
  }

  const mobileTitle =
    activeView === 'topics'
      ? 'Specialized Channels'
      : activeView === 'history'
        ? 'Chat History'
        : activeView === 'settings'
          ? 'Settings & Privacy'
          : activeConversation.messages.length > 0
            ? activeConversation.title
            : getTopicById(activeConversation.topicId).title;

  return (
    <div className="h-[100dvh] flex flex-col lg:flex-row sky-atmosphere text-slate-900 dark:text-slate-100 overflow-hidden">
      <Sidebar
        activeView={activeView}
        conversations={conversations}
        activeConversationId={activeConversation.id}
        theme={theme}
        onToggleTheme={toggleTheme}
        onNewChat={() => handleNewChat(activeConversation.topicId)}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        onNavigate={setActiveView}
      />

      <MobileHeader
        title={mobileTitle}
        theme={theme}
        onToggleTheme={toggleTheme}
        onNewChat={() => handleNewChat(activeConversation.topicId)}
        onOpenWelcome={() => setActiveView('welcome')}
      />

      <main className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
        {activeView === 'chat' && (
          <ChatView
            conversation={activeConversation}
            isStreaming={isStreaming}
            isOnline={isOnline}
            preferences={preferences}
            onUpdatePreferences={updatePreferences}
            onChangeTopic={handleChangeTopic}
            onChangeInteractionMode={handleChangeInteractionMode}
            onSendMessage={(text, atts) => handleSendMessage(text, atts)}
            onStopStreaming={stopStreaming}
            onRegenerate={handleRegenerate}
          />
        )}

        {activeView === 'topics' && (
          <TopicsView onStartTopicPrompt={handleStartTopicPrompt} />
        )}

        {activeView === 'history' && (
          <HistoryView
            conversations={conversations}
            onSelectConversation={handleSelectConversation}
            onDeleteConversation={handleDeleteConversation}
            onTogglePinConversation={handleTogglePin}
            onRenameConversation={handleRename}
            onClearAllHistory={handleClearAllHistory}
            onNewChat={() => handleNewChat('general')}
          />
        )}

        {activeView === 'settings' && (
          <SettingsView
            theme={theme}
            preferences={preferences}
            conversations={conversations}
            serverConfigured={serverConfigured}
            onToggleTheme={toggleTheme}
            onUpdatePreferences={updatePreferences}
            onExportAllChats={handleExportAllChats}
            onClearAllHistory={handleClearAllHistory}
          />
        )}
      </main>

      <MobileBottomNav activeView={activeView} onNavigate={setActiveView} />
    </div>
  );
}
