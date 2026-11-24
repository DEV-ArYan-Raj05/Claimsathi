/** i18next with one namespace per feature: locales/{en,hi}/<feature>.json (rules.md §17). */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { readStorage } from "../lib/storage";

type Messages = Record<string, unknown>;
const files = import.meta.glob<Messages>("../../locales/*/*.json", {
  eager: true,
  import: "default",
});

const resources: Record<string, Record<string, Messages>> = {};
for (const [path, messages] of Object.entries(files)) {
  const match = /locales\/(\w+)\/([\w-]+)\.json$/.exec(path);
  if (!match) continue;
  const [, lang = "en", ns = "common"] = match;
  resources[lang] ??= {};
  resources[lang][ns] = messages;
}

void i18n.use(initReactI18next).init({
  resources,
  lng: readStorage("cs.lang") === "hi" ? "hi" : "en",
  fallbackLng: "en",
  defaultNS: "common",
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
