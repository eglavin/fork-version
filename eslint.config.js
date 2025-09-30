// @ts-check

import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tsEslint from "typescript-eslint";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

export default defineConfig(
	eslint.configs.recommended,
	tsEslint.configs.stylisticTypeChecked,
	{
		ignores: ["coverage/**/*", "dist/**/*", "node_modules/**/*"],
		languageOptions: {
			globals: {
				...globals.node,
				...globals.es2021,
			},
			parserOptions: {
				project: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
	{
		files: ["**/*.ts"],
		rules: {
			"no-console": 0,
			"no-undef": 0,
			"no-unused-vars": 0,

			"@typescript-eslint/no-empty-function": 0,
			"@typescript-eslint/no-explicit-any": 1,
			"@typescript-eslint/no-non-null-assertion": 1,
			"@typescript-eslint/no-unused-vars": [
				1,
				{
					ignoreRestSiblings: true,
					caughtErrorsIgnorePattern: "^_",
					argsIgnorePattern: "^_",
				},
			],
			"@typescript-eslint/prefer-nullish-coalescing": 0,
		},
	},
	{
		files: ["**/*.js"],
		...tsEslint.configs.disableTypeChecked,
	},
	eslintPluginPrettierRecommended,
);
