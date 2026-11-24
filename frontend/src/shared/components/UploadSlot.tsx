/**
 * Camera + file picker for one checklist item (PRD §4.2). Validates by magic bytes, shrinks
 * photos on-device, and queues uploads while offline ("waiting for network").
 */
import { useEffect, useId, useRef, useState } from "react";
import { Camera, CloudOff, Loader2, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import { compressImage, validateFile } from "../lib/files";
import { useOnline } from "../hooks/useOnline";
import { cn } from "../lib/cn";

interface UploadSlotProps {
  label: string;
  onUpload: (file: Blob, name: string) => Promise<void>;
  compact?: boolean;
  isBusy?: boolean;
}

export function UploadSlot({ label, onUpload, compact = false, isBusy = false }: UploadSlotProps) {
  const { t } = useTranslation();
  const id = useId();
  const isOnline = useOnline();
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [queued, setQueued] = useState<{ blob: Blob; name: string } | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const send = async (blob: Blob, name: string) => {
    setIsSending(true);
    try {
      await onUpload(blob, name);
      setQueued(null);
    } finally {
      setIsSending(false);
    }
  };

  // Flush the queued upload as soon as the network is back.
  useEffect(() => {
    if (isOnline && queued && !isSending) void send(queued.blob, queued.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- send is stable enough for a one-shot flush
  }, [isOnline, queued]);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setProblem(null);
    const result = await validateFile(file);
    if ("problem" in result) {
      setProblem(t(`upload.problem.${result.problem}`));
      return;
    }
    const blob = await compressImage(file, result.kind);
    if (!navigator.onLine) setQueued({ blob, name: file.name });
    else await send(blob, file.name);
  };

  const busy = isBusy || isSending;
  const btn =
    "inline-flex min-h-tap flex-1 whitespace-nowrap items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink/30 px-3 text-sm font-medium text-ink hover:border-ink/60 disabled:opacity-50";

  return (
    <div className={cn("w-full space-y-2", compact && "max-w-sm space-y-1")}>
      <p className="sr-only" id={`${id}-label`}>
        {label}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          className={btn}
          disabled={busy}
          onClick={() => cameraRef.current?.click()}
          aria-describedby={`${id}-label`}
        >
          {busy ? (
            <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
          ) : (
            <Camera aria-hidden className="h-4 w-4" />
          )}
          {t("upload.camera")}
        </button>
        <button
          type="button"
          className={btn}
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          aria-describedby={`${id}-label`}
        >
          <Upload aria-hidden className="h-4 w-4" />
          {t("upload.file")}
        </button>
      </div>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => void pick(e.target.files?.[0])}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/heic,application/pdf"
        className="hidden"
        onChange={(e) => void pick(e.target.files?.[0])}
      />
      {queued && (
        <p role="status" className="flex items-center gap-1.5 text-sm text-ink">
          <CloudOff aria-hidden className="h-4 w-4" />
          {t("upload.waiting", { name: queued.name })}
        </p>
      )}
      {problem && (
        <p role="alert" className="text-sm font-medium text-ink">
          {problem}
        </p>
      )}
    </div>
  );
}
