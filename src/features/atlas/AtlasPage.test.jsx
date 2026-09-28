import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import AtlasPage from "./AtlasPage.jsx";
import App from "../../app/App.jsx";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  window.history.replaceState({}, "", "/");
});
const map = () => screen.getByRole("region", { name: "Карта" });
describe("isolated atlas prototype", () => {
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
    fireEvent.change(search, { target: { value: "Berel" } });
    expect(
      within(map()).getByRole("button", { name: "Выбранный объект: Берел" })
    ).toBeInTheDocument();
    expect(
      within(map()).queryByRole("button", { name: "Выбранный объект: Отырар" })
    ).not.toBeInTheDocument();
    fireEvent.change(search, { target: { value: "xyz123" } });
    expect(screen.getByText("Ничего не найдено")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Очистить поиск" }));
    expect(
      within(map()).getByRole("button", { name: "Выбранный объект: Отырар" })
    ).toBeInTheDocument();
  });
  it("selects a marker and closes its object card", () => {
    render(<AtlasPage />);
    fireEvent.click(within(map()).getByRole("button", { name: "Выбранный объект: Берел" }));
    expect(screen.getByRole("heading", { name: "Берел" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Закрыть: Берел" }));
    expect(
      screen.queryByRole("complementary", { name: "Карточка объекта" })
    ).not.toBeInTheDocument();
    expect(within(map()).getByRole("button", { name: "Выбранный объект: Берел" })).toHaveFocus();
  });
  it("changes the year and era including BCE", () => {
    render(<AtlasPage />);
    fireEvent.change(screen.getByRole("slider"), { target: { value: "-1500" } });
    expect(screen.getByRole("slider")).toHaveValue("-1500");
    expect(screen.getByRole("heading", { level: 1, name: "Бронзовый век" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Тюркская эпоха" }));
    expect(screen.getByRole("slider")).toHaveValue("552");
  });
  it("toggles visible layers and category markers", () => {
    render(<AtlasPage />);
    fireEvent.click(screen.getByRole("switch", { name: "Торговые пути" }));
    expect(screen.queryByTestId("atlas-trade-layer")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: "Курганы" }));
    expect(
      within(map()).queryByRole("button", { name: "Выбранный объект: Берел" })
    ).not.toBeInTheDocument();
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
