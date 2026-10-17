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
	options: {
		typeAware: true,
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
		"typescript/consistent-type-imports": "error",
		"typescript/no-deprecated": "error",
		"typescript/no-empty-function": "off",
		"typescript/no-explicit-any": "error",
		"typescript/no-misused-promises": "error",
		"typescript/no-non-null-assertion": "error",
		"typescript/no-unsafe-argument": "error",
		"typescript/no-unsafe-call": "error",
		"typescript/no-unsafe-return": "error",
		"typescript/no-unsafe-type-assertion": "off",
		"typescript/only-throw-error": "error",
		"typescript/prefer-optional-chain": "error",
		"typescript/prefer-promise-reject-errors": "error",
		"typescript/prefer-reduce-type-parameter": "error",
		"typescript/return-await": ["error", "always"],
		"typescript/switch-exhaustiveness-check": [
			"error",
			{ considerDefaultExhaustiveForUnions: true },
		],
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
				"typescript/unbound-method": "off",
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
