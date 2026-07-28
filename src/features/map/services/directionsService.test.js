import { describe, expect, it, vi } from "vitest";

import { fetchDrivingRoute } from "./directionsService.js";

describe("directions service", () => {
  it("maps the first route and passes AbortSignal", async () => {
    const controller = new AbortController();
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          routes: [
            {
              geometry: {
                coordinates: [
                  [1, 2],
                  [3, 4],
                ],
              },
              distance: 1200,
              duration: 90,
            },
          ],
        }),
    });
    const result = await fetchDrivingRoute({
      from: [1, 2],
      to: [3, 4],
      token: "pk.test",
      signal: controller.signal,
      fetchImpl,
    });
    expect(result).toEqual({
      coordinates: [
        [1, 2],
        [3, 4],
      ],
      distance: 1200,
      duration: 90,
    });
    expect(fetchImpl.mock.calls[0][1].signal).toBe(controller.signal);
    expect(String(fetchImpl.mock.calls[0][0])).toContain("access_token=pk.test");
  });

  it("throws a safe status error", async () => {
    await expect(
      fetchDrivingRoute({
        from: [1, 2],
        to: [3, 4],
        token: "pk.test",
        fetchImpl: vi.fn().mockResolvedValue({ ok: false, status: 429 }),
      })
    ).rejects.toThrow("Directions request failed (429)");
  });
});
