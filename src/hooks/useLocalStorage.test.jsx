import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import useLocalStorage from "./useLocalStorage.js";

describe("useLocalStorage", () => {
  it("loads and persists JSON values", () => {
    localStorage.setItem("favorites", JSON.stringify(["one"]));
    const { result } = renderHook(() => useLocalStorage("favorites", []));
    expect(result.current[0]).toEqual(["one"]);
    act(() => result.current[1](["one", "two"]));
    expect(JSON.parse(localStorage.getItem("favorites"))).toEqual(["one", "two"]);
  });
});
