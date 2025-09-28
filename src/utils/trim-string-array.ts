export function trimStringArray(array: string[] | undefined): string[] | undefined {
	const items = [];

	if (Array.isArray(array)) {
		for (const item of array) {
			const _item = item.trim();
			if (_item) {
				items.push(_item);
			}
		}
	}

	if (items.length === 0) {
		return undefined;
	}
	return items;
}
