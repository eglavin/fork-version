import { extractPrerelease } from "../extract-prerelease";

describe("extract-prerelease", () => {
	it("should handle plain version", () => {
		expect(extractPrerelease("1.2.3")).toEqual({
			prefix: "1.2.3",
			suffix: undefined,
		});
	});

	it("should handle version with prerelease suffix", () => {
		expect(extractPrerelease("1.2.3-beta")).toEqual({
			prefix: "1.2.3",
			suffix: "beta",
		});

		expect(extractPrerelease("1.2.3-alpha.1")).toEqual({
			prefix: "1.2.3",
			suffix: "alpha.1",
		});
	});
});
