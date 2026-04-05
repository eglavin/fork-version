import type { DetectedGitHost } from "./detect-git-host";

/**
 * A checked out GitLab remote URL looks like one of these:
 *
 * | Checkout Type | Remote URL                                               |
 * |:------------- |:-------------------------------------------------------- |
 * | HTTPS         | `https://gitlab.com/{{ORGANISATION}}/{{REPOSITORY}}.git` |
 * | SSH           | `git@gitlab.com:{{ORGANISATION}}/{{REPOSITORY}}.git`     |
 */
export function detectGitlabOptions(remoteUrl: string): DetectedGitHost | undefined {
	let matches: RegExpExecArray | null = null;

	if (/^https:\/\/(.*)?gitlab\.com/.test(remoteUrl)) {
		// [Regex101.com](https://regex101.com/r/9c7j3t/1)
		matches =
			/^https:\/\/(.*)?gitlab\.com\/(?<organisation>.*?)\/(?<repository>.*?)(?:\.git)?$/.exec(
				remoteUrl,
			);
	} else if (remoteUrl.startsWith("git@gitlab.com:")) {
		// [Regex101.com](https://regex101.com/r/6H8TYR/1)
		matches = /^git@gitlab\.com:(?<organisation>.*?)\/(?<repository>.*?)(?:\.git)?$/.exec(
			remoteUrl,
		);
	}

	if (matches?.groups) {
		const { organisation = "", repository = "" } = matches.groups;

		return {
			hostName: "GitLab",
			changelogOptions: {
				commitUrlFormat: `https://gitlab.com/${organisation}/${repository}/-/commit/{{hash}}`,
				compareUrlFormat: `https://gitlab.com/${organisation}/${repository}/-/compare/{{previousTag}}...{{currentTag}}`,
				issueUrlFormat: `https://gitlab.com/${organisation}/${repository}/-/issues/{{id}}`,
			},
			commitParserOptions: {
				mergePattern: /^Merge branch '(?<source>.*)' into '(.*)'/i,
				// https://docs.gitlab.com/user/project/issues/managing_issues/#default-closing-pattern
				referenceActions: [
					"close",
					"closes",
					"closed",
					"closing",
					"fix",
					"fixes",
					"fixed",
					"fixing",
					"resolve",
					"resolves",
					"resolved",
					"resolving",
					"implement",
					"implements",
					"implemented",
					"implementing",
				],
			},
		};
	}

	return undefined;
}
