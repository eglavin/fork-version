import type { DetectedGitHost } from "./detect-git-host";

/**
 * A checked out Bitbucket remote URL looks like one of these:
 *
 * | Checkout Type | Remote URL                                                                |
 * |:------------- |:------------------------------------------------------------------------- |
 * | HTTPS         | `https://{{WORKSPACE}}@bitbucket.org/{{ORGANISATION}}/{{REPOSITORY}}.git` |
 * | SSH           | `git@bitbucket.org:{{ORGANISATION}}/{{REPOSITORY}}.git`                   |
 */
export function detectBitbucketOptions(remoteUrl: string): DetectedGitHost | undefined {
	let matches: RegExpExecArray | null = null;

	if (/^https:\/\/(.*)?bitbucket\.(org|com)/.test(remoteUrl)) {
		// [Regex101.com](https://regex101.com/r/FHvGKM/1)
		matches =
			/^https:\/\/(.*)?bitbucket\.(?<domain>org|com)\/(?<organisation>.*?)\/(?<repository>.*?)(?:\.git)?$/.exec(
				remoteUrl,
			);
	} else if (remoteUrl.startsWith("git@bitbucket.org:")) {
		// [Regex101.com](https://regex101.com/r/N0Wj0h/1)
		matches =
			/^git@bitbucket\.(?<domain>org|com):(?<organisation>.*?)\/(?<repository>.*?)(?:\.git)?$/.exec(
				remoteUrl,
			);
	}

	if (matches?.groups) {
		const { domain = "", organisation = "", repository = "" } = matches.groups;

		return {
			hostName: "Bitbucket",
			changelogOptions: {
				commitUrlFormat: `https://bitbucket.${domain}/${organisation}/${repository}/commits/{{hash}}`,
				compareUrlFormat: `https://bitbucket.${domain}/${organisation}/${repository}/branches/compare/{{currentTag}}..{{previousTag}}`,
				// Bitbucket doesn't have a builtin issue tracker like GitHub or GitLab, this should be overridden by the user if they want to link to issues in their changelog.
				issueUrlFormat: `https://bitbucket.${domain}/${organisation}/${repository}/issues/{{id}}`,
			},
			commitParserOptions: {
				mergePattern: /^Merged in (?<source>.*) \(pull request #(?<id>\d*)\)/i,
			},
		};
	}

	return undefined;
}
