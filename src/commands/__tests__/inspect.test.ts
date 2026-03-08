import { setupTest } from "../../../tests/setup-tests";
import { FileManager } from "../../files/file-manager";
import { inspect } from "../inspect";

describe("inspect", () => {
	it("should log the version and tag and exit if inspect set", async () => {
		const spyOnConsoleLog = vi.spyOn(console, "log").mockImplementation(() => undefined);
		const spyOnConsoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

		const { config, create, execGit, git, logger } = await setupTest("inspect");
		config.command = "inspect";
		const fileManager = new FileManager(config, logger);

		create.json({ version: "1.2.3" }, "package.json").add();
		execGit.commit("feat: first commit");
		execGit.tag("v1.2.3", "feat: first commit");

		await inspect(config, logger, fileManager, git);

		expect(spyOnConsoleLog).toHaveBeenCalledWith(`Version: 1.2.3
Tag: v1.2.3`);
		expect(spyOnConsoleError).not.toHaveBeenCalled();
	});

	it("should log a warning if no version or tag found", async () => {
		const spyOnConsoleLog = vi.spyOn(console, "log").mockImplementation(() => undefined);
		const spyOnConsoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
		const processExitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);

		const { config, git, logger } = await setupTest("inspect");
		config.command = "inspect";
		const fileManager = new FileManager(config, logger);

		await inspect(config, logger, fileManager, git);

		expect(spyOnConsoleLog).not.toHaveBeenCalled();
		expect(spyOnConsoleError).toHaveBeenCalledWith(
			"No version found. Make sure you have at least one tag in your repository.",
		);
		expect(processExitSpy).toHaveBeenCalledWith(1);
	});

	it("should log the version and tag in JSON format if asJson set", async () => {
		const spyOnConsoleLog = vi.spyOn(console, "log").mockImplementation(() => undefined);

		const { config, create, execGit, git, logger } = await setupTest("inspect");
		config.command = "inspect";
		config.asJson = true;
		const fileManager = new FileManager(config, logger);

		create.json({ version: "1.2.3" }, "package.json").add();
		execGit.commit("feat: first commit");
		execGit.tag("v1.2.3", "feat: first commit");

		await inspect(config, logger, fileManager, git);

		expect(spyOnConsoleLog).toHaveBeenCalledWith(
			JSON.stringify({ version: "1.2.3", tag: "v1.2.3" }, null, 2),
		);
	});

	it("should log from files if no tag found but version found in files", async () => {
		const spyOnConsoleLog = vi.spyOn(console, "log").mockImplementation(() => undefined);

		const { config, create, execGit, git, logger } = await setupTest("inspect");
		config.command = "inspect";
		const fileManager = new FileManager(config, logger);

		create.json({ version: "1.2.3" }, "package.json").add();
		execGit.commit("feat: first commit");

		await inspect(config, logger, fileManager, git);

		expect(spyOnConsoleLog).toHaveBeenCalledWith(`Version: 1.2.3
Tag:`);
	});

	it("should log from tags if no version found in files but tag found", async () => {
		const spyOnConsoleLog = vi.spyOn(console, "log").mockImplementation(() => undefined);

		const { config, create, execGit, git, logger } = await setupTest("inspect");
		config.command = "inspect";
		config.gitTagFallback = true; // Defaults to off when running tests.
		const fileManager = new FileManager(config, logger);

		create.file(`Hello World`, "README.md").add();
		execGit.commit("feat: first commit");
		execGit.tag("v1.2.3", "feat: first commit");

		await inspect(config, logger, fileManager, git);

		expect(spyOnConsoleLog).toHaveBeenCalledWith(`Version: 1.2.3
Tag: v1.2.3`);
	});

	it("should log only the version if inspect-version command", async () => {
		const spyOnConsoleLog = vi.spyOn(console, "log").mockImplementation(() => undefined);

		const { config, create, execGit, git, logger } = await setupTest("inspect");
		config.command = "inspect-version";
		const fileManager = new FileManager(config, logger);

		create.json({ version: "1.2.3" }, "package.json").add();
		execGit.commit("feat: first commit");
		execGit.tag("v1.2.3", "feat: first commit");

		await inspect(config, logger, fileManager, git);

		expect(spyOnConsoleLog).toHaveBeenCalledWith("1.2.3");
	});

	it("should log only the version in JSON format if inspect-version command and asJson set", async () => {
		const spyOnConsoleLog = vi.spyOn(console, "log").mockImplementation(() => undefined);

		const { config, create, execGit, git, logger } = await setupTest("inspect");
		config.command = "inspect-version";
		config.asJson = true;
		const fileManager = new FileManager(config, logger);

		create.json({ version: "1.2.3" }, "package.json").add();
		execGit.commit("feat: first commit");
		execGit.tag("v1.2.3", "feat: first commit");

		await inspect(config, logger, fileManager, git);

		expect(spyOnConsoleLog).toHaveBeenCalledWith(JSON.stringify({ version: "1.2.3" }, null, 2));
	});

	it("should log only the tag if inspect-tag command", async () => {
		const spyOnConsoleLog = vi.spyOn(console, "log").mockImplementation(() => undefined);

		const { config, create, execGit, git, logger } = await setupTest("inspect");
		config.command = "inspect-tag";
		const fileManager = new FileManager(config, logger);

		create.json({ version: "1.2.3" }, "package.json").add();
		execGit.commit("feat: first commit");
		execGit.tag("v1.2.3", "feat: first commit");

		await inspect(config, logger, fileManager, git);

		expect(spyOnConsoleLog).toHaveBeenCalledWith("v1.2.3");
	});

	it("should log only the tag in JSON format if inspect-tag command and asJson set", async () => {
		const spyOnConsoleLog = vi.spyOn(console, "log").mockImplementation(() => undefined);

		const { config, create, execGit, git, logger } = await setupTest("inspect");
		config.command = "inspect-tag";
		config.asJson = true;
		const fileManager = new FileManager(config, logger);

		create.json({ version: "1.2.3" }, "package.json").add();
		execGit.commit("feat: first commit");
		execGit.tag("v1.2.3", "feat: first commit");

		await inspect(config, logger, fileManager, git);

		expect(spyOnConsoleLog).toHaveBeenCalledWith(JSON.stringify({ tag: "v1.2.3" }, null, 2));
	});
});
