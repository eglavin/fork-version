import { ChangelogPresetConfigSchema } from "./schema";
import type { ForkVersionCLIArgs, ForkConfig, ChangelogPresetConfig } from "./types";

export function getChangelogPresetConfig(
	mergedConfig: Partial<ForkConfig> | undefined,
	cliArguments: ForkVersionCLIArgs["flags"],
	detectedChangelogOptions: ForkConfig["changelogPresetConfig"] | undefined,
): ChangelogPresetConfig {
	const preset: ChangelogPresetConfig = {
		types: [
			{ type: "feat", section: "Features" },
			{ type: "fix", section: "Bug Fixes" },
			{ type: "chore", hidden: true },
			{ type: "docs", hidden: true },
			{ type: "style", hidden: true },
			{ type: "refactor", hidden: true },
			{ type: "perf", hidden: true },
			{ type: "test", hidden: true },
		],
		commitUrlFormat: "{{host}}/{{owner}}/{{repository}}/commit/{{hash}}",
		compareUrlFormat: "{{host}}/{{owner}}/{{repository}}/compare/{{previousTag}}...{{currentTag}}",
		issueUrlFormat: "{{host}}/{{owner}}/{{repository}}/issues/{{id}}",
		userUrlFormat: "{{host}}/{{user}}",
	};

	// If the user has requested to see all types, we need to remove the hidden flag from the default types.
	if (mergedConfig?.changelogAll) {
		for (const type of preset.types) {
			if (type.hidden) {
				delete type.hidden;
				type.section = "Other Changes";
			}
		}
	}

	// If we've detected a git host, use the values from the detected host now so that they can
	// be overwritten by the users config later
	if (detectedChangelogOptions) {
		Object.entries(detectedChangelogOptions).forEach(([key, value]) => {
			if (key in preset && value !== undefined) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(preset as any)[key] = value;
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
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(preset as any)[key] = value;
			}
		});
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

	return ChangelogPresetConfigSchema.passthrough().parse(preset);
}
