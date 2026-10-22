import { describe, it, expect } from "vitest";
import { estimateFare, validateRoute } from "./fare";

describe("estimateFare", () => {
  it("economy 10km / 20min = 8 + 30 + 8 = 46; fee is deducted from driver net", () => {
    expect(estimateFare("economy", 10, 20)).toEqual({ base: 8, perKm: 30, perMin: 8, fee: 2, total: 46, driverNet: 44 });
  });
  it("van costs more than economy for same trip", () => {
    expect(estimateFare("van", 5, 10).total).toBeGreaterThan(estimateFare("economy", 5, 10).total);
  });
});

describe("validateRoute", () => {
  it("requires pickup", () => expect(validateRoute("", "Salé").pickup).toBe("errPickup"));
  it("rejects identical places", () => expect(validateRoute("Agdal", "agdal").destination).toBe("errSame"));
  it("accepts valid route", () => expect(validateRoute("Agdal", "Salé")).toEqual({ pickup: null, destination: null }));
});
