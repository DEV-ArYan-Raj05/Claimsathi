/**
 * The assistant conversation: live answers from POST /api/v1/chat (Sarvam via FastAPI) when the
 * backend is configured, otherwise the demo keyword replies. One conversation per signed-in user.
 */
import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { IS_LIVE_CHAT } from "@/shared/config/app";
import { useLang } from "@/shared/hooks/useLang";
import { useTrack } from "@/shared/hooks/useTrack";
import { ApiError } from "@/shared/lib/apiClient";
import { useSession } from "@/shared/lib/session";
import { getIntent, sendChatMessage } from "../api";
import { fromAppLanguage, type ChatLanguage } from "../languages";
import { useAssistantStore } from "../store";

interface Answer {
  text: string;
  lang: string;
  route: string | null;
}

export function useAssistant() {
  const { lang: appLang, pick } = useLang();
  const track = useTrack();
  const userId = useSession((s) => s.user?.id ?? null);
  const store = useAssistantStore();
  const language: ChatLanguage = store.chatLanguage ?? fromAppLanguage(appLang);

  // A different person signed in (or nobody): never show the previous user's conversation.
  useEffect(() => {
    if (useAssistantStore.getState().ownerId !== userId) useAssistantStore.getState().reset(userId);
  }, [userId]);

  const askLive = async (message: string, retried = false): Promise<Answer> => {
    const { conversationId, setConversation } = useAssistantStore.getState();
    try {
      const r = await sendChatMessage({
        message,
        language,
        track,
        conversation_id: conversationId,
      });
      setConversation(r.conversation_id);
      return { text: r.reply, lang: r.language, route: r.route };
    } catch (err) {
      // The server forgot the conversation (restart or expiry): start a new one once.
      if (!retried && err instanceof ApiError && err.code === "CONVERSATION_NOT_FOUND") {
        setConversation(null);
        return askLive(message, true);
      }
      throw err;
    }
  };

  const askDemo = async (message: string): Promise<Answer> => {
    const r = await getIntent(message, track, appLang);
    return { text: pick(r.reply), lang: fromAppLanguage(appLang), route: r.route };
  };

  const mutation = useMutation({
    mutationFn: (message: string) => (IS_LIVE_CHAT ? askLive(message) : askDemo(message)),
    onSuccess: (a) => store.add({ role: "assistant", text: a.text, lang: a.lang, route: a.route }),
  });

  const send = (text: string) => {
    const message = text.trim();
    if (!message || mutation.isPending) return;
    store.add({ role: "user", text: message, lang: language });
    mutation.mutate(message);
  };

  const retry = () => {
    const lastUser = [...store.messages].reverse().find((m) => m.role === "user");
    if (lastUser && !mutation.isPending) mutation.mutate(lastUser.text);
  };

  return {
    messages: store.messages,
    language,
    setLanguage: store.setChatLanguage,
    send,
    retry,
    isSending: mutation.isPending,
    error: mutation.error,
    newChat: () => {
      mutation.reset();
      store.reset();
    },
    isLive: IS_LIVE_CHAT,
  };
}
