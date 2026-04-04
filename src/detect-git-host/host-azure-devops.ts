/**
 * A checked out Azure DevOps remote URL looks like one of these:
 *
 * | Checkout Type | Remote URL                                                                                |
 * | ------------- | ----------------------------------------------------------------------------------------- |
 * | HTTPS         | `https://{{ORGANISATION}}@dev.azure.com/{{ORGANISATION}}/{{PROJECT}}/_git/{{REPOSITORY}}` |
 * | SSH           | `git@ssh.dev.azure.com:v3/{{ORGANISATION}}/{{PROJECT}}/{{REPOSITORY}}`                    |
 */
export function detectAzureDevopsOptions(remoteUrl: string) {
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
				organisation,
				project,
				repository,
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
				organisation,
				project,
				repository,
			};
		}
	}

	return undefined;
}
