import { describe, expect, it, vi } from "vitest";

import {
  getQualityProfile,
  getRequestedQualityMode,
  rafThrottle,
  selectQualityMode,
} from "./mapPerformance.js";

describe("map performance mode", () => {
  it("accepts supported query modes and rejects unknown modes", () => {
    expect(getRequestedQualityMode("?quality=light")).toBe("light");
    expect(getRequestedQualityMode("?quality=extreme")).toBe("auto");
  });

  it("respects an explicit mode", () => {
    expect(selectQualityMode({ requested: "high", width: 360, saveData: true })).toBe("high");
  });

  it("selects light for constrained devices", () => {
    expect(
      selectQualityMode({
        requested: "auto",
        width: 390,
        deviceMemory: 4,
        hardwareConcurrency: 4,
      })
    ).toBe("light");
  });

  it("selects balanced for tablets and high for capable desktops", () => {
    expect(selectQualityMode({ requested: "auto", width: 900 })).toBe("balanced");
    expect(
      selectQualityMode({
        requested: "auto",
        width: 1440,
        deviceMemory: 16,
        hardwareConcurrency: 12,
        effectiveType: "4g",
      })
    ).toBe("high");
    expect(getQualityProfile({ requested: "light" }).terrainExaggeration).toBe(0);
  });

  it("throttles work to one animation frame", () => {
    let scheduled;
    vi.stubGlobal("requestAnimationFrame", (callback) => {
      scheduled = callback;
      return 1;
    });
    const callback = vi.fn();
    const throttled = rafThrottle(callback);
    throttled(1);
    throttled(2);
    expect(callback).not.toHaveBeenCalled();
    scheduled();
    expect(callback).toHaveBeenCalledWith(1);
  });
});
