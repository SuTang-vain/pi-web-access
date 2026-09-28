import assert from "node:assert/strict";
import { test } from "node:test";

const exaModuleUrl = new URL("../exa.ts", import.meta.url).href;
const { fallbackSourceLabel } = await import(exaModuleUrl);

test("fallbackSourceLabel uses the URL hostname when the title is empty", () => {
	assert.equal(
		fallbackSourceLabel("https://cdn.jsdelivr.net/npm/pi-web-access@0.27.0/index.ts", 6),
		"cdn.jsdelivr.net",
	);
});

test("fallbackSourceLabel keeps the generic label for missing or invalid URLs", () => {
	assert.equal(fallbackSourceLabel(undefined, 3), "Source 4");
	assert.equal(fallbackSourceLabel("not-a-url", 3), "Source 4");
});

test("fallbackSourceLabel indexes from one to match citation numbering", () => {
	assert.equal(fallbackSourceLabel(undefined, 0), "Source 1");
});
