import { defineConfig } from "oxlint";

export default defineConfig({
	plugins: ["eslint", "typescript", "unicorn", "oxc"],
	categories: {
		correctness: "error",
	},
	env: {
		builtin: true,
		node: true,
		es2021: true,
	},
	ignorePatterns: ["coverage/**/*", "dist/**/*", "node_modules/**/*"],
	rules: {
		"no-console": "off",
		"no-unused-vars": [
			"warn",
			{
				ignoreRestSiblings: true,
				caughtErrorsIgnorePattern: "^_",
				argsIgnorePattern: "^_",
			},
		],

		"typescript/no-empty-function": "off",
		"typescript/no-explicit-any": "warn",
		"typescript/no-non-null-assertion": "warn",
	},
});
