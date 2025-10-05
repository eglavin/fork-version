import { setupTest } from "../../../tests/setup-tests";
import { inspectTag } from "../inspect-tag";

describe("inspect-tag", () => {
	it("should log the most recent tag and exit if inspectTag set", async () => {
		const spyOnConsole = vi.spyOn(console, "log").mockImplementation(() => undefined);

		const { config, execGit, git, create } = await setupTest("inspect-tag");
		config.command = "inspect-tag";

		create.json({ version: "1.2.3" }, "package.json").add();
		execGit.commit("feat: first commit");
		execGit.tag("v1.2.3", "feat: first commit");

		await inspectTag(config, git);
		expect(spyOnConsole).toHaveBeenCalledWith("v1.2.3");

		spyOnConsole.mockRestore();
	});

	it("should log nothing and exit if no tags found", async () => {
		const spyOnConsole = vi.spyOn(console, "log").mockImplementation(() => undefined);

		const { config, git } = await setupTest("inspect-tag");
		config.command = "inspect-tag";

		await inspectTag(config, git);
		expect(spyOnConsole).toHaveBeenCalledWith("");

		spyOnConsole.mockRestore();
	});
});
