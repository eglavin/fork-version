import { WriterOptionsSchema } from "../config/schema";
import type { ForkVersionCLIArgs, ForkConfig } from "../config/types";

export interface WriterOptions {
	/**
	 * A URL representing a specific commit at a hash.
	 * @default "{{host}}/{{owner}}/{{repository}}/commit/{{hash}}"
	 */
	commitUrlFormat: string;
	/**
	 * A URL representing the comparison between two git SHAs.
	 * @default "{{host}}/{{owner}}/{{repository}}/compare/{{previousTag}}...{{currentTag}}"
	 */
	compareUrlFormat: string;
	/**
	 * A URL representing the issue format (allowing a different URL format to be swapped in
	 * for Gitlab, Bitbucket, etc).
	 * @default "{{host}}/{{owner}}/{{repository}}/issues/{{id}}"
	 */
	issueUrlFormat: string;
	/**
	 * A URL representing a user's profile on GitHub, Gitlab, etc. This URL is used
	 * for substituting `@eglavin` with https://github.com/eglavin in commit messages.
	 * @default "{{host}}/{{user}}"
	 */
	userUrlFormat: string;
}

function createDefaultWriterOptions(): WriterOptions {
	return {
		commitUrlFormat: "{{host}}/{{owner}}/{{repository}}/commit/{{hash}}",
		compareUrlFormat: "{{host}}/{{owner}}/{{repository}}/compare/{{previousTag}}...{{currentTag}}",
		issueUrlFormat: "{{host}}/{{owner}}/{{repository}}/issues/{{id}}",
		userUrlFormat: "{{host}}/{{user}}",
	};
}

export function createWriterOptions(
	mergedConfig: Partial<ForkConfig> | undefined,
	cliArguments: ForkVersionCLIArgs["flags"],
	detectedChangelogOptions: ForkConfig["changelogWriterOptions"] | undefined,
): WriterOptions {
	const initialOptions = createDefaultWriterOptions();

	// If we've detected a git host, use the values from the detected host now so that they can
	// be overwritten by the users config later
	if (detectedChangelogOptions) {
		for (const [key, value] of Object.entries(detectedChangelogOptions)) {
			if (key in initialOptions && value !== undefined) {
				initialOptions[key as keyof WriterOptions] = value;
			}
		}
	}

	// Then overwrite with any values from the users config
	if (
		mergedConfig?.changelogWriterOptions &&
		typeof mergedConfig.changelogWriterOptions === "object"
	) {
		for (const [key, value] of Object.entries(mergedConfig.changelogWriterOptions)) {
			if (key in initialOptions && value !== undefined) {
				initialOptions[key as keyof WriterOptions] = value;
			}
		}
	}

	// Finally overwrite with any values from the CLI arguments
	if (cliArguments.commitUrlFormat) {
		initialOptions.commitUrlFormat = cliArguments.commitUrlFormat;
	}
	if (cliArguments.compareUrlFormat) {
		initialOptions.compareUrlFormat = cliArguments.compareUrlFormat;
	}
	if (cliArguments.issueUrlFormat) {
		initialOptions.issueUrlFormat = cliArguments.issueUrlFormat;
	}
	if (cliArguments.userUrlFormat) {
		initialOptions.userUrlFormat = cliArguments.userUrlFormat;
	}

	return WriterOptionsSchema.passthrough().parse(initialOptions);
}
