export { CommitParser } from "./commit-parser/commit-parser";
export { filterRevertedCommits } from "./commit-parser/filter-reverted-commits";
export { createParserOptions, type ParserOptions } from "./commit-parser/options";
export type {
	Commit,
	CommitMerge,
	CommitRevert,
	CommitReference,
	CommitNote,
} from "./commit-parser/types";

export { ForkConfigSchema } from "./config/schema";
export type { ForkConfig, Config } from "./config/types";
export { defineConfig } from "./config/define-config";
export { getUserConfig } from "./config/user-config";

export { getCommitsSinceTag, type CommitsSinceTag } from "./process/get-commits";
export {
	getCurrentVersion,
	getNextVersion,
	type CurrentVersion,
	type NextVersion,
} from "./process/version";
export { updateChangelog } from "./process/changelog";
export { commitChanges } from "./process/commit";
export { tagChanges } from "./process/tag";

export { FileManager, type FileState, type IFileManager } from "./files/file-manager";

export { Logger } from "./utils/logger";
export { Git } from "./utils/git";
