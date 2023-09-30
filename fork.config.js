import { defineConfig } from "./src/configuration";

export default defineConfig({
	header: "# Fork Version\n",

	changelogPresetConfig: {
		types: [
			{ type: "feat", section: "Features" },
			{ type: "fix", section: "Bug Fixes" },
			{ type: "chore", section: "Chore" },
			{ type: "docs", section: "Docs" },
			{ type: "style", section: "Style" },
			{ type: "refactor", section: "Refactor" },
			{ type: "perf", section: "Perf" },
			{ type: "test", section: "Test" },
		],
	},
});
