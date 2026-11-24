/** The x-01 scroll story: the track's machine comes apart as the claim does (see strategy.md). */
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ScrollSequence, type SequenceCaption } from "@/shared/components/ScrollSequence";
import type { Track } from "@/shared/config/app";
import { trackConfig } from "@/shared/config/tracks";

/** Progress points (0–1) where each caption takes over. */
const CAPTION_AT = [0, 0.36, 0.72] as const;

export function TrackStory({ track, children }: { track: Track; children?: React.ReactNode }) {
  const { t, i18n } = useTranslation("dashboard");
  const { dir, frameCount } = trackConfig(track).sequence;
  const captions = useMemo<SequenceCaption[]>(
    () =>
      CAPTION_AT.map((at, i) => ({
        at,
        title: t(`story.${track}.${i}.title`),
        body: t(`story.${track}.${i}.body`),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recompute when language changes
    [t, track, i18n.language],
  );
  return (
    <ScrollSequence
      dir={dir}
      frameCount={frameCount}
      label={t(`story.${track}.alt`)}
      captions={captions}
    >
      {children}
    </ScrollSequence>
  );
}
