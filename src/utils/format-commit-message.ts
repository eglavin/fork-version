/**
 * Formats the commit message by replacing the `{{currentTag}}` placeholder
 * globally with the new version.
 *
 * Falls back to `chore(release): {{currentTag}}` if message is argument is falsy.
 */
export function formatCommitMessage(message: string | undefined, version: string): string {
	if (!message) {
		message = "chore(release): {{currentTag}}";
	}

	return message.replaceAll(new RegExp("{{currentTag}}", "g"), version);
}
