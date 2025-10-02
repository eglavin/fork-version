import { resolve } from "node:path";
import { formatCommitMessage } from "../utils/format-commit-message";
import { fileExists } from "../utils/file-state";
import type { ForkConfig } from "../config/types";
import type { FileState } from "../files/file-manager";
import type { Logger } from "../services/logger";
import type { Git } from "../services/git";

export async function commitChanges(
	config: ForkConfig,
	logger: Logger,
	git: Git,
	files: FileState[],
	nextVersion: string,
): Promise<void> {
	if (config.skipCommit) {
		logger.warn("Skip commit");
		return;
	}

	logger.log("Committing changes");

	const filesToCommit: string[] = [];
	if (fileExists(resolve(config.path, config.changelog))) {
		filesToCommit.push(resolve(config.path, config.changelog));
	}
	for (const file of files) {
		filesToCommit.push(file.path);
	}

	// If there are no files to commit don't continue.
	if (filesToCommit.length === 0) {
		return;
	}

	if (config.commitAll) {
		await git.add("--all");
	} else {
		await git.add(...filesToCommit);
	}

	const shouldVerify = config.verify ? undefined : "--no-verify";
	const shouldSign = config.sign ? "--gpg-sign" : "--no-gpg-sign";

	await git.commit(
		shouldVerify,
		shouldSign,
		"--message",
		formatCommitMessage(config.changelogPresetConfig?.releaseCommitMessageFormat, nextVersion),
	);
}
