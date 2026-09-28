import { describe, expect, it } from "vitest";
import { buildExhibitionSnapshot, createFallbackViewModel, snapshotTerritories } from "./exhibitionSnapshot.js";
import { getFallbackEntitiesAtYear } from "./mapDataUtils.js";
import { getEntityLabelsAtYear } from "../../data/exhibition/entityLabels.js";
import { entityGeometries } from "../../data/exhibition/entityGeometries.js";
import { environmentSnapshots } from "../../data/exhibition/environmentSnapshots.js";
import { hydrologySnapshots } from "../../data/exhibition/hydrologySnapshots.js";
import { historicalRiverSnapshots } from "../../data/exhibition/historicalRiverSnapshots.js";
import { historicalSettlements } from "../../data/exhibition/historicalSettlements.js";
import { historicalRoutes } from "../../data/exhibition/historicalRoutes.js";
import { routeSegments } from "../../data/exhibition/routeSegments.js";
import { buildEnvironmentCollection, buildHistoricalPlaceCollections, buildHydrologyCollection, buildRouteCollections } from "./p1bMapDataUtils.js";
import { isRecordAllowedInOfficialDemo } from "./officialDemoMode.js";

const data = {
  environmentSnapshots,
  hydrologySnapshots: [...hydrologySnapshots, ...historicalRiverSnapshots],
  historicalSettlements, historicalRoutes, routeSegments,
};
const years = [...new Set([
  -550, 100, 1465, 1511, 1521, 1960, 1985, 2000, 2010, 2026,
  ...entityGeometries.flatMap((record) => [record.validFromYear - 1, record.validFromYear, record.validToYear, record.validToYear == null ? null : record.validToYear + 1]),
])].filter((year) => year != null && year !== 0);

describe("main SVG snapshot adapter regression", () => {
  it.each(years)("preserves existing layers and source order at year %s", (year) => {
    const snapshot = buildExhibitionSnapshot(year, data);
    expect(snapshotTerritories(snapshot)).toEqual(getFallbackEntitiesAtYear(year));
    expect(snapshot.labels).toEqual(getEntityLabelsAtYear(year));
    for (const language of ["ru", "kk", "en"]) {
      for (const officialDemo of [false, true]) {
        const selectedEntityId = "kazakh-khanate";
        const view = createFallbackViewModel(snapshot, { language, officialDemo, selectedEntityId });
        const original = getFallbackEntitiesAtYear(year)
          .filter(({ geometry }) => !officialDemo || isRecordAllowedInOfficialDemo(geometry))
          .sort((a, b) => Number(a.entity.id === selectedEntityId) - Number(b.entity.id === selectedEntityId));
        expect(view.territories).toEqual(original);
        expect(view.environment).toEqual(buildEnvironmentCollection(data.environmentSnapshots, year, language));
        expect(view.hydrology).toEqual(buildHydrologyCollection(data.hydrologySnapshots, year, language));
        expect(view.places).toEqual(buildHistoricalPlaceCollections(historicalSettlements, year, language));
        expect(view.routes).toEqual(buildRouteCollections(historicalRoutes, routeSegments, year, language));
      }
    }
  });

  it("keeps absent optional layers empty instead of loading extra local data", () => {
    const snapshot = buildExhibitionSnapshot(1465);
    const view = createFallbackViewModel(snapshot, { language: "ru" });
    expect(view.environment.features).toEqual([]);
    expect(view.hydrology.features).toEqual([]);
    expect(view.places.places.features).toEqual([]);
    expect(view.routes.trade.features).toEqual([]);
  });
});
