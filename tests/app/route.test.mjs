/* Hash routing for the React app (src/route.ts). Run: npm run test:app */
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseHash, toHash, tabFor } from "../../src/route.ts";

test("old deep links still resolve to their chapter", () => {
  for (const id of ["ch1", "ch2", "bonus"]) {
    assert.deepEqual(parseHash(`#${id}`), { screen: "chapter", chapter: id });
    assert.equal(toHash(parseHash(`#${id}`)), `#${id}`); // the link the old game writes round-trips
  }
});

test("tabs and settings", () => {
  for (const s of ["learn", "progress", "settings"]) assert.deepEqual(parseHash(`#${s}`), { screen: s });
  for (const h of ["", "#", "#/", "#home"]) assert.deepEqual(parseHash(h), { screen: "home" });
  assert.deepEqual(parseHash("#/learn"), { screen: "learn" });
});

test("level route is focused (no tab)", () => {
  const r = parseHash("#ch2/keepleft");
  assert.deepEqual(r, { screen: "level", chapter: "ch2", level: "keepleft" });
  assert.equal(tabFor(r), null);
  assert.equal(toHash(r), "#ch2/keepleft");
});

test("unknown or malformed hashes fall back to home", () => {
  for (const h of ["#ch3", "#CH1", "#ch1/a/b", "#ch1/<script>", "#ch1/" + "x".repeat(65), "#settings/x"])
    assert.deepEqual(parseHash(h), { screen: "home" }, h);
});

test("tab highlighting", () => {
  assert.equal(tabFor({ screen: "home" }), "home");
  assert.equal(tabFor({ screen: "settings" }), "home");
  assert.equal(tabFor({ screen: "learn" }), "learn");
  assert.equal(tabFor({ screen: "chapter", chapter: "ch1" }), "learn");
  assert.equal(tabFor({ screen: "progress" }), "progress");
});
