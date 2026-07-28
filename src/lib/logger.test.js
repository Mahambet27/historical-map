import { describe, expect, it } from "vitest";

import { redact, setLogSink, logger } from "./logger.js";

describe("logger", () => {
  it("redacts public tokens and access token query values", () => {
    expect(redact("pk.abcdefghijklmnopqrstuvwxyz")).not.toContain("abcdefghijklmnopqrstuvwxyz");
    expect(redact("x?access_token=secret-value")).toContain("access_token=[redacted]");
  });

  it("sanitizes values before sending them to a sink", () => {
    let event;
    setLogSink((value) => {
      event = value;
    });
    logger.error("failed", { token: "pk.abcdefghijklmnopqrstuvwxyz" });
    expect(JSON.stringify(event)).not.toContain("abcdefghijklmnopqrstuvwxyz");
    setLogSink(null);
  });
});
