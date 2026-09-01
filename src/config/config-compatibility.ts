type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | undefined {
	return value && typeof value === "object" && !Array.isArray(value)
		? (value as UnknownRecord)
		: undefined;
}

function formatLegacyOptionWarning(options: {
	oldPath: string;
	newPath: string;
	ignored: boolean;
}): string {
	const { oldPath, newPath, ignored } = options;

	return ignored
		? `[Config] '${oldPath}' is deprecated and was ignored because '${newPath}' is already set.`
		: `[Config] '${oldPath}' is deprecated and will be removed in a future release. Use '${newPath}' instead.`;
}

interface LegacyChangelogPresetConfigRule {
	key:
		| "types"
		| "commitUrlFormat"
		| "compareUrlFormat"
		| "issueUrlFormat"
		| "userUrlFormat"
		| "releaseCommitMessageFormat"
		| "issuePrefixes";
	oldPath: string;
	newPath: string;
	readNew: (config: UnknownRecord) => unknown;
	writeNew: (config: UnknownRecord, value: unknown) => void;
}

const LEGACY_CHANGELOG_PRESET_CONFIG_RULES: LegacyChangelogPresetConfigRule[] = [
	{
		key: "types",
		oldPath: "changelogPresetConfig.types",
		newPath: "types",
		readNew: (config) => config.types,
		writeNew: (config, value) => {
			config.types = value;
		},
	},
	{
		key: "releaseCommitMessageFormat",
		oldPath: "changelogPresetConfig.releaseCommitMessageFormat",
		newPath: "releaseMessageFormat",
		readNew: (config) => config.releaseMessageFormat,
		writeNew: (config, value) => {
			config.releaseMessageFormat = value;
		},
	},
	{
		key: "commitUrlFormat",
		oldPath: "changelogPresetConfig.commitUrlFormat",
		newPath: "changelogWriterOptions.commitUrlFormat",
		readNew: (config) => asRecord(config.changelogWriterOptions)?.commitUrlFormat,
		writeNew: (config, value) => {
			config.changelogWriterOptions = {
				...asRecord(config.changelogWriterOptions),
				commitUrlFormat: value,
			};
		},
	},
	{
		key: "compareUrlFormat",
		oldPath: "changelogPresetConfig.compareUrlFormat",
		newPath: "changelogWriterOptions.compareUrlFormat",
		readNew: (config) => asRecord(config.changelogWriterOptions)?.compareUrlFormat,
		writeNew: (config, value) => {
			config.changelogWriterOptions = {
				...asRecord(config.changelogWriterOptions),
				compareUrlFormat: value,
			};
		},
	},
	{
		key: "issueUrlFormat",
		oldPath: "changelogPresetConfig.issueUrlFormat",
		newPath: "changelogWriterOptions.issueUrlFormat",
		readNew: (config) => asRecord(config.changelogWriterOptions)?.issueUrlFormat,
		writeNew: (config, value) => {
			config.changelogWriterOptions = {
				...asRecord(config.changelogWriterOptions),
				issueUrlFormat: value,
			};
		},
	},
	{
		key: "userUrlFormat",
		oldPath: "changelogPresetConfig.userUrlFormat",
		newPath: "changelogWriterOptions.userUrlFormat",
		readNew: (config) => asRecord(config.changelogWriterOptions)?.userUrlFormat,
		writeNew: (config, value) => {
			config.changelogWriterOptions = {
				...asRecord(config.changelogWriterOptions),
				userUrlFormat: value,
			};
		},
	},
	{
		key: "issuePrefixes",
		oldPath: "changelogPresetConfig.issuePrefixes",
		newPath: "commitParserOptions.issuePrefixes",
		readNew: (config) => asRecord(config.commitParserOptions)?.issuePrefixes,
		writeNew: (config, value) => {
			config.commitParserOptions = {
				...asRecord(config.commitParserOptions),
				issuePrefixes: value,
			};
		},
	},
];

/**
 * Detects a pre-v6 `changelogPresetConfig` on a raw, not-yet-validated config object and maps each
 * of its sub-fields onto their v6 replacement, so an old config file keeps working instead of the
 * option being silently dropped.
 *
 * A sub-field already explicitly set at its new location takes precedence over the old value, which
 * is dropped with an "ignored" warning instead of overwriting it.
 *
 * @example
 * ```ts
 * applyLegacyChangelogPresetConfig({ changelogPresetConfig: { issuePrefixes: ["#", "gh-"] } });
 * // => { config: { commitParserOptions: { issuePrefixes: ["#", "gh-"] } }, warnings: [...] }
 * ```
 */
export function applyLegacyChangelogPresetConfig(rawConfig: unknown): {
	config: UnknownRecord;
	warnings: string[];
} {
	const record = asRecord(rawConfig) ?? ((rawConfig ?? {}) as UnknownRecord);

	if (!("changelogPresetConfig" in record)) {
		return {
			config: record,
			warnings: [],
		};
	}

	const config: UnknownRecord = { ...record };
	const legacy = asRecord(config.changelogPresetConfig);
	delete config.changelogPresetConfig;

	if (!legacy) {
		return {
			config,
			warnings: [],
		};
	}

	const warnings: string[] = [];

	for (const rule of LEGACY_CHANGELOG_PRESET_CONFIG_RULES) {
		const oldValue = legacy[rule.key];
		if (oldValue === undefined) continue;

		if (rule.readNew(config) !== undefined) {
			warnings.push(
				formatLegacyOptionWarning({
					oldPath: rule.oldPath,
					newPath: rule.newPath,
					ignored: true,
				}),
			);
			continue;
		}

		rule.writeNew(config, oldValue);
		warnings.push(
			formatLegacyOptionWarning({
				oldPath: rule.oldPath,
				newPath: rule.newPath,
				ignored: false,
			}),
		);
	}

	return {
		config,
		warnings,
	};
}

/**
 * Detects the pre-v6 `--release-commit-message-format` CLI flag and maps it onto
 * `releaseMessageFormat`, so it keeps working instead of silently going nowhere.
 *
 * @example
 * ```ts
 * applyLegacyCliFlags({ releaseCommitMessageFormat: "chore(release): {{currentTag}}" });
 * // => { flags: { releaseMessageFormat: "chore(release): {{currentTag}}" }, warnings: [...] }
 * ```
 */
export function applyLegacyCliFlags<
	T extends { releaseCommitMessageFormat?: string; releaseMessageFormat?: string },
>(flags: T): { flags: T; warnings: string[] } {
	const { releaseCommitMessageFormat: legacyValue, ...rest } = flags;

	if (legacyValue === undefined) {
		return {
			flags,
			warnings: [],
		};
	}

	const next = { ...rest } as T;

	if (flags.releaseMessageFormat !== undefined) {
		return {
			flags: next,
			warnings: [
				formatLegacyOptionWarning({
					oldPath: "--release-commit-message-format",
					newPath: "--release-message-format",
					ignored: true,
				}),
			],
		};
	}

	next.releaseMessageFormat = legacyValue;
	return {
		flags: next,
		warnings: [
			formatLegacyOptionWarning({
				oldPath: "--release-commit-message-format",
				newPath: "--release-message-format",
				ignored: false,
			}),
		],
	};
}
