import { Mic, MicOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { usePrefs } from "@/shared/lib/prefs";
import { canListen, useSpeech } from "../hooks/useSpeech";

/** Mic next to a text field: speak, and the words land in the field (x-05 dictation). */
export function DictateButton({
  onText,
  fieldLabel,
}: {
  onText: (text: string) => void;
  fieldLabel: string;
}) {
  const { t } = useTranslation("voice");
  const lang = usePrefs((s) => s.language);
  const { isListening, listen, stop } = useSpeech(lang);
  if (!canListen()) return null;
  return (
    <button
      type="button"
      aria-label={t(isListening ? "dictate.stop" : "dictate.start", { field: fieldLabel })}
      aria-pressed={isListening}
      onClick={() => (isListening ? stop() : listen(onText))}
      className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border-2 border-ink/20 text-ink"
    >
      {isListening ? (
        <MicOff aria-hidden className="h-5 w-5" />
      ) : (
        <Mic aria-hidden className="h-5 w-5" />
      )}
    </button>
  );
}
