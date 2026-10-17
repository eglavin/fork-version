import { defineConfig } from "vite-plus";

const ignorePatterns = ["coverage/**/*", "dist/**/*", "node_modules/**/*"];

export default defineConfig({
	fmt: {
		endOfLine: "lf",
		printWidth: 100,
		sortImports: true,
		useTabs: true,
		ignorePatterns,
		overrides: [
			{
				files: ["*.md"],
				options: {
					useTabs: false,
					tabWidth: 2,
				},
			},
		],
	},
	lint: {
		plugins: ["eslint", "typescript", "unicorn", "oxc"],
		jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
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
			typeCheck: true,
		},
		ignorePatterns,
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
			"vite-plus/prefer-vite-plus-imports": "error",
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
	},
	pack: {
		entry: ["src/index.ts", "src/cli.ts"],
		unbundle: true,
		fixedExtension: false,
		exports: true,
		attw: {
			profile: "esm-only",
		},
		publint: true,
	},
	test: {
		include: ["src/**/*.test.*"],
		exclude: ["src/**/*.snap"],
		globals: true,
		restoreMocks: true,
		coverage: {
			include: ["src/**/*"],
			reporter: ["cobertura", "html", "text", "json-summary", "json"],
			reportOnFailure: true,
		},
	},
});
