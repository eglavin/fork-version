import { defineConfig } from "vitest/config";

export default defineConfig({
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
