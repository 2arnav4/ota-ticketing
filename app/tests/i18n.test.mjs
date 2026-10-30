import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const load = (lang) => JSON.parse(readFileSync(new URL(`../src/i18n/${lang}.json`, import.meta.url), "utf8"));

function flatten(obj, prefix = "") {
  return Object.entries(obj).flatMap(([key, value]) =>
    typeof value === "object" ? flatten(value, `${prefix}${key}.`) : [[`${prefix}${key}`, value]],
  );
}

const en = new Map(flatten(load("en")));
const ja = new Map(flatten(load("ja")));

test("every English key has a Japanese translation and vice versa", () => {
  assert.deepEqual([...en.keys()].filter((k) => !ja.has(k)), []);
  assert.deepEqual([...ja.keys()].filter((k) => !en.has(k)), []);
});

test("no translation is empty", () => {
  for (const [key, value] of [...en, ...ja]) assert.ok(String(value).trim().length > 0, key);
});

test("placeholders match between languages", () => {
  const vars = (s) => [...String(s).matchAll(/{{(\w+)}}/g)].map((m) => m[1]).sort();
  for (const [key, value] of en) assert.deepEqual(vars(ja.get(key)), vars(value), key);
});
