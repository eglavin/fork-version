import type { DetectedGitHost } from "./detect-git-host";

/**
 * A checked out Azure Devops remote URL looks like one of these:
 *
 * | Checkout Type | Remote URL                                                                                |
 * |:------------- |:----------------------------------------------------------------------------------------- |
 * | HTTPS         | `https://{{ORGANISATION}}@dev.azure.com/{{ORGANISATION}}/{{PROJECT}}/_git/{{REPOSITORY}}` |
 * | SSH           | `git@ssh.dev.azure.com:v3/{{ORGANISATION}}/{{PROJECT}}/{{REPOSITORY}}`                    |
 */
export function detectAzureDevopsOptions(remoteUrl: string): DetectedGitHost | undefined {
	let matches: RegExpExecArray | null = null;

	if (/^https:\/\/(.*)?dev\.azure\.com/.test(remoteUrl)) {
		// [Regex101.com](https://regex101.com/r/fF7HUc/1)
		matches =
			/^https:\/\/(.*)?dev\.azure\.com\/(?<organisation>.*?)\/(?<project>.*?)\/_git\/(?<repository>.*?)(?:\.git)?$/.exec(
				remoteUrl,
			);
	} else if (remoteUrl.startsWith("git@ssh.dev.azure.com:")) {
		// [Regex101.com](https://regex101.com/r/VhNxWr/1)
		matches =
			/^git@ssh\.dev\.azure\.com:v\d\/(?<organisation>.*?)\/(?<project>.*?)\/(?<repository>.*?)(?:\.git)?$/.exec(
				remoteUrl,
			);
	}

	if (matches?.groups) {
		const { organisation = "", project = "", repository = "" } = matches.groups;

		return {
			hostName: "Azure Devops",
			changelogOptions: {
				commitUrlFormat: `https://dev.azure.com/${organisation}/${project}/_git/${repository}/commit/{{hash}}`,
				compareUrlFormat: `https://dev.azure.com/${organisation}/${project}/_git/${repository}/branchCompare?baseVersion=GT{{previousTag}}&targetVersion=GT{{currentTag}}`,
				issueUrlFormat: `https://dev.azure.com/${organisation}/${project}/_workitems/edit/{{id}}`,
			},
			commitParserOptions: {
				mergePattern: /^Merged PR (?<id>\d*): (?<source>.*)/i,
			},
		};
	}

	return undefined;
}
