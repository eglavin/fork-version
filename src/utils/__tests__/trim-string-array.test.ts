import { trimStringArray } from "../trim-string-array";

describe("trim-string-array", () => {
	it("should return undefined if the input is not an array", () => {
		expect(trimStringArray(undefined)).toBeUndefined();
		// @ts-expect-error
		expect(trimStringArray(null)).toBeUndefined();
		// @ts-expect-error
		expect(trimStringArray("")).toBeUndefined();
		// @ts-expect-error
		expect(trimStringArray(0)).toBeUndefined();
		// @ts-expect-error
		expect(trimStringArray({})).toBeUndefined();
	});

	it("should cleanup items in the array", () => {
		const item1 = "  item1  ";
		const item2 = "item2";
		const item3 = "";

		expect(trimStringArray([item1, item2, item3])).toStrictEqual([item1.trim(), item2]);
	});
});
