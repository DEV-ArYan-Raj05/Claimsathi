/** Password field with a show/hide toggle (48 px tap target, translated aria-label). */
import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Input } from "@/shared/ui/field";

export const PasswordInput = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, "type">
>(function PasswordInput(props, ref) {
  const { t } = useTranslation("auth");
  const [isVisible, setIsVisible] = useState(false);
  const Icon = isVisible ? EyeOff : Eye;
  return (
    <div className="relative">
      <Input ref={ref} type={isVisible ? "text" : "password"} className="pr-14" {...props} />
      <button
        type="button"
        onClick={() => setIsVisible((v) => !v)}
        aria-label={t(isVisible ? "password.hide" : "password.show")}
        aria-pressed={isVisible}
        aria-controls={props.id}
        className="absolute inset-y-0 right-0 grid w-12 min-h-tap place-items-center rounded-r-xl text-ink/70 hover:text-ink"
      >
        <Icon aria-hidden className="h-5 w-5" />
      </button>
    </div>
  );
});
