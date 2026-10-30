import { generateTicketCode, normalizeTicketCode } from "../src/domain/ticketCode";

describe("generateTicketCode", () => {
  it("produces 12 Crockford base32 characters", () => {
    for (let i = 0; i < 1000; i += 1) {
      expect(generateTicketCode()).toMatch(/^[0-9A-HJKMNP-TV-Z]{12}$/);
    }
  });

  it("does not repeat across 10,000 codes", () => {
    const codes = new Set(Array.from({ length: 10_000 }, generateTicketCode));
    expect(codes.size).toBe(10_000);
  });

  it("uses every symbol roughly evenly (no modulo bias)", () => {
    const counts = new Map<string, number>();
    for (let i = 0; i < 4000; i += 1) {
      for (const char of generateTicketCode()) {
        counts.set(char, (counts.get(char) ?? 0) + 1);
      }
    }
    // 48,000 symbols / 32 = 1,500 expected each; ±20% is far outside normal noise for a biased generator.
    expect(counts.size).toBe(32);
    for (const count of counts.values()) {
      expect(count).toBeGreaterThan(1200);
      expect(count).toBeLessThan(1800);
    }
  });
});

describe("normalizeTicketCode", () => {
  it.each([
    ["7K3M9QX2RB4D", "7K3M9QX2RB4D"],
    ["7k3m-9qx2-rb4d", "7K3M9QX2RB4D"],
    [" 7K3M 9QX2 RB4D ", "7K3M9QX2RB4D"],
    ["Z4R7E2KM9VB3", "Z4R7E2KM9VB3"],
    ["0OIL00000000", "001100000000"],
  ])("normalizes %p to %p", (input, expected) => {
    expect(normalizeTicketCode(input)).toBe(expected);
  });

  it.each(["", "SHORT", "7K3M9QX2RB4DX", "7K3M9QX2RB4U", "'; DROP TABLE", "７K3M9QX2RB4D"])("rejects %p", (input) => {
    expect(normalizeTicketCode(input)).toBeNull();
  });
});
