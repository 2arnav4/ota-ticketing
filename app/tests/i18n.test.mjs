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

// i18next plural keys: English has `_one` and `_other`, Japanese has only `_other` (CLDR: no grammatical plural).
// Compare plural families by their base name, so "pending.waiting_one" is satisfied by "pending.waiting_other".
const PLURAL = /_(zero|one|two|few|many|other)$/;
const base = (key) => key.replace(PLURAL, "");
const lookup = (map, key) => map.get(key) ?? map.get(`${base(key)}_other`) ?? map.get(base(key));

test("every English key has a Japanese translation and vice versa", () => {
  assert.deepEqual([...en.keys()].filter((k) => lookup(ja, k) === undefined), []);
  assert.deepEqual([...ja.keys()].filter((k) => lookup(en, k) === undefined), []);
});

// Deliberately empty: in English the demo user is already named "Gate Staff", so no " · Staff" suffix is added.
// Japanese keeps its suffix because the name stays in English there.
const MAY_BE_EMPTY = { en: new Set(["user.staffSuffix"]), ja: new Set() };

test("no translation is empty", () => {
  for (const [lang, map] of [["en", en], ["ja", ja]]) {
    for (const [key, value] of map) {
      if (MAY_BE_EMPTY[lang].has(key)) continue;
      assert.ok(String(value).trim().length > 0, `${lang}: ${key}`);
    }
  }
});

test("placeholders match between languages", () => {
  // {{count}} may be spelled out in a singular form ("1 ticket"), so it's ignored for plural keys.
  const vars = (s, plural) => [...String(s).matchAll(/{{(\w+)}}/g)].map((m) => m[1]).filter((v) => !(plural && v === "count")).sort();
  for (const [key, value] of en) {
    const plural = PLURAL.test(key);
    assert.deepEqual(vars(lookup(ja, key), plural), vars(value, plural), key);
  }
});
