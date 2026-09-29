import { expect, it } from "vitest";
import { atlasYearFromSearch, atlasSearchForYear } from "./atlasLocation.js";

it.each([
  ["", 1465], ["?era=saka", -550], ["?era=turkic", 552],
  ["?era=saka&year=1510", 1510], ["?year=-550", -550],
  ["?era=saka&year=0", -550], ["?era=saka&year=9999", -550],
  ["?year=1.5", 1465], ["?year=Infinity", 1465], ["?era=missing&year=", 1465],
])("resolves %s to %i", (search, year) => expect(atlasYearFromSearch(search)).toBe(year));

it("synchronizes era from year, removes stale era in gaps and preserves unrelated params", () => {
  const params = new URLSearchParams(atlasSearchForYear("?era=saka&lang=kk", 1510));
  expect(params.get("era")).toBe("kazakh-khanate");
  expect(params.get("year")).toBe("1510");
  expect(params.get("lang")).toBe("kk");
  expect(new URLSearchParams(atlasSearchForYear("?era=saka", 1200)).has("era")).toBe(false);
});
