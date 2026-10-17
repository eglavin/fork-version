import { defineConfig } from "oxfmt";

export default defineConfig({
	endOfLine: "lf",
	printWidth: 100,
	sortImports: true,
	useTabs: true,
	ignorePatterns: ["coverage/**/*", "dist/**/*", "node_modules/**/*"],
	overrides: [
		{
			files: ["*.md"],
			options: {
				useTabs: false,
				tabWidth: 2,
			},
		},
	],
});
