import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { mapInstances } from "./maplibreTestMock.js";
import { ROUTES_SOURCE, EVENTS_SOURCE, ROUTES_LAYER, EVENTS_LAYER, LABELS_LAYER } from "./atlasHistoricalLayers.js";
import AtlasPage from "../AtlasPage.jsx";
import App from "../../../app/App.jsx";
vi.mock("maplibre-gl", async () => (await import("./maplibreTestMock.js")).mockMapLibre);
vi.mock("../data/atlasHistoricalData.js", async (original) => {
  const actual = await original();
  return { ...actual, buildAtlasHistoricalSnapshot: (year) => {
    const snapshot = actual.buildAtlasHistoricalSnapshot(year);
    // Test-only features exercise the interaction when reviewed records become available.
    const meta = { verificationStatus: "reviewed", sourceIds: [], year: 1465 };
    return { ...snapshot,
      routes: year === 1465 ? [{ ...meta, id: "test-route", names: { ru: "Тестовый маршрут" }, geometry: { type: "LineString", coordinates: [[1, 1], [2, 2]] } }] : [],
      events: year === 1465 ? [{ ...meta, id: "test-event", titles: { ru: "Тестовое событие" }, geojson: { type: "Point", coordinates: [1, 1] } }] : [],
    };
  } };
});
afterEach(() => { cleanup(); window.history.replaceState({}, "", "/"); });

it("opens route/event cards, toggles layers and clears expired data without recreating the map", () => {
  render(<AtlasPage />);
  const map = mapInstances[0];
  const routes = map.getSource(ROUTES_SOURCE), events = map.getSource(EVENTS_SOURCE);
  for (const [layer, id, name] of [[ROUTES_LAYER, "route:test-route", "Тестовый маршрут"], [EVENTS_LAYER, "event:test-event", "Тестовое событие"]]) {
    act(() => map.handlers[`click:${layer}`]({ point: {}, features: [{ properties: { objectId: id } }] }));
    expect(screen.getByRole("heading", { level: 2, name })).toBeInTheDocument();
  }
  for (const [name, layer] of [["Торговые пути", ROUTES_LAYER], ["События и сражения", EVENTS_LAYER], ["Подписи территорий", LABELS_LAYER]]) {
    fireEvent.click(screen.getByRole("switch", { name }));
    expect(map.setLayoutProperty).toHaveBeenCalledWith(layer, "visibility", "none");
    fireEvent.click(screen.getByRole("switch", { name }));
    expect(map.setLayoutProperty).toHaveBeenCalledWith(layer, "visibility", "visible");
  }
  fireEvent.change(screen.getByRole("slider"), { target: { value: "1510" } });
  expect(routes.setData).toHaveBeenLastCalledWith({ type: "FeatureCollection", features: [] });
  expect(events.setData).toHaveBeenLastCalledWith({ type: "FeatureCollection", features: [] });
  expect(screen.queryByRole("complementary", { name: "Карточка объекта" })).not.toBeInTheDocument();
  expect(mapInstances).toHaveLength(1);
  expect(map.getSource(ROUTES_SOURCE)).toBe(routes);
  expect(map.getSource(EVENTS_SOURCE)).toBe(events);
  fireEvent.click(screen.getByRole("button", { name: "EN", exact: true }));
  expect(map.setLayoutProperty).toHaveBeenCalledWith(LABELS_LAYER, "text-field", ["get", "name_en"]);
});

it.each(["/", "/atlas"])("loads %s deep links and handles back/forward without rebuilding map", async (path) => {
  window.history.replaceState({}, "", `${path}?era=saka&year=1510&lang=kk`);
  render(<App />);
  expect(await screen.findByRole("slider")).toHaveValue("1510");
  expect(screen.getByRole("button", { name: "Казахское ханство", exact: true })).toHaveAttribute("aria-pressed", "true");
  expect(window.location.search).toContain("era=kazakh-khanate");
  expect(window.location.search).toContain("lang=kk");
  const map = mapInstances[0];
  act(() => {
    window.history.pushState({}, "", `${path}?era=saka`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  expect(screen.getByRole("slider")).toHaveValue("-550");
  expect(mapInstances).toEqual([map]);
});
