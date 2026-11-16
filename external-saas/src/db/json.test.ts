import assert from "node:assert/strict";
import test from "node:test";
import { jsonbParameter } from "./json";

test("serializes JSONB query parameters before postgres.js binds them", () => {
  assert.equal(jsonbParameter({ revision: 2, flags: [true, false] }), '{"revision":2,"flags":[true,false]}');
  assert.throws(() => jsonbParameter(undefined), /JSON-serializable/);
});
