import type { ForkConfig } from "./types";

export const DEFAULT_CONFIG: ForkConfig = {
	// Commands
	command: "main",

	// Options
	files: [
		"package.json",
		"package-lock.json",
		"npm-shrinkwrap.json",
		"jsr.json",
		"jsr.jsonc",
		"deno.json",
		"deno.jsonc",
		"manifest.json", // Chrome extensions
		"bower.json",
	],
	path: process.cwd(),
	changelog: "CHANGELOG.md",
	header: `# Changelog

All notable changes to this project will be documented in this file. See [fork-version](https://github.com/eglavin/fork-version) for commit guidelines.
`,
	tagPrefix: "v",

	// Flags
	allowMultipleVersions: true,
	commitAll: false,
	changelogAll: false,
	debug: false,
	dryRun: false,
	silent: false,
	gitTagFallback: true,
	sign: false,
	verify: false,

	// Skip Steps
	skipBump: false,
	skipChangelog: false,
	skipCommit: false,
	skipTag: false,

	changelogPresetConfig: {},
};
