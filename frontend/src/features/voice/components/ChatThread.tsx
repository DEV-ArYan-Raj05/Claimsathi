/** x-10 conversation: the user's questions, the assistant's answers, thinking and error states. */
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ApiError } from "@/shared/lib/apiClient";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { isRtl } from "../languages";
import type { ChatMessage } from "../store";

const KNOWN_ERRORS = [
  "CHAT_RATE_LIMITED",
  "CHAT_NOT_CONFIGURED",
  "CHAT_PROVIDER_AUTH",
  "CHAT_PROVIDER_CREDITS",
  "CHAT_TIMEOUT",
  "CHAT_UNREACHABLE",
  "CHAT_UNAVAILABLE",
  "CHAT_BAD_REQUEST",
  "AUTH_REQUIRED",
  "AUTH_INVALID",
  "AUTH_NOT_CONFIGURED",
  "AUTH_UNAVAILABLE",
  "VALIDATION_ERROR",
  "OFFLINE",
];

function ErrorNotice({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const { t } = useTranslation("voice");
  const code = error instanceof ApiError ? error.code : undefined;
  const isNetwork = error instanceof TypeError; // fetch() couldn't reach the backend at all
  const key = code && KNOWN_ERRORS.includes(code) ? code : isNetwork ? "BACKEND_DOWN" : "generic";
  return (
    <div role="alert" className="space-y-2 rounded-2xl bg-ink/5 p-4">
      <p className="text-base font-medium">{t(`chat.errors.${key}`)}</p>
      {code && <p className="text-sm text-caption">{t("chat.errorCode", { code })}</p>}
      <Button variant="outline" onClick={onRetry}>
        {t("chat.retry")}
      </Button>
    </div>
  );
}

export function ChatThread({
  messages,
  isSending,
  error,
  onRetry,
  onGo,
}: {
  messages: ChatMessage[];
  isSending: boolean;
  error: unknown;
  onRetry: () => void;
  onGo: (route: string) => void;
}) {
  const { t } = useTranslation("voice");
  const endRef = useRef<HTMLDivElement>(null);
  const last = messages.at(-1);
  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: "end" });
  }, [messages.length, isSending, error]);

  return (
    <div className="max-h-[45vh] space-y-3 overflow-y-auto pr-1">
      <ol aria-label={t("chat.conversation")} aria-live="polite" className="space-y-3">
        {messages.map((m) => (
          <li
            key={m.id}
            className={cn("flex flex-col", m.role === "user" ? "items-end" : "items-start")}
          >
            <span className="sr-only">{t(m.role === "user" ? "chat.you" : "chat.assistant")}</span>
            <p
              lang={m.lang}
              dir={isRtl(m.lang) ? "rtl" : undefined}
              className={cn(
                "max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-3 text-base",
                m.role === "user" ? "bg-ink text-secondary" : "bg-ink/5 text-ink",
              )}
            >
              {m.text}
            </p>
            {m.role === "assistant" && m.route && m === last && (
              <Button variant="solid" className="mt-2" onClick={() => onGo(m.route ?? "/")}>
                {t("go")}
              </Button>
            )}
          </li>
        ))}
      </ol>
      {isSending && (
        <p role="status" className="w-fit rounded-2xl bg-ink/5 px-4 py-3 text-base">
          <span className="motion-safe:animate-pulse">{t("chat.thinking")}</span>
        </p>
      )}
      {!isSending && error !== null && <ErrorNotice error={error} onRetry={onRetry} />}
      <div ref={endRef} />
    </div>
  );
}
