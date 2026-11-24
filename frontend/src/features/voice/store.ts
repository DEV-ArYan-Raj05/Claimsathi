/**
 * Assistant conversation (client state, rules.md §7). Messages stay in memory only and belong to
 * one signed-in user; the chosen reply language is remembered on this device between visits.
 */
import { create } from "zustand";
import { readStorage, writeStorage } from "@/shared/lib/storage";
import { isChatLanguage, type ChatLanguage } from "./languages";

const LANG_KEY = "cs.chatLang";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  /** Language the text is in (for lang/dir attributes and speech). */
  lang: string;
  route?: string | null;
}

interface AssistantState {
  ownerId: string | null;
  conversationId: string | null;
  messages: ChatMessage[];
  /** null = follow the app language. */
  chatLanguage: ChatLanguage | null;
  setChatLanguage: (lang: ChatLanguage) => void;
  add: (msg: Omit<ChatMessage, "id">) => void;
  setConversation: (id: string | null) => void;
  reset: (ownerId?: string | null) => void;
}

const stored = readStorage(LANG_KEY);
let counter = 0;

export const useAssistantStore = create<AssistantState>((set) => ({
  ownerId: null,
  conversationId: null,
  messages: [],
  chatLanguage: isChatLanguage(stored) ? stored : null,
  setChatLanguage: (chatLanguage) => {
    writeStorage(LANG_KEY, chatLanguage);
    set({ chatLanguage });
  },
  add: (msg) => set((s) => ({ messages: [...s.messages, { ...msg, id: `m${++counter}` }] })),
  setConversation: (conversationId) => set({ conversationId }),
  reset: (ownerId) =>
    set((s) => ({ messages: [], conversationId: null, ownerId: ownerId ?? s.ownerId })),
}));
