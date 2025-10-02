import { formatCommitMessage } from "../utils/format-commit-message";
import type { ForkConfig } from "../config/types";
import type { Logger } from "../services/logger";
import type { Git } from "../services/git";

export async function tagChanges(
	config: ForkConfig,
	logger: Logger,
	git: Git,
	nextVersion: string,
): Promise<void> {
	if (config.skipTag) {
		logger.warn("Skip tag creation");
		return;
	}

	/** @example "v1.2.3" or "version/1.2.3" */
	const tag = `${config.tagPrefix}${nextVersion}`;

	logger.log(`Creating tag: ${tag}`);

	const shouldSign = config.sign ? "--sign" : "--no-sign";

	await git.tag(
		shouldSign,
		"--annotate",
		tag,
		"--message",
		formatCommitMessage(config.changelogPresetConfig?.releaseCommitMessageFormat, nextVersion),
	);
}
