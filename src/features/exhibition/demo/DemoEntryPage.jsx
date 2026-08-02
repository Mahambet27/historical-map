import { lazy, Suspense, useEffect, useState } from "react";
import { useI18n } from "../../../app/i18n.jsx";
import { EXHIBITION_RELEASE } from "../../../config/exhibitionRelease.js";
import { bootstrapOfficialDemo, createInitialDemoBootState } from "./demoBootstrap.js";
import { parseDemoParams } from "./demoRoute.js";
import ExhibitionStartupScreen from "./ExhibitionStartupScreen.jsx";

const ExhibitionPage = lazy(() => import("../ExhibitionPage.jsx"));
const ExhibitionCacheRecoveryPanel = lazy(
  () => import("./ExhibitionCacheRecoveryPanel.jsx")
);

export default function DemoEntryPage() {
  const params = parseDemoParams();
  const { language, setLanguage } = useI18n();
  const [boot, setBoot] = useState(createInitialDemoBootState);
  const [started, setStarted] = useState(false);
  const [recovery, setRecovery] = useState(params.recovery);

  const check = () => {
    setBoot((current) => ({ ...current, status: "checking-assets" }));
    bootstrapOfficialDemo({
      mockDeviceProfile: new URLSearchParams(window.location.search).get(
        "mockDevice"
      ),
    }).then((next) => {
      setBoot(next);
      if (params.language && params.language !== language) {
        setLanguage(params.language);
      }
    });
  };

  useEffect(() => {
    let active = true;
    bootstrapOfficialDemo({
      mockDeviceProfile: new URLSearchParams(window.location.search).get(
        "mockDevice"
      ),
    }).then((next) => {
      if (!active) return;
      setBoot(next);
      if (params.kiosk && next.status !== "fatal") {
        window.setTimeout(() => {
          if (active) setStarted(true);
        }, 1200);
      }
    });
    return () => {
      active = false;
    };
  }, [params.kiosk]);

  if (!started) {
    return (
      <>
        <ExhibitionStartupScreen
          boot={boot}
          language={params.language || language}
          onStart={() => setStarted(true)}
          onLightMode={() =>
            setBoot((current) => ({ ...current, quality: "light" }))
          }
          onHealthCheck={check}
          onRecovery={() => setRecovery(true)}
        />
        {recovery && (
          <Suspense fallback={null}>
            <ExhibitionCacheRecoveryPanel
              onClose={() => setRecovery(false)}
            />
          </Suspense>
        )}
      </>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="route-loading" role="status">
          Qazaq Heritage Map · {EXHIBITION_RELEASE.version}
        </div>
      }
    >
      <ExhibitionPage
        forceOfficialDemo
        demoBoot={boot}
        initialForceSvgFallback={boot.forceSvgFallback}
        recordingMode={params.recording}
        kioskMode={params.kiosk}
        projectorMode={params.projector}
        onOpenRecovery={() => setRecovery(true)}
      />
      {recovery && (
        <ExhibitionCacheRecoveryPanel onClose={() => setRecovery(false)} />
      )}
    </Suspense>
  );
}
