/** Client-only preferences (Zustand): last track and UI language. Server data never lives here. */
import { create } from "zustand";
import i18n from "../i18n";
import { isTrack, type Language, type Track } from "../config/app";
import { readStorage, writeStorage } from "./storage";

interface PrefsState {
  language: Language;
  lastTrack: Track;
  setLanguage: (lang: Language) => void;
  setLastTrack: (track: Track) => void;
}

const storedTrack = readStorage("cs.track");

export const usePrefs = create<PrefsState>((set) => ({
  language: i18n.language === "hi" ? "hi" : "en",
  lastTrack: isTrack(storedTrack) ? storedTrack : "health",
  setLanguage: (language) => {
    writeStorage("cs.lang", language);
    void i18n.changeLanguage(language);
    document.documentElement.lang = language;
    set({ language });
  },
  setLastTrack: (lastTrack) => {
    writeStorage("cs.track", lastTrack);
    set({ lastTrack });
  },
}));
