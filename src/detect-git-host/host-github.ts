import type { DetectedGitHost } from "./detect-git-host";

/**
 * A checked out GitHub remote URL looks like one of these:
 *
 * | Checkout Type | Remote URL                                               |
 * |:------------- |:-------------------------------------------------------- |
 * | HTTPS         | `https://github.com/{{ORGANISATION}}/{{REPOSITORY}}.git` |
 * | SSH           | `git@github.com:{{ORGANISATION}}/{{REPOSITORY}}.git`		  |
 */
export function detectGitHubOptions(remoteUrl: string): DetectedGitHost | undefined {
	let matches: RegExpExecArray | null = null;

	if (/^https:\/\/(.*)?github\.com/.test(remoteUrl)) {
		// [Regex101.com](https://regex101.com/r/yYNL1B/1)
		matches =
			/^https:\/\/(.*)?github\.com\/(?<organisation>.*?)\/(?<repository>.*?)(?:\.git)?$/.exec(
				remoteUrl,
			);
	} else if (remoteUrl.startsWith("git@github.com:")) {
		// [Regex101.com](https://regex101.com/r/Nl8GbV/1)
		matches = /^git@github\.com:(?<organisation>.*?)\/(?<repository>.*?)(?:\.git)?$/.exec(
			remoteUrl,
		);
	}

	if (matches?.groups) {
		const { organisation = "", repository = "" } = matches.groups;

		return {
			hostName: "GitHub",
			changelogOptions: {
				commitUrlFormat: `https://github.com/${organisation}/${repository}/commit/{{hash}}`,
				compareUrlFormat: `https://github.com/${organisation}/${repository}/compare/{{previousTag}}...{{currentTag}}`,
				issueUrlFormat: `https://github.com/${organisation}/${repository}/issues/{{id}}`,
				issuePrefixes: ["#", "gh-"],
			},
			commitParserOptions: {
				mergePattern: /^Merge pull request #(?<id>\d*) from (?<source>.*)/i,
				issuePrefixes: ["#", "gh-"],
			},
		};
	}

	return undefined;
}
