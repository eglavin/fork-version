import { Git } from "../services/git";
import type { ForkConfig } from "../config/types";

import { detectGitHubOptions } from "./host-github";
import { detectGitlabOptions } from "./host-gitlab";
import { detectBitbucketOptions } from "./host-bitbucket";
import { detectAzureDevopsOptions } from "./host-azure-devops";
import { detectGenericGitHost } from "./host-generic";

export interface DetectedGitHost {
	hostName: string;
	commitParser: ForkConfig["commitParserOptions"];
	changelogWriter: ForkConfig["changelogWriterOptions"];
}

/**
 * Detects the Git hosting service based on the remote URL of the Git repository at the given path.
 *
 * Supports `GitHub`, `GitLab`, `Bitbucket`, and `Azure DevOps`.
 *
 * Falls back to a generic, best-effort host/owner/repository detection for any other remote.
 *
 * @param path - The file system path to the Git repository.
 * @returns A promise that resolves to a DetectedGitHost object if the remote URL could be parsed, or undefined if there's no remote at all.
 */
export async function detectGitHost(path: string): Promise<DetectedGitHost | undefined> {
	const remoteUrl = await new Git({ path }).getRemoteUrl();
	if (!remoteUrl) return undefined;

	if (remoteUrl.includes("github.com")) {
		const githubOptions = detectGitHubOptions(remoteUrl);
		if (githubOptions) {
			return githubOptions;
		}
	}

	if (remoteUrl.includes("gitlab.com")) {
		const gitlabOptions = detectGitlabOptions(remoteUrl);
		if (gitlabOptions) {
			return gitlabOptions;
		}
	}

	if (/bitbucket\.(org|com)/.test(remoteUrl)) {
		const bitbucketOptions = detectBitbucketOptions(remoteUrl);
		if (bitbucketOptions) {
			return bitbucketOptions;
		}
	}

	if (remoteUrl.includes("dev.azure.com")) {
		const azureDevopsOptions = detectAzureDevopsOptions(remoteUrl);
		if (azureDevopsOptions) {
			return azureDevopsOptions;
		}
	}

	return detectGenericGitHost(remoteUrl);
}
