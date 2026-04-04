import { Git } from "../services/git";
import type { ForkConfig } from "../config/types";

import { detectAzureDevopsOptions } from "./host-azure-devops";

export interface DetectedGitHost {
	hostName: string;
	changelogOptions: ForkConfig["changelogPresetConfig"];
	commitParserOptions: ForkConfig["commitParserOptions"];
}

/**
 * Conventional-Changelog already supports the following git hosts:
 * - Github
 * - Gitlab
 * - Bitbucket
 *
 * We want to detect if the user is using another host such as Azure DevOps,
 * if so we need to create the correct URLs so the changelog is generated
 * correctly.
 */
export async function detectGitHost(path: string): Promise<DetectedGitHost | null> {
	const remoteUrl = await new Git({ path }).getRemoteUrl();

	const azureDevopsOptions = detectAzureDevopsOptions(remoteUrl);
	if (azureDevopsOptions) {
		const { organisation, project, repository } = azureDevopsOptions;

		return {
			hostName: "Azure Devops",
			changelogOptions: {
				commitUrlFormat: `{{host}}/${organisation}/${project}/_git/${repository}/commit/{{hash}}`,
				compareUrlFormat: `{{host}}/${organisation}/${project}/_git/${repository}/branchCompare?baseVersion=GT{{previousTag}}&targetVersion=GT{{currentTag}}`,
				issueUrlFormat: `{{host}}/${organisation}/${project}/_workitems/edit/{{id}}`,
			},
			commitParserOptions: {
				mergePattern: /^Merged PR (?<id>\d+): (?<source>.*?)\s*$/i,
			},
		};
	}

	return null;
}
