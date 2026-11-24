/**
 * x-10 Voice assistant sheet: mic, live transcript, the conversation, suggested questions.
 * Answers come from POST /api/v1/chat (Sarvam via FastAPI) when the backend is configured,
 * otherwise from the demo keyword assistant (useAssistant).
 */
import { useEffect, useRef, useState } from "react";
import { Mic, Square, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useTrack } from "@/shared/hooks/useTrack";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/field";
import { useAssistant } from "../hooks/useAssistant";
import { canListen, useSpeech } from "../hooks/useSpeech";
import { ChatLanguageSelect } from "./ChatLanguageSelect";
import { ChatThread } from "./ChatThread";

export function VoiceSheet({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t } = useTranslation("voice");
  const track = useTrack();
  const navigate = useNavigate();
  const assistant = useAssistant();
  const { transcript, setTranscript, isListening, listen, stop, speak } = useSpeech(
    assistant.language,
  );
  const [typed, setTyped] = useState("");
  const closeRef = useRef<HTMLButtonElement>(null);
  const suggestions = t(`suggestions.${track}`, { returnObjects: true }) as string[];
  const lastMessage = assistant.messages.at(-1);

  // Read each new answer aloud (once) in the reply language.
  const spokenId = useRef<string | null>(null);
  useEffect(() => {
    if (!isOpen || lastMessage?.role !== "assistant" || spokenId.current === lastMessage.id) return;
    spokenId.current = lastMessage.id;
    speak(lastMessage.text);
  }, [isOpen, lastMessage, speak]);

  useEffect(() => {
    if (!isOpen) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  const ask = (text: string) => {
    if (!text.trim()) return;
    setTranscript("");
    assistant.send(text);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="voice-title"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-t-3xl bg-secondary p-6 text-ink sm:rounded-3xl motion-safe:animate-[fadeIn_200ms_ease-out]"
      >
        <div className="flex items-center justify-between">
          <h2 id="voice-title" className="text-2xl font-bold">
            {t("title")}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="grid h-12 w-12 place-items-center rounded-full"
          >
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <ChatLanguageSelect value={assistant.language} onChange={assistant.setLanguage} />
          {assistant.messages.length > 0 && (
            <Button variant="quiet" onClick={assistant.newChat}>
              {t("chat.newChat")}
            </Button>
          )}
        </div>
        <ChatThread
          messages={assistant.messages}
          isSending={assistant.isSending}
          error={assistant.error}
          onRetry={assistant.retry}
          onGo={(route) => {
            navigate(route);
            onClose();
          }}
        />
        <div className="flex flex-col items-center gap-3 py-2">
          {canListen() ? (
            <button
              type="button"
              aria-pressed={isListening}
              onClick={() => (isListening ? stop() : listen(ask))}
              aria-label={t(isListening ? "stop" : "speak")}
              className="grid h-20 w-20 place-items-center rounded-full bg-ink text-secondary"
            >
              {isListening ? (
                <Square aria-hidden className="h-7 w-7" />
              ) : (
                <Mic aria-hidden className="h-8 w-8" />
              )}
            </button>
          ) : (
            <p className="text-caption">{t("noMic")}</p>
          )}
          <p aria-live="polite" className="min-h-[1.5rem] text-center text-lg">
            {transcript || (isListening ? t("listening") : t("prompt"))}
          </p>
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            ask(typed);
            setTyped("");
          }}
        >
          <label htmlFor="voice-typed" className="sr-only">
            {t("typeLabel")}
          </label>
          <Input
            id="voice-typed"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={t("typeLabel")}
          />
          <Button type="submit" variant="solid" isBusy={assistant.isSending}>
            {t("ask")}
          </Button>
        </form>
        {assistant.messages.length === 0 && (
          <div>
            <p className="text-sm text-caption">{t("tryThese")}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => ask(s)}
                  className="min-h-tap rounded-full bg-ink/10 px-4 text-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {!assistant.isLive && <p className="text-sm text-caption">{t("chat.demoNote")}</p>}
      </div>
    </div>
  );
}
