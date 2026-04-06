/**
 * Escapes special characters in a string for use in a regular expression.
 *
 * @example
 * ```ts
 * escapeRegex("Hello. How are you?"); // "Hello\. How are you\?"
 * ```
 *
 * @param input The string to be escaped for use in a regular expression.
 * @returns The escaped string, safe for use in a regular expression.
 */
export function escapeRegex(input: string): string {
	return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
