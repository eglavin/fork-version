/**
 * Trims whitespace from each string in the provided array and optionally applies a transformation function to each item.
 * If the resulting array is empty after trimming, it returns undefined.
 *
 * @param array The array of strings to be trimmed and transformed.
 * @param transformFn Optional function to apply to each trimmed item (e.g., for escaping regex characters).
 * @returns A new array of trimmed (and optionally transformed) strings, or undefined if the resulting array is empty.
 */
export function trimStringArray(
	array: string[] | undefined,
	transformFn?: (item: string) => string,
): string[] | undefined {
	const items = [];

	if (Array.isArray(array)) {
		for (let item of array) {
			item = item.trim();
			if (item) {
				items.push(transformFn ? transformFn(item) : item);
			}
		}
	}

	if (items.length === 0) {
		return undefined;
	}
	return items;
}
