import { setupTest } from "../../../tests/setup-tests";
import { getUserConfig } from "../user-config";

describe("user-config", () => {
	it("should have the default command set", async () => {
		const { testFolder } = await setupTest("load-config");

		const config = await getUserConfig({
			input: [],
			flags: {
				path: testFolder,
			},
		});

		expect(config).toBeDefined();
		expect(config.command).toBe("main");
		expect(config.silent).toBe(false);
	});

	it("should be able to set the command via cli args", async () => {
		const { testFolder } = await setupTest("load-config");

		const config = await getUserConfig({
			input: ["inspect-version"],
			flags: {
				path: testFolder,
			},
		});

		expect(config).toBeDefined();
		expect(config.command).toBe("inspect-version");
		expect(config.silent).toBe(true);
	});

	it("should be able to set the command via config file", async () => {
		const { testFolder, create } = await setupTest("user-config");

		create.json({ command: "inspect-version" }, "fork.config.json");
		const config = await getUserConfig({
			input: [],
			flags: {
				path: testFolder,
			},
		});

		expect(config).toBeDefined();
		expect(config.command).toBe("inspect-version");
	});

	it("should prefer cli args over config file", async () => {
		const { testFolder, create } = await setupTest("user-config");

		create.json({ command: "main" }, "fork.config.json");
		const config = await getUserConfig({
			input: ["inspect-version"],
			flags: {
				path: testFolder,
			},
		});

		expect(config).toBeDefined();
		expect(config.command).toBe("inspect-version");
	});

	it("should respect deprecated --inspect-version flag", async () => {
		const { testFolder, create } = await setupTest("user-config");

		create.json({ inspectVersion: true }, "fork.config.json");
		const config = await getUserConfig({
			input: ["inspect-tag"],
			flags: {
				path: testFolder,
			},
		});

		expect(config).toBeDefined();
		expect(config.command).toBe("inspect-version");
	});
});
