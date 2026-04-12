export interface BuildMetadata {
	version: string;
	buildMetadata: string | undefined;
}

/**
 * This function is used to separate build metadata from the version string.
 * Build metadata is denoted by a plus sign (`+`) followed by a string of characters.
 *
 * Example version strings including build metadata:
 * - `1.2.3+49a3f2b`
 * - `1.2.3-0+49a3f2b`
 * - `1.2.3-alpha.0+49a3f2b`
 *
 * In the above examples, the build metadata is `+49a3f2b`, which should be
 * ignored when determining the next version.
 *
 * @param version The version string to extract build metadata from.
 * @return Both the version string without build metadata and the extracted build metadata (if any).
 *
 * @example
 * ```ts
 * const versionWithMetadata = "1.2.3+49a3f2b";
 * const { version, buildMetadata } = extractBuildMetadata(versionWithMetadata);
 * console.log(version); // Output: "1.2.3"
 * console.log(buildMetadata); // Output: "49a3f2b"
 * ```
 */
export function extractBuildMetadata(version: string): BuildMetadata {
	const plusIndex = version.indexOf("+");

	if (plusIndex === -1) {
		return {
			version,
			buildMetadata: undefined,
		};
	}

	return {
		version: version.substring(0, plusIndex),
		buildMetadata: version.substring(plusIndex + 1) || undefined,
	};
}
