import { useParams } from "react-router-dom";
import { isTrack, type Track } from "../config/app";
import { usePrefs } from "../lib/prefs";

/** Current track from the URL (/health/…, /crop/…), falling back to the last one used. */
export function useTrack(): Track {
  const { track } = useParams();
  const last = usePrefs((s) => s.lastTrack);
  return isTrack(track) ? track : last;
}
