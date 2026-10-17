import { defineConfig } from "oxlint";

export default defineConfig({
	plugins: ["eslint", "typescript", "unicorn", "oxc"],
	categories: {
		correctness: "error",
		suspicious: "error",
		perf: "error",
	},
	env: {
		builtin: true,
		node: true,
		es2021: true,
	},
	ignorePatterns: ["coverage/**/*", "dist/**/*", "node_modules/**/*"],
	rules: {
		"no-array-sort": "off",
		"no-await-in-loop": "off",
		"no-console": "off",
		"no-duplicate-imports": "error",
		"no-underscore-dangle": "off",
		"no-unused-vars": [
			"warn",
			{
				ignoreRestSiblings: true,
				caughtErrorsIgnorePattern: "^_",
				argsIgnorePattern: "^_",
			},
		],
		"no-useless-return": "error",
		"object-shorthand": "error",
		"prefer-string-replace-all": "error",
		"prefer-template": "error",
		"require-await": "error",
		"typescript/ban-ts-comment": "error",
		"typescript/no-empty-function": "off",
		"typescript/no-explicit-any": "error",
		"typescript/no-non-null-assertion": "error",
		"typescript/consistent-type-imports": "error",
		"unicorn/prefer-optional-catch-binding": "error",
		"unicorn/prefer-string-slice": "error",
		"unicorn/prefer-type-error": "error",
		"unicorn/switch-case-braces": "error",
	},
	overrides: [
		{
			files: ["**/__tests__/**"],
			plugins: ["vitest"],
			rules: {
				"consistent-function-scoping": "off",
				"typescript/ban-ts-comment": "off",
			},
		},
		{
			files: ["examples/**"],
			rules: {
				"typescript/ban-ts-comment": "off",
			},
		},
	],
});
