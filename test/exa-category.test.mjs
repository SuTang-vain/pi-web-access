import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const exaModuleUrl = new URL("../exa.ts", import.meta.url).href;

async function requestBodyFor(args) {
	const home = await mkdtemp(join(tmpdir(), "pi-web-access-exa-category-"));
	try {
		const env = { ...process.env, HOME: home, USERPROFILE: home, PI_CODING_AGENT_DIR: home, EXA_API_KEY: "exa-category-key" };
		delete env.EXA_BASE_URL;
		delete env.XDG_CONFIG_HOME;
		const child = spawnSync(process.execPath, ["--input-type=module"], {
			input: `
				const requests = [];
				globalThis.fetch = async (url, init) => {
					requests.push({ url: String(url), body: JSON.parse(init.body) });
					return new Response(JSON.stringify({ results: [] }), { status: 200, headers: { "content-type": "application/json" } });
				};
				const { searchWithExa } = await import(${JSON.stringify(exaModuleUrl)});
				await searchWithExa(...${JSON.stringify(args)});
				console.log(JSON.stringify(requests));
			`,
			encoding: "utf8",
			env,
		});
		assert.equal(child.status, 0, child.stderr);
		return JSON.parse(child.stdout.trim());
	} finally {
		await rm(home, { recursive: true, force: true });
	}
}

test("keyed Exa forwards category to /search when set, and omits it when unset", async () => {
	const [withCategory] = await requestBodyFor(["papers only", { category: "research paper" }]);
	assert.deepEqual(withCategory.body, {
		query: "papers only",
		type: "auto",
		numResults: 5,
		category: "research paper",
		contents: { highlights: true },
	});

	const [withoutCategory] = await requestBodyFor(["plain query"]);
	assert.deepEqual(withoutCategory.body, {
		query: "plain query",
		type: "auto",
		numResults: 5,
		contents: { highlights: true },
	});
});
