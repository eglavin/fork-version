import { Git } from "../services/git";
import type { ForkConfig } from "./types";

export interface DetectedGitHost {
	host: string;
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

	// A checked out Azure DevOps remote URL looks like one of these:
	//
	// | Checkout Type | Remote URL                                                                              |
	// | ------------- | --------------------------------------------------------------------------------------- |
	// | HTTPS         | https://{{ORGANISATION}}@dev.azure.com/{{ORGANISATION}}/{{PROJECT}}/_git/{{REPOSITORY}} |
	// | SSH           | git@ssh.dev.azure.com:v3/{{ORGANISATION}}/{{PROJECT}}/{{REPOSITORY}}                    |
	//
	if (remoteUrl.startsWith("https://") && remoteUrl.includes("@dev.azure.com/")) {
		/**
		 * [Regex101.com](https://regex101.com/r/fF7HUc/1)
		 */
		const match =
			/^https:\/\/(?<atorganisation>.*?)@dev.azure.com\/(?<organisation>.*?)\/(?<project>.*?)\/_git\/(?<repository>.*?)(?:\.git)?$/.exec(
				remoteUrl,
			);

		if (match?.groups) {
			const { organisation = "", project = "", repository = "" } = match.groups;

			return {
				host: "Azure",
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
	} else if (remoteUrl.startsWith("git@ssh.dev.azure.com:")) {
		/**
		 * [Regex101.com](https://regex101.com/r/VhNxWr/1)
		 */
		const match =
			/^git@ssh.dev.azure.com:v\d\/(?<organisation>.*?)\/(?<project>.*?)\/(?<repository>.*?)(?:\.git)?$/.exec(
				remoteUrl,
			);

		if (match?.groups) {
			const { organisation = "", project = "", repository = "" } = match.groups;

			return {
				host: "Azure",
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
	}

	return null;
}
