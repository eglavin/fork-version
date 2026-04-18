import semver from "semver";
import { escapeRegex } from "./escape-regex";

/**
 * Cleans a git tag by removing the specified prefix and ensuring it's a valid semver version.
 *
 * @example
 * ```ts
 * cleanTag("v1.2.3", "v"); // "1.2.3"
 * cleanTag("release-2.0.0", "release-"); // "2.0.0"
 * cleanTag("1.0.0"); // "1.0.0"
 * ```
 */
export function cleanTag(tag?: string, tagPrefix?: string): string | undefined {
	if (!tag) return undefined;

	const tagWithoutPrefix = tagPrefix
		? tag.replace(new RegExp(`^${escapeRegex(tagPrefix)}`), "")
		: tag;

	return semver.clean(tagWithoutPrefix) ?? undefined;
}
