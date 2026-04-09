/**
 * https://gist.github.com/egmontkob/eb114294efbcd5adb1944c9f3cb5feda#quick-example
 * https://github.com/Alhadis/OSC8-Adoption/?tab=readme-ov-file#testing-support
 */
export function clickableLink(url: string, text: string): string {
	return `\u001b]8;;${url}\u001b\\${text}\u001b]8;;\u001b\\`;
}
