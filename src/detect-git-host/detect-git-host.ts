import { Git } from "../services/git";
import type { ForkConfig } from "../config/types";

import { detectGitHubOptions } from "./host-github";
import { detectGitlabOptions } from "./host-gitlab";
import { detectBitbucketOptions } from "./host-bitbucket";
import { detectAzureDevopsOptions } from "./host-azure-devops";

export interface DetectedGitHost {
	hostName: string;
	changelogOptions: ForkConfig["changelogPresetConfig"];
	commitParserOptions: ForkConfig["commitParserOptions"];
}

/**
 * Detects the Git hosting service based on the remote URL of the Git repository at the given path.
 *
 * Supports `GitHub`, `GitLab`, `Bitbucket`, and `Azure DevOps`.
 *
 * @param path - The file system path to the Git repository.
 * @returns A promise that resolves to a DetectedGitHost object if a supported host is detected, or undefined if no supported host is found.
 */
export async function detectGitHost(path: string): Promise<DetectedGitHost | undefined> {
	const remoteUrl = await new Git({ path }).getRemoteUrl();

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

	return undefined;
}
