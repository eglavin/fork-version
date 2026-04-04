import { detectAzureDevopsOptions } from "../host-azure-devops";

describe("host-azure-devops", () => {
	it("should detect a https azure git host", () => {
		const gitHost = detectAzureDevopsOptions(
			"https://ORGANISATION@dev.azure.com/ORGANISATION/PROJECT/_git/REPOSITORY",
		);

		expect(gitHost?.organisation).toBe("ORGANISATION");
		expect(gitHost?.project).toBe("PROJECT");
		expect(gitHost?.repository).toBe("REPOSITORY");
	});

	it("should detect a ssh azure git host", () => {
		const gitHost = detectAzureDevopsOptions(
			"git@ssh.dev.azure.com:v3/ORGANISATION/PROJECT/REPOSITORY",
		);

		expect(gitHost?.organisation).toBe("ORGANISATION");
		expect(gitHost?.project).toBe("PROJECT");
		expect(gitHost?.repository).toBe("REPOSITORY");
	});
});
