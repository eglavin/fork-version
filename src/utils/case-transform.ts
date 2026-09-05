/**
 *
 * @example
 * ```ts
 * toCamelCase("dry-run") // "dryRun"
 * toCamelCase("skip-bump") // "skipBump"
 * ```
 *
 * @param value
 * @returns
 */
export function toCamelCase(value: string): string {
	return value.replace(/-([a-z])/g, (_match, char: string) => char.toUpperCase());
}

/**
 *
 * @example
 * ```ts
 * toKebabCase("dryRun") // "dry-run"
 * toKebabCase("skipBump") // "skip-bump"
 * ```
 *
 * @param value The value to be converted into kebab-case.
 * @returns
 */
export function toKebabCase(value: string): string {
	return value.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}
