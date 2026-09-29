import { expect, it } from "vitest";
import { atlasHistoricalOverlays, atlasOverlayCards } from "./atlasHistoricalOverlays.js";
import { buildAtlasHistoricalSnapshot } from "./atlasHistoricalData.js";

// Technical fixtures only; no synthetic records enter the historical datasets.
const base = { year: 10, verificationStatus: "reviewed", confidenceLevel: "low", sourceIds: ["test-source"] };
const route = { ...base, id: "test-route", names: { en: "Test route" }, segmentIds: ["test-segment"] };
const segment = { ...base, id: "test-segment", routeId: route.id,
  geometry: { type: "Feature", properties: { reconstruction: true }, geometry: { type: "LineString", coordinates: [[1, 1], [2, 2]] } } };
const event = { ...base, id: "test-event", eventType: "battle", titles: { en: "Test event" },
  geojson: { type: "Point", coordinates: [1, 1] } };
const snapshot = { year: 10, routes: [route], routeSegments: [segment], events: [event], metadata: { sources: [{ id: "test-source", title: "Test source" }] } };

it("preserves reviewed line/point geometry and evidence and adapts existing cards", () => {
  const overlays = atlasHistoricalOverlays(snapshot);
  expect(overlays.routes.features[0].geometry).toEqual(segment.geometry.geometry);
  expect(overlays.routes.features[0].properties.sourceIds).toEqual(base.sourceIds);
  expect(overlays.events.features[0].geometry).toEqual(event.geojson);
  const cards = atlasOverlayCards(snapshot, overlays);
  expect(cards.map((r) => r.id)).toEqual(["route:test-route", "event:test-event"]);
  expect(cards[0]).toMatchObject({ reconstruction: true, sources: [{ title: "Test source" }] });
  overlays.routes.features[0].geometry.coordinates[0][0] = 50;
  expect(segment.geometry.geometry.coordinates[0]).toEqual([1, 1]);
});

it("requires both route and segment review and rejects unreviewed, expired or invalid events", () => {
  expect(atlasHistoricalOverlays({ ...snapshot, routes: [{ ...route, verificationStatus: "needs_review" }] }).routes.features).toEqual([]);
  expect(atlasHistoricalOverlays({ ...snapshot, routeSegments: [{ ...segment, verificationStatus: undefined }] }).routes.features).toEqual([]);
  expect(atlasHistoricalOverlays({ ...snapshot, year: 11 }).events.features).toEqual([]);
  for (const invalid of [
    { ...event, verificationStatus: undefined }, { ...event, geojson: null },
    { ...event, geojson: { type: "Point", coordinates: [999, 1] } },
  ]) expect(atlasHistoricalOverlays({ ...snapshot, events: [invalid] }).events.features).toEqual([]);
});

it("does not fabricate current production route/event features", () => {
  for (const year of [-550, 552, 1465, 1511, 1936, 1991]) {
    const actual = atlasHistoricalOverlays(buildAtlasHistoricalSnapshot(year));
    expect(actual.routes.features).toEqual([]);
    expect(actual.events.features).toEqual([]);
  }
});
