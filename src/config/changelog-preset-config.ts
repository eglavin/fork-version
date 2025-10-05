import { z } from "zod";
import conventionalChangelogConfigSpec from "conventional-changelog-config-spec";

import { ChangelogPresetConfigTypeSchema, ChangelogPresetConfigSchema } from "./schema";
import type { ForkVersionCLIArgs, ForkConfig } from "./types";
import type { DetectedGitHost } from "./detect-git-host";

export function getChangelogPresetConfig(
	mergedConfig: Partial<ForkConfig> | undefined,
	cliArguments: ForkVersionCLIArgs["flags"],
	detectedGitHost: DetectedGitHost | null,
) {
	const preset: { name: string; [_: string]: unknown } = {
		name: "conventionalcommits",
	};

	// First take any default values from the conventional-changelog-config-spec
	if (typeof conventionalChangelogConfigSpec.properties === "object") {
		Object.entries(conventionalChangelogConfigSpec.properties).forEach(([key, value]) => {
			if ("default" in value && value.default !== undefined) {
				// If the user has requested to see all types, we need to remove the hidden flag from the default types.
				if (mergedConfig?.changelogAll && key === "types") {
					const parsedTypes = z.array(ChangelogPresetConfigTypeSchema).safeParse(value.default);

					if (parsedTypes.success) {
						parsedTypes.data.forEach((type) => {
							if (!type.section) {
								delete type.hidden;
								type.section = "Other Changes";
							}
						});
						preset[key] = parsedTypes.data;

						return;
					}
				}

				preset[key] = value.default;
			}
		});
	}

	// If we've detected a git host, use the values from the detected host now so that they can
	// be overwritten by the users config later
	if (detectedGitHost) {
		Object.entries(detectedGitHost).forEach(([key, value]) => {
			if (value !== undefined) {
				preset[key] = value;
			}
		});
	}

	// Then overwrite with any values from the users config
	if (
		mergedConfig?.changelogPresetConfig &&
		typeof mergedConfig.changelogPresetConfig === "object"
	) {
		Object.entries(mergedConfig.changelogPresetConfig).forEach(([key, value]) => {
			if (value !== undefined) {
				preset[key] = value;
			}
		});
	}

	// If the user has defined a releaseMessageSuffix, append it to the releaseCommitMessageFormat
	if (mergedConfig?.releaseMessageSuffix && !cliArguments?.releaseMessageSuffix) {
		preset.releaseCommitMessageFormat = `${preset.releaseCommitMessageFormat} ${mergedConfig.releaseMessageSuffix}`;
	}

	// Finally overwrite with any values from the CLI arguments
	if (cliArguments?.commitUrlFormat) {
		preset.commitUrlFormat = cliArguments.commitUrlFormat;
	}
	if (cliArguments?.compareUrlFormat) {
		preset.compareUrlFormat = cliArguments.compareUrlFormat;
	}
	if (cliArguments?.issueUrlFormat) {
		preset.issueUrlFormat = cliArguments.issueUrlFormat;
	}
	if (cliArguments?.userUrlFormat) {
		preset.userUrlFormat = cliArguments.userUrlFormat;
	}
	if (cliArguments?.releaseCommitMessageFormat) {
		preset.releaseCommitMessageFormat = cliArguments.releaseCommitMessageFormat;
	}
	if (cliArguments?.releaseMessageSuffix) {
		preset.releaseCommitMessageFormat = `${preset.releaseCommitMessageFormat} ${cliArguments.releaseMessageSuffix}`;
	}

	return ChangelogPresetConfigSchema.passthrough().parse(preset);
}
