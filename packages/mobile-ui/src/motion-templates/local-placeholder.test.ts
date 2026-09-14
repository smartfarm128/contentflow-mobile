import { describe, it, expect } from "bun:test";
import { placeholderImage, placeholderAvatar, placeholderLogo, placeholderIcon } from "./local-placeholder";

describe("offline placeholders", () => {
  it("emit decodable svg data URIs", () => {
    for (const fn of [placeholderImage, placeholderAvatar, placeholderLogo, placeholderIcon]) {
      const uri = fn("seed");
      expect(uri.startsWith("data:image/svg+xml,")).toBe(true);
      const svg = decodeURIComponent(uri.slice("data:image/svg+xml,".length));
      expect(svg).toContain("<svg");
      expect(svg).toContain("</svg>");
      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    }
  });
  it("are deterministic for a given seed", () => {
    expect(placeholderImage("abc")).toBe(placeholderImage("abc"));
    expect(placeholderAvatar("x")).not.toBe(placeholderAvatar("yyyy"));
  });
  it("never reference a remote host", () => {
    const all = [placeholderImage("a"), placeholderAvatar("b"), placeholderLogo("c"), placeholderIcon("d")];
    for (const uri of all) {
      const svg = decodeURIComponent(uri.slice(uri.indexOf(",") + 1));
      const hosts = svg.match(/https?:\/\/[^"'\s)]+/g) ?? [];
      expect(hosts.every((h) => h.startsWith("http://www.w3.org"))).toBe(true);
    }
  });
});
