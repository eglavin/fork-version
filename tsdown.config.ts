import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts", "src/cli.ts"],
	unbundle: true,
	fixedExtension: false,
	exports: true,
	attw: {
		profile: "esm-only",
	},
	publint: true,
});
