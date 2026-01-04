/**
 * Escapes special characters in a string for use in a regular expression.
 *
 * @example
 * ```ts
 * escapeRegex("Hello. How are you?"); // "Hello\. How are you\?"
 * ```
 */
export function escapeRegex(input: string): string {
	return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
