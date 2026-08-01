import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const diagnostics = {
  activeRepository: "local",
  fallbackReason: null,
};
const getSnapshot = vi.fn();

vi.mock("../../../dataAccess/createHistoricalRepository.js", () => ({
  getHistoricalRepository: vi.fn(async () => ({ getSnapshot })),
  retryHistoricalRepository: vi.fn(async () => ({ getSnapshot })),
  getHistoricalRepositoryDiagnostics: vi.fn(() => diagnostics),
  subscribeHistoricalRepositoryDiagnostics: vi.fn(() => () => {}),
}));

import useHistoricalSnapshot from "./useHistoricalSnapshot.js";

describe("P2A query lifecycle", () => {
  beforeEach(() => {
    getSnapshot.mockReset();
  });

  it("an older snapshot request cannot overwrite the newest state", async () => {
    let resolveOld;
    getSnapshot.mockImplementation(({ year }) => {
      if (year === 1465) {
        return new Promise((resolve) => {
          resolveOld = resolve;
        });
      }
      return Promise.resolve({ year, entities: [], geometries: [] });
    });
    const { result, rerender } = renderHook(
      ({ year }) =>
        useHistoricalSnapshot({
          year,
          language: "ru",
          enabled: true,
          debounceMs: 0,
        }),
      { initialProps: { year: 1465 } }
    );
    await waitFor(() => expect(getSnapshot).toHaveBeenCalledTimes(1));
    rerender({ year: 1511 });
    await waitFor(() => expect(result.current.data?.year).toBe(1511));
    resolveOld({ year: 1465, entities: [], geometries: [] });
    await Promise.resolve();
    expect(result.current.data.year).toBe(1511);
  });
});
