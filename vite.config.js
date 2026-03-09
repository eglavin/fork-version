/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import pkg from "./package.json" with { type: "json" };

const externalDependencies = [
	...Object.keys(pkg.dependencies || {}),
	...Object.keys(pkg.devDependencies || {}),
	...Object.keys(pkg.peerDependencies || {}),
];

export default defineConfig({
	plugins: [
		dts({
			tsconfigPath: "tsconfig.json",
			entryRoot: "src",
			include: ["src/**/*.{ts,js}", "@types/**/*.ts"],
			exclude: ["src/**/*.test.*"],
		}),
	],
	build: {
		emptyOutDir: true,
		minify: false,
		sourcemap: false,
		lib: {
			entry: ["src/index.ts", "src/cli.ts"],
			formats: ["es"],
			fileName: "[name]",
		},
		rollupOptions: {
			treeshake: true,
			external: (source) =>
				source.startsWith("node:") ||
				externalDependencies.some((dep) => source === dep || source.startsWith(`${dep}/`)),
			output: {
				preserveModules: true,
			},
		},
	},
	test: {
		include: ["src/**/*.test.*"],
		globals: true,
		restoreMocks: true,
		coverage: {
			include: ["src/**/*"],
			all: true,
			reporter: ["cobertura", "html", "text", "json-summary", "json"],
			reportOnFailure: true,
		},
	},
});
