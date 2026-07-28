import { describe, expect, it } from "vitest";

import { validateMapboxToken } from "./mapboxService.js";

describe("Mapbox token validation", () => {
  it("requires a non-empty public token", () => {
    expect(validateMapboxToken("")).toContain("missing");
    expect(validateMapboxToken("sk.secret")).toContain("public");
    expect(validateMapboxToken("pk.public")).toBe("");
  });
});
