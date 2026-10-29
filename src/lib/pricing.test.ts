import { describe, expect, it } from "vitest";
import { calcTotals, filterProducts } from "./pricing";

describe("pricing", () => {
  it("charges ৳80 delivery on the sample cart (৳6,400 is above 5,000 → free)", () => {
    expect(
      calcTotals([
        { price: 1850, quantity: 1 },
        { price: 2400, quantity: 1 },
      ]).delivery,
    ).toBe(80);
    expect(
      calcTotals([
        { price: 1850, quantity: 1 },
        { price: 2400, quantity: 1 },
      ]).total,
    ).toBe(4330);
  });
  it("delivery is free above ৳5,000", () => {
    expect(calcTotals([{ price: 6400, quantity: 1 }]).delivery).toBe(0);
  });
  it("coupon NEXORA10 takes 10% off subtotal", () => {
    expect(calcTotals([{ price: 1000, quantity: 2 }], 10)).toEqual({
      subtotal: 2000,
      discount: 200,
      delivery: 80,
      total: 1880,
    });
  });
  it("sorts price low to high and filters by rating", () => {
    const list = [
      { price: 300, rating: 4.8, reviewCount: 1, createdAt: "a" },
      { price: 100, rating: 4.0, reviewCount: 2, createdAt: "b" },
      { price: 200, rating: 4.6, reviewCount: 3, createdAt: "c" },
    ];
    expect(
      filterProducts(list, { sort: "price-asc", min: 0, max: 1000, minRating: 4.5 }).map(
        (p) => p.price,
      ),
    ).toEqual([200, 300]);
  });
});
