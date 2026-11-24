/**
 * Speech in/out for x-10. Uses the browser's Web Speech API where present (Chrome on Android
 * supports hi-IN). TODO(PRD §3.6): route audio through POST /voice/transcribe (Sarvam) when the
 * backend is live, for phones without built-in recognition.
 */
import { useCallback, useRef, useState } from "react";

interface RecognitionResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
}

interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: RecognitionResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

type RecognitionCtor = new () => Recognition;

/** "en" / "hi" (app language) or a BCP-47 code such as ta-IN (assistant language). */
const BCP47: Record<string, string> = { en: "en-IN", hi: "hi-IN", "od-IN": "or-IN" };
const toBcp47 = (lang: string) => BCP47[lang] ?? lang;

function getCtor(): RecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const canListen = () => getCtor() !== null;

export function useSpeech(lang: string) {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const ref = useRef<Recognition | null>(null);

  const listen = useCallback(
    (onFinal?: (text: string) => void) => {
      const Ctor = getCtor();
      if (!Ctor) return;
      const rec = new Ctor();
      rec.lang = toBcp47(lang);
      rec.interimResults = true;
      rec.continuous = false;
      rec.onresult = (e) => {
        const parts = Array.from(e.results);
        const text = parts.map((r) => r[0]?.transcript ?? "").join(" ");
        setTranscript(text);
        if (parts.at(-1)?.isFinal) onFinal?.(text);
      };
      rec.onend = () => setIsListening(false);
      rec.onerror = () => setIsListening(false);
      ref.current = rec;
      setTranscript("");
      setIsListening(true);
      rec.start();
    },
    [lang],
  );

  const stop = useCallback(() => ref.current?.stop(), []);

  const speak = useCallback(
    (text: string) => {
      if (!("speechSynthesis" in window)) return;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = toBcp47(lang);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    },
    [lang],
  );

  return { transcript, setTranscript, isListening, listen, stop, speak };
}
