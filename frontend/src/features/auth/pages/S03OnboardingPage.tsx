/** S-03 Onboarding: name, place, tracks, WhatsApp verification, opt-ins and consent (DPDP). */
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/shared/components/Navigation";
import { SkeletonList } from "@/shared/components/Skeleton";
import { usePrefs } from "@/shared/lib/prefs";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Checkbox, Field, Input } from "@/shared/ui/field";
import { WhatsAppVerify } from "../components/WhatsAppVerify";
import { useProfile, useUpdateProfile } from "../hooks/useProfile";
import { onboardingSchema, type OnboardingForm } from "../schemas";

export function S03OnboardingPage() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const profile = useProfile();
  const update = useUpdateProfile();
  const setLastTrack = usePrefs((s) => s.setLastTrack);
  const { register, handleSubmit, formState } = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
    values: profile.data && {
      name: profile.data.name,
      state: profile.data.state,
      district: profile.data.district,
      health: profile.data.tracks.includes("health"),
      crop: profile.data.tracks.includes("crop"),
      storage_consent: profile.data.is_onboarded as true,
      call_consent: profile.data.call_consent,
      whatsapp_opt_in: profile.data.whatsapp_opt_in,
    },
  });
  const isVerified = Boolean(profile.data?.whatsapp_verified_at);
  const err = (key: keyof OnboardingForm) =>
    formState.errors[key] ? t(`onboarding.errors.${key}`) : undefined;

  const onSubmit = handleSubmit(async (v) => {
    const tracks = (["health", "crop"] as const).filter((x) => v[x]);
    const first = tracks[0] ?? "health";
    await update.mutateAsync({
      name: v.name,
      state: v.state,
      district: v.district,
      tracks,
      call_consent: v.call_consent,
      whatsapp_opt_in: isVerified && v.whatsapp_opt_in,
      last_track: first,
      is_onboarded: true,
    });
    setLastTrack(first);
    navigate(`/${first}`, { replace: true });
  });

  if (profile.isPending)
    return (
      <div className="p-6">
        <SkeletonList />
      </div>
    );

  return (
    <main className="on-dominant mx-auto max-w-xl px-4 py-8">
      <Logo className="text-on-dominant" />
      <h1 className="mt-6 text-4xl font-extrabold text-on-dominant">{t("onboarding.title")}</h1>
      <p className="mt-2 text-caption-on-dominant">{t("onboarding.subtitle")}</p>
      <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-4" noValidate>
        <Card className="space-y-4">
          <Field id="ob-name" label={t("onboarding.name")} error={err("name")}>
            <Input id="ob-name" autoComplete="name" {...register("name")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="ob-state" label={t("onboarding.state")} error={err("state")}>
              <Input id="ob-state" autoComplete="address-level1" {...register("state")} />
            </Field>
            <Field id="ob-district" label={t("onboarding.district")} error={err("district")}>
              <Input id="ob-district" autoComplete="address-level2" {...register("district")} />
            </Field>
          </div>
        </Card>
        <Card>
          <fieldset>
            <legend className="text-lg font-bold">{t("onboarding.tracks")}</legend>
            <Checkbox id="ob-health" label={t("onboarding.trackHealth")} {...register("health")} />
            <Checkbox id="ob-crop" label={t("onboarding.trackCrop")} {...register("crop")} />
            {err("crop") && (
              <p role="alert" className="text-sm font-medium">
                {err("crop")}
              </p>
            )}
          </fieldset>
        </Card>
        <Card className="space-y-3">
          <h2 className="text-lg font-bold">{t("whatsapp.title")}</h2>
          <p className="text-caption">{t("whatsapp.why")}</p>
          <WhatsAppVerify
            verifiedPhone={profile.data?.whatsapp_verified_at ? profile.data.whatsapp_phone : null}
          />
          <Checkbox
            id="ob-wa"
            disabled={!isVerified}
            label={t("onboarding.waOptIn")}
            hint={isVerified ? undefined : t("onboarding.waOptInLocked")}
            {...register("whatsapp_opt_in")}
          />
        </Card>
        <Card>
          <Checkbox
            id="ob-storage"
            label={t("onboarding.storageConsent")}
            hint={t("onboarding.storageHint")}
            {...register("storage_consent")}
          />
          {err("storage_consent") && (
            <p role="alert" className="text-sm font-medium">
              {err("storage_consent")}
            </p>
          )}
          <Checkbox
            id="ob-calls"
            label={t("onboarding.callConsent")}
            hint={t("onboarding.callHint")}
            {...register("call_consent")}
          />
        </Card>
        <Button
          type="submit"
          variant="primary"
          className="w-full sm:w-auto"
          isBusy={update.isPending}
        >
          {t("onboarding.continue")}
        </Button>
      </form>
    </main>
  );
}
