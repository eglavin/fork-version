import type { ForkConfig } from "../config/types";
import type { Git } from "../services/git";

export async function inspectTag(config: ForkConfig, git: Git) {
	const tag = await git.getMostRecentTag(config.tagPrefix);

	console.log(tag ?? "");
}
