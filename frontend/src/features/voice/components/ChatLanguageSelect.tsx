/** Reply language for the assistant (22 Indian languages + English), remembered on this device. */
import { useTranslation } from "react-i18next";
import { Select } from "@/shared/ui/field";
import { CHAT_LANGUAGES, isChatLanguage, type ChatLanguage } from "../languages";

export function ChatLanguageSelect({
  value,
  onChange,
}: {
  value: ChatLanguage;
  onChange: (lang: ChatLanguage) => void;
}) {
  const { t } = useTranslation("voice");
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="chat-lang" className="shrink-0 text-sm font-medium">
        {t("chat.language")}
      </label>
      <Select
        id="chat-lang"
        value={value}
        onChange={(e) => isChatLanguage(e.target.value) && onChange(e.target.value)}
        className="min-h-tap py-2"
      >
        {CHAT_LANGUAGES.map((l) => (
          <option key={l.code} value={l.code} lang={l.code}>
            {l.name}
          </option>
        ))}
      </Select>
    </div>
  );
}
