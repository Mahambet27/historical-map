import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import AtlasPage from "./AtlasPage.jsx";
import App from "../../app/App.jsx";
import AtlasObjectCard from "./components/AtlasObjectCard.jsx";
import { atlasText } from "./data/atlasText.js";
import { adaptAtlasSnapshot } from "./data/atlasSnapshotAdapter.js";
import { mapInstances } from "./map/maplibreTestMock.js";
import { ATLAS_PLACES_SOURCE } from "./map/atlasMapConfig.js";
vi.mock("maplibre-gl", async () => (await import("./map/maplibreTestMock.js")).mockMapLibre);
import { buildHistoricalSnapshot } from "../../domain/history/buildHistoricalSnapshot.js";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  window.history.replaceState({}, "", "/");
});
const features = () => mapInstances[0].getSource(ATLAS_PLACES_SOURCE).data.features;
const clickPoint = (id) =>
  act(() => mapInstances[0].handlers.click({ features: [{ properties: { objectId: id } }] }));
describe("isolated atlas prototype", () => {
  it("updates markers/count and closes an expired selection permanently", () => {
    render(<AtlasPage />);
    fireEvent.change(screen.getByRole("slider"), { target: { value: "1200" } });
    clickPoint("balasagun");
    expect(screen.getByRole("heading", { name: "Баласагун" })).toBeInTheDocument();
    expect(screen.getByText("Объекты: 8")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("slider"), { target: { value: "1465" } });
    expect(
      screen.queryByRole("complementary", { name: "Карточка объекта" })
    ).not.toBeInTheDocument();
    expect(features().some((feature) => feature.id === "balasagun")).toBe(false);
    expect(screen.getByText("Объекты: 6")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("slider"), { target: { value: "1200" } });
    expect(
      screen.queryByRole("complementary", { name: "Карточка объекта" })
    ).not.toBeInTheDocument();
  });
  it("renders snapshot coordinates, source and confidence in the card", () => {
    render(<AtlasPage />);

    expect(
      mapInstances[0]
        .getSource(ATLAS_PLACES_SOURCE)
        .data.features.find((feature) => feature.id === "otrar").geometry.coordinates
    ).toEqual([68.3, 42.85]);
    clickPoint("otrar");
    expect(screen.getByText("The Silk Roads Programme")).toBeInTheDocument();
    expect(screen.getByText("low")).toBeInTheDocument();
    expect(screen.getByText(/42.85° N/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "KK", exact: true }));
    expect(screen.getByRole("heading", { name: "Отырар" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "EN", exact: true }));
    expect(screen.getByRole("heading", { name: "Otrar" })).toBeInTheDocument();
  });
  it("shows honest missing source/confidence fallbacks", () => {
    const snapshot = buildHistoricalSnapshot({
      year: 1000,
      datasetVersion: "test",
      data: { places: [{ id: "unknown" }] },
    });
    render(
      <AtlasObjectCard
        object={adaptAtlasSnapshot(snapshot).objects[0]}
        language="ru"
        text={atlasText.ru}
        onClose={() => {}}
      />
    );
    expect(screen.getByText("Источник пока не указан")).toBeInTheDocument();
    expect(screen.getByText("Не указано")).toBeInTheDocument();
    expect(screen.queryByText(/° N/)).not.toBeInTheDocument();
  });
  it("plays, pauses, stops at the end, and restarts the timeline", () => {
    vi.useFakeTimers();
    render(<AtlasPage />);
    fireEvent.click(screen.getByRole("button", { name: "Воспроизвести" }));
    act(() => vi.advanceTimersByTime(900));
    expect(screen.getByRole("slider")).toHaveValue("1490");
    fireEvent.click(screen.getByRole("button", { name: "Пауза" }));
    act(() => vi.advanceTimersByTime(900));
    expect(screen.getByRole("slider")).toHaveValue("1490");
    fireEvent.change(screen.getByRole("slider"), { target: { value: "2025" } });
    fireEvent.click(screen.getByRole("button", { name: "Воспроизвести" }));
    act(() => vi.advanceTimersByTime(900));
    expect(screen.getByRole("slider")).toHaveValue("2026");
    fireEvent.click(screen.getByRole("button", { name: "Воспроизвести" }));
    expect(screen.getByRole("slider")).toHaveValue("-3000");
  });
  it("renders the actual /atlas route", async () => {
    window.history.replaceState({}, "", "/atlas");
    render(<App />);
    expect(
      await screen.findByRole("heading", { level: 1, name: "Казахское ханство" })
    ).toBeInTheDocument();
  });
  it("filters markers with multilingual search and handles no results", () => {
    render(<AtlasPage />);
    const search = screen.getByRole("searchbox");
    fireEvent.change(search, { target: { value: "Sayram" } });
    expect(features().map((feature) => feature.id)).toEqual(["sayram"]);
    expect(features().some((feature) => feature.id === "otrar")).toBe(false);
    fireEvent.change(search, { target: { value: "xyz123" } });
    expect(screen.getByText("Ничего не найдено")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Очистить поиск" }));
    expect(features().some((feature) => feature.id === "otrar")).toBe(true);
  });
  it("selects a marker and closes its object card", () => {
    render(<AtlasPage />);
    clickPoint("sayram");
    expect(screen.getByRole("heading", { name: "Сайрам" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Закрыть: Сайрам" }));
    expect(
      screen.queryByRole("complementary", { name: "Карточка объекта" })
    ).not.toBeInTheDocument();
    expect(mapInstances[0].getCanvas()).toHaveFocus();
  });
  it("changes the year and era including BCE", () => {
    render(<AtlasPage />);
    fireEvent.change(screen.getByRole("slider"), { target: { value: "-550" } });
    expect(screen.getByRole("slider")).toHaveValue("-550");
    expect(screen.getByRole("heading", { level: 1, name: "Сакская эпоха" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Тюркский период" }));
    expect(screen.getByRole("slider")).toHaveValue("552");
  });
  it("toggles visible layers and category markers", () => {
    render(<AtlasPage />);
    fireEvent.click(screen.getByRole("switch", { name: "Населённые пункты" }));
    expect(features()).toEqual([]);

    expect(features()).toEqual([]);
    expect(screen.getByRole("switch", { name: "3D объекты" })).toBeDisabled();
  });
  it("switches language and closes the about dialog with Escape", () => {
    render(<AtlasPage />);
    fireEvent.click(screen.getByRole("button", { name: "EN", exact: true }));
    expect(screen.getByRole("heading", { level: 1, name: "Kazakh Khanate" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "About" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
