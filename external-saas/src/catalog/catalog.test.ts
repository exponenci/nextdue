import assert from "node:assert/strict";
import test from "node:test";
import { loadCatalogPack } from "./load";

test("Russia and Uzbekistan reviewed packs satisfy the versioned catalog contract", async () => {
  const [ru, uz] = await Promise.all([loadCatalogPack("ru"), loadCatalogPack("uz")]);
  assert.equal(ru.countryCode, "RU");
  assert.equal(uz.countryCode, "UZ");
  assert.equal(ru.status, "reviewed");
  assert.equal(uz.status, "reviewed");
  assert.equal(ru.items.length, 7);
  assert.equal(uz.items.length, 5);
  assert.equal(new Set([...ru.items, ...uz.items].map((item) => item.id)).size, 12);
  assert.ok(ru.supportedLocales.includes("ru"));
  assert.ok(uz.supportedLocales.includes("uz-Latn"));
});
