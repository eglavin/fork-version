import { cleanTag } from "../clean-tag";

describe("clean-tag", () => {
	it("should clean tags with prefix", () => {
		expect(cleanTag("v1.2.3", "v")).toBe("1.2.3");
		expect(cleanTag("release-2.0.0", "release-")).toBe("2.0.0");
	});

	it("should return the same tag if no prefix is provided", () => {
		expect(cleanTag("1.2.3")).toBe("1.2.3");
		expect(cleanTag("v1.2.3")).toBe("1.2.3");
	});

	it("should return undefined for invalid semver", () => {
		expect(cleanTag("v1.2", "v")).toBeUndefined();
		expect(cleanTag("version-2.0", "version-")).toBeUndefined();
	});

	it("should return undefined for nullable input", () => {
		expect(cleanTag(undefined)).toBeUndefined();
		expect(cleanTag(null as never)).toBeUndefined();
	});
});
