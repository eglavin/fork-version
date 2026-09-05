import { toCamelCase, toKebabCase } from "../case-transform";

describe("case-transform", () => {
	it("should convert to camel case", () => {
		expect(toCamelCase("dry-run")).toBe("dryRun");
		expect(toCamelCase("skip-bump")).toBe("skipBump");
	});

	it("should convert to kebab case", () => {
		expect(toKebabCase("dryRun")).toBe("dry-run");
		expect(toKebabCase("skipBump")).toBe("skip-bump");
	});
});
