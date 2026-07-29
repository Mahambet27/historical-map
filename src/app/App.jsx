import { Suspense, lazy } from "react";
import { I18nProvider } from "./i18n.jsx";
import { useRoute } from "./router.jsx";
import LandingPage from "../pages/LandingPage.jsx";
import SiteLayout from "../components/layout/SiteLayout.jsx";
import ErrorBoundary from "../components/ui/ErrorBoundary.jsx";

const MapExperience = lazy(() => import("../features/map/MapExperience.jsx"));
const TimelinePage = lazy(() => import("../pages/TimelinePage.jsx"));
const CatalogPage = lazy(() => import("../pages/CatalogPage.jsx"));
const EventPage = lazy(() => import("../pages/EventPage.jsx"));
const SectionPage = lazy(() => import("../pages/SectionPage.jsx"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage.jsx"));
const ExhibitionPage = lazy(() => import("../features/exhibition/ExhibitionPage.jsx"));
const ExhibitionDiagnosticsPage = lazy(
  () => import("../features/exhibition/ExhibitionDiagnosticsPage.jsx")
);

const catalogRoutes = {
  "/events": "events",
  "/people": "people",
  "/heritage": "heritage",
  "/routes": "routes",
};

const sectionRoutes = {
  "/museums": "museums",
  "/education": "education",
  "/research": "research",
  "/about": "about",
  "/admin": "admin",
};

function RouteContent() {
  const { path } = useRoute();

  if (path === "/") return <LandingPage />;
  if (path === "/map") {
    return (
      <div className="platform-map-page">
        <Suspense fallback={<MapRouteLoading />}>
          <ErrorBoundary name="map">
            <MapExperience />
          </ErrorBoundary>
        </Suspense>
      </div>
    );
  }
  if (path === "/timeline") return <TimelinePage />;
  if (catalogRoutes[path]) return <CatalogPage type={catalogRoutes[path]} />;
  if (sectionRoutes[path]) return <SectionPage type={sectionRoutes[path]} />;
  if (path.startsWith("/events/")) return <EventPage eventId={path.split("/")[2]} />;
  if (path.startsWith("/people/"))
    return <CatalogPage type="people" detailId={path.split("/")[2]} />;
  if (path.startsWith("/heritage/"))
    return <CatalogPage type="heritage" detailId={path.split("/")[2]} />;
  return <NotFoundPage />;
}

function AppRoutes() {
  const { path } = useRoute();
  if (path === "/exhibition/diagnostics") {
    return (
      <Suspense fallback={<MapRouteLoading />}>
        <ErrorBoundary name="exhibition-diagnostics">
          <ExhibitionDiagnosticsPage />
        </ErrorBoundary>
      </Suspense>
    );
  }
  if (path === "/exhibition") {
    return (
      <Suspense fallback={<MapRouteLoading />}>
        <ErrorBoundary name="exhibition">
          <ExhibitionPage />
        </ErrorBoundary>
      </Suspense>
    );
  }
  return (
    <SiteLayout>
      <Suspense fallback={<MapRouteLoading />}>
        <RouteContent />
      </Suspense>
    </SiteLayout>
  );
}

function MapRouteLoading() {
  return (
    <div className="route-loading" role="status">
      <span className="route-loading__mark">Q</span>
      <div>
        <strong>Загружаем историческую карту</strong>
        <span>Подготавливаем слои и объекты…</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AppRoutes />
    </I18nProvider>
  );
}
