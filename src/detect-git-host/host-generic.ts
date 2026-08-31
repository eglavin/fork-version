import type { DetectedGitHost } from "./detect-git-host";

/**
 * Best-effort fallback for any git remote that isn't one of the specifically implemented git hosts
 * (a self-hosted GitLab/Gitea instance, GitHub Enterprise, sourcehut, etc.).
 *
 * | Checkout Type | Remote URL                                                        |
 * |:------------- |:----------------------------------------------------------------- |
 * | HTTPS         | `https://{{HOST}}/{{ORGANISATION}}/{{REPOSITORY}}.git`            |
 * | SSH           | `git@{{HOST}}:{{ORGANISATION}}/{{REPOSITORY}}.git`                |
 * | SSH (URL)     | `ssh://git@{{HOST}}:{{PORT}}/{{ORGANISATION}}/{{REPOSITORY}}.git` |
 */
export function detectGenericGitHost(remoteUrl: string): DetectedGitHost | undefined {
	// [Regex101.com](https://regex101.com/r/eCw2OE/1)
	const httpsMatch =
		/^(?<protocol>https?):\/\/(?:[^@/]+@)?(?<host>[^/]+)\/(?<organisation>.*?)\/(?<repository>.*?)(?:\.git)?\/?$/.exec(
			remoteUrl,
		);
	// [Regex101.com](https://regex101.com/r/tuqvSX/1)
	const sshMatch =
		/^(?:ssh:\/\/)?(?:[^@/]+@)?(?<host>[^:/]+)(?::\d+)?[:/](?<organisation>.*?)\/(?<repository>.*?)(?:\.git)?\/?$/.exec(
			remoteUrl,
		);

	let host = "";
	let organisation = "";
	let repository = "";

	if (httpsMatch?.groups) {
		host = `${httpsMatch.groups.protocol}://${httpsMatch.groups.host}`;
		organisation = httpsMatch.groups.organisation || "";
		repository = httpsMatch.groups.repository || "";
	} else if (sshMatch?.groups) {
		host = `https://${sshMatch.groups.host}`;
		organisation = sshMatch.groups.organisation || "";
		repository = sshMatch.groups.repository || "";
	}

	if (!host || !organisation || !repository) {
		return undefined;
	}

	return {
		hostName: host,
		commitParser: {},
		changelogWriter: {
			commitUrlFormat: `${host}/${organisation}/${repository}/commit/{{hash}}`,
			compareUrlFormat: `${host}/${organisation}/${repository}/compare/{{previousTag}}...{{currentTag}}`,
			issueUrlFormat: `${host}/${organisation}/${repository}/issues/{{id}}`,
		},
	};
}
