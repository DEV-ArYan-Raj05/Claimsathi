/**
 * S-01 Landing. Each track card carries its own data-track so it renders in that track's
 * theme on the same page. The heavy scroll sequences live on x-01, not here, to keep S-01 light.
 */
import { ArrowRight, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Logo } from "@/shared/components/Navigation";
import { LanguageToggle } from "@/shared/components/LanguageToggle";
import { TRACKS } from "@/shared/config/app";
import { trackConfig } from "@/shared/config/tracks";
import { useSession } from "@/shared/lib/session";
import { usePrefs } from "@/shared/lib/prefs";

const STEPS = ["read", "check", "track"] as const;

export function S01LandingPage() {
  const { t } = useTranslation("landing");
  const isSignedIn = useSession((s) => s.isSignedIn);
  const setLastTrack = usePrefs((s) => s.setLastTrack);

  return (
    <div className="on-dominant min-h-screen">
      <header className="mx-auto flex max-w-shell items-center justify-between px-4 py-3 lg:px-6">
        <Logo className="text-on-dominant" />
        <div className="flex items-center gap-1">
          <LanguageToggle className="text-on-dominant" />
          <Link
            to={isSignedIn ? "/onboarding" : "/login"}
            className="inline-flex min-h-tap items-center rounded-full px-4 text-base font-medium text-on-dominant underline-offset-4 hover:underline"
          >
            {isSignedIn ? t("openApp") : t("signIn")}
          </Link>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-shell px-4 pb-12 pt-10 lg:px-6 lg:pt-20">
          <h1 className="max-w-4xl text-5xl font-extrabold leading-[1.02] text-on-dominant sm:text-7xl">
            {t("hero.title")}
          </h1>
          <p className="mt-6 max-w-2xl text-xl text-caption-on-dominant">{t("hero.body")}</p>
        </section>

        <section
          aria-label={t("tracks.label")}
          className="mx-auto grid max-w-shell gap-4 px-4 pb-16 md:grid-cols-2 lg:px-6"
        >
          {TRACKS.map((track) => (
            <Link
              key={track}
              data-track={track}
              to={isSignedIn ? `/${track}` : "/login"}
              onClick={() => setLastTrack(track)}
              className="group flex flex-col overflow-hidden rounded-3xl bg-secondary text-ink focus-visible:outline-offset-4"
            >
              <div>
                <img
                  src={`${trackConfig(track).sequence.dir}/frame-${String(trackConfig(track).sequence.frameCount).padStart(3, "0")}.webp`}
                  alt=""
                  loading="lazy"
                  width={1280}
                  height={720}
                  className="aspect-video w-full object-cover mix-blend-multiply"
                />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <p className="text-base font-medium text-caption">{t(`tracks.${track}.name`)}</p>
                <h2 className="mt-1 text-3xl font-extrabold">{t(`tracks.${track}.hero`)}</h2>
                <ul className="mt-4 space-y-2">
                  {(["a", "b", "c"] as const).map((k) => (
                    <li key={k} className="flex gap-2 text-base">
                      <Check aria-hidden className="mt-1 h-4 w-4 shrink-0" />
                      {t(`tracks.${track}.${k}`)}
                    </li>
                  ))}
                </ul>
                <span className="mt-6 inline-flex min-h-tap items-center gap-2 self-start rounded-xl bg-dominant px-5 font-medium text-on-dominant">
                  {t(`tracks.${track}.cta`)}
                  <ArrowRight
                    aria-hidden
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  />
                </span>
              </div>
            </Link>
          ))}
        </section>

        <section className="bg-secondary text-ink">
          <div className="mx-auto grid max-w-shell gap-10 px-4 py-16 lg:grid-cols-[1fr_2fr] lg:px-6">
            <h2 className="text-3xl font-extrabold lg:sticky lg:top-10 lg:self-start">
              {t("how.title")}
            </h2>
            <ol className="space-y-10">
              {STEPS.map((s, i) => (
                <li key={s} className="grid grid-cols-[3rem_1fr] gap-4">
                  <span aria-hidden className="text-4xl font-extrabold text-ink/30 tabular-nums">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-2xl font-bold">{t(`how.${s}.title`)}</h3>
                    <p className="mt-2 max-w-prose text-lg">{t(`how.${s}.body`)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <footer className="mx-auto max-w-shell px-4 py-10 text-sm text-caption-on-dominant lg:px-6">
          <p className="max-w-prose">{t("footer.disclaimer")}</p>
        </footer>
      </main>
    </div>
  );
}
