/**
 * Parses a string into a RegExp object. If the string is in the form of a regular expression literal
 * (e.g., "/pattern/flags"), it will be parsed accordingly. Otherwise, it will be treated as a
 * plain string pattern.
 *
 * @example
 * ```ts
 * parseRegExpString("/abc/i"); // returns a valid RegExp object with pattern "abc" and flag "i"
 * parseRegExpString("abc"); // returns a RegExp object with pattern "abc" and no flags
 * parseRegExpString("[unclosed"); // returns null due to invalid regex
 * ```
 *
 * @param input The string to parse into a RegExp object.
 * @returns A RegExp object if parsing is successful, or null if the input is invalid.
 */
export function parseRegExpString(input: string): RegExp | null {
	const literal = /^\/(.+)\/([a-z]*)$/i.exec(input);
	if (literal) {
		try {
			return new RegExp(literal[1], literal[2]);
		} catch {
			return null;
		}
	}

	try {
		return new RegExp(input);
	} catch {
		return null;
	}
}
