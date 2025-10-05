import { setupTest } from "../../../tests/setup-tests";
import { FileManager } from "../../files/file-manager";
import { inspectVersion } from "../inspect-version";

describe("inspect-version", () => {
	it("should log the version and exit if inspectVersion set", async () => {
		const spyOnConsole = vi.spyOn(console, "log").mockImplementation(() => undefined);

		const { config, create, execGit, git, logger } = await setupTest("inspect-version");
		config.command = "inspect-version";
		const fileManager = new FileManager(config, logger);

		create.json({ version: "1.2.3" }, "package.json").add();
		execGit.commits();

		await inspectVersion(config, logger, fileManager, git);
		expect(spyOnConsole).toHaveBeenCalledWith("1.2.3");

		spyOnConsole.mockRestore();
	});

	it("should log the version from a git tag", async () => {
		const spyOnConsole = vi.spyOn(console, "log").mockImplementation(() => undefined);

		const { config, create, execGit, git, logger } = await setupTest("inspect-version");
		config.command = "inspect-version";
		config.gitTagFallback = true; // Defaults to off when running tests.
		const fileManager = new FileManager(config, logger);

		create.file(`Hello World`, "README.md").add();
		execGit.commit("feat: first commit");
		execGit.tag("v2.3.4", "feat: first commit");

		await inspectVersion(config, logger, fileManager, git);
		expect(spyOnConsole).toHaveBeenCalledWith("2.3.4");

		spyOnConsole.mockRestore();
	});

	it("should not throw if no version found", async () => {
		const spyOnConsole = vi.spyOn(console, "log").mockImplementation(() => undefined);

		const { config, git, logger } = await setupTest("inspect-version");
		config.command = "inspect-version";
		const fileManager = new FileManager(config, logger);

		await inspectVersion(config, logger, fileManager, git);
		expect(spyOnConsole).toHaveBeenCalledWith("");

		spyOnConsole.mockRestore();
	});
});
