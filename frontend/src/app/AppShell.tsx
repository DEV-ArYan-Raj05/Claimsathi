/** Signed-in shell: top bar with track switcher, sidebar (desktop) / bottom nav (mobile), voice sheet. */
import { Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import { Outlet } from "react-router-dom";
import { VoiceSheet } from "@/features/voice";
import { BottomNav, SideNav, TopBar } from "@/shared/components/Navigation";
import { SkeletonList } from "@/shared/components/Skeleton";
import { OfflineBanner } from "@/shared/components/StateViews";

export function AppShell() {
  const { t } = useTranslation();
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[70] focus:rounded-lg focus:bg-secondary focus:p-3 focus:text-ink"
      >
        {t("nav.skip")}
      </a>
      <div className="sticky top-0 z-40 print:hidden">
        <TopBar />
        <OfflineBanner />
      </div>
      <div className="mx-auto flex max-w-shell gap-6 px-4 pt-4 lg:px-6">
        <div className="hidden lg:block print:hidden">
          <SideNav onVoice={() => setIsVoiceOpen(true)} />
        </div>
        <main id="main" className="min-w-0 flex-1">
          <Suspense fallback={<SkeletonList />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <div className="print:hidden">
        <BottomNav onVoice={() => setIsVoiceOpen(true)} />
      </div>
      <VoiceSheet isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} />
    </div>
  );
}
