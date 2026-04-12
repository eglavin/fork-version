import { extractBuildMetadata } from "../extract-build-metadata";

describe("extract-build-metadata", () => {
	it("should return undefined if there is no build metadata", () => {
		expect(extractBuildMetadata("1.2.3")).toEqual({
			version: "1.2.3",
			buildMetadata: undefined,
		});
		expect(extractBuildMetadata("1.2.3-0")).toEqual({
			version: "1.2.3-0",
			buildMetadata: undefined,
		});
		expect(extractBuildMetadata("1.2.3-alpha.0")).toEqual({
			version: "1.2.3-alpha.0",
			buildMetadata: undefined,
		});
		expect(extractBuildMetadata("1.2.3+")).toEqual({
			version: "1.2.3",
			buildMetadata: undefined,
		});
	});

	it("should extract build metadata from version string", () => {
		expect(extractBuildMetadata("1.2.3+49a3f2b")).toEqual({
			version: "1.2.3",
			buildMetadata: "49a3f2b",
		});
		expect(extractBuildMetadata("1.2.3-0+49a3f2b")).toEqual({
			version: "1.2.3-0",
			buildMetadata: "49a3f2b",
		});
		expect(extractBuildMetadata("1.2.3-alpha.0+49a3f2b")).toEqual({
			version: "1.2.3-alpha.0",
			buildMetadata: "49a3f2b",
		});
	});
});
