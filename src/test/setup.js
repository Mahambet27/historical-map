import "@testing-library/jest-dom/vitest";

import { afterEach, vi } from "vitest";

afterEach(() => {
  if (typeof localStorage !== "undefined") {
    localStorage.clear();
  }

  vi.restoreAllMocks();
});