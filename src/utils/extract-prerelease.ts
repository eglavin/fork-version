export interface VersionComponents {
	prefix: string;
	suffix: string | undefined;
}

/**
 * This function is used to split a version string into its prefix and suffix components.
 *
 * Example version strings:
 * - `1.2.3`
 * - `1.2.3-alpha.0`
 * - `1.2.3-0`
 *
 * In the above examples, the prefix is `1.2.3` and the suffixes are `undefined`, `alpha.0`, and `0` respectively.
 *
 * @param version The version string to split.
 * @return An object containing the prefix and suffix of the version string.
 *
 * @example
 * ```ts
 * const versionWithPrerelease = "1.2.3-alpha.0";
 * const { prefix, suffix } = extractPrerelease(versionWithPrerelease);
 * console.log(prefix); // Output: "1.2.3"
 * console.log(suffix); // Output: "alpha.0"
 * ```
 */
export function extractPrerelease(version: string): VersionComponents {
	const hyphenIndex = version.indexOf("-");

	if (hyphenIndex === -1) {
		return {
			prefix: version,
			suffix: undefined,
		};
	}

	return {
		prefix: version.substring(0, hyphenIndex),
		suffix: version.substring(hyphenIndex + 1) || undefined,
	};
}
