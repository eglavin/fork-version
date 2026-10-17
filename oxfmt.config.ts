import { defineConfig } from "oxfmt";

export default defineConfig({
	endOfLine: "lf",
	printWidth: 100,
	useTabs: true,
	ignorePatterns: ["coverage/**/*", "dist/**/*", "node_modules/**/*"],
});
