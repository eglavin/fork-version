import { readFileSync } from "node:fs";

import { setupTest } from "../../../tests/setup-tests";
import { MissingPropertyException } from "../../services/file-manager";
import { InstallShieldISM } from "../install-shield-ism";

describe("files install-shield-ism", () => {
	it("should read version from an InstallShield ISM file", async () => {
		const { create, relativeTo } = await setupTest("files install-shield-ism");
		const fileManager = new InstallShieldISM();

		create.file(
			`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<?xml-stylesheet type="text/xsl" href="is.xsl" ?>
<!DOCTYPE msi [
]>
<msi version="2.0" xmlns:dt="urn:schemas-microsoft-com:datatypes">

	<table name="Property">
		<row><td>ProductCode</td><td>b8faa440-f965-44fb-9fa5-d9ea10b9f500</td><td/></row>
		<row><td>ProductName</td><td>My Product Name</td><td/></row>
		<row><td>ProductVersion</td><td>1.2.3</td><td/></row>
	</table>

</msi>
`,
			"setup.ism",
		);

		const file = await fileManager.read(relativeTo("setup.ism"));
		expect(file?.version).toBe("1.2.3");
	});

	it("should throw an error if unable to read version", async () => {
		const { create, relativeTo } = await setupTest("files install-shield-ism");
		const fileManager = new InstallShieldISM();

		create.file(
			`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<?xml-stylesheet type="text/xsl" href="is.xsl" ?>
<!DOCTYPE msi [
]>
<msi version="2.0" xmlns:dt="urn:schemas-microsoft-com:datatypes">

	<table name="Property">
		<row><td>ProductCode</td><td>b8faa440-f965-44fb-9fa5-d9ea10b9f500</td><td/></row>
		<row><td>ProductName</td><td>My Product Name</td><td/></row>
		<row><td>ProductVersion</td><td></td><td/></row>
	</table>

</msi>
`,
			"setup.ism",
		);

		await expect(async () => await fileManager.read(relativeTo("setup.ism"))).rejects.toThrow(
			MissingPropertyException,
		);
	});

	it("should write an InstallShield ISM file", async () => {
		const { create, relativeTo } = await setupTest("files install-shield-ism");
		const fileManager = new InstallShieldISM();

		create.file(
			`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<?xml-stylesheet type="text/xsl" href="is.xsl" ?>
<!DOCTYPE msi [
]>
<msi version="2.0" xmlns:dt="urn:schemas-microsoft-com:datatypes">

	<table name="Property">
		<row><td>ProductCode</td><td>b8faa440-f965-44fb-9fa5-d9ea10b9f500</td><td/></row>
		<row><td>ProductName</td><td>My Product Name</td><td/></row>
		<row><td>ProductVersion</td><td>1.2.3</td><td/></row>
	</table>

</msi>
`,
			"setup.ism",
		);

		await fileManager.write(
			{
				path: relativeTo("setup.ism"),
				version: "1.2.3",
			},
			"4.5.6",
		);

		const file = await fileManager.read(relativeTo("setup.ism"));
		expect(file?.version).toBe("4.5.6");
	});

	it("should match supported files correctly", async () => {
		const fileManager = new InstallShieldISM();

		expect(fileManager.isSupportedFile("setup.ism")).toBe(true);
		expect(fileManager.isSupportedFile("setup.msi")).toBe(false);
		expect(fileManager.isSupportedFile("package.json")).toBe(false);
	});

	it("should write an InstallShield ISM file without changing anything else", async () => {
		const { create, relativeTo } = await setupTest("files install-shield-ism");
		const fileManager = new InstallShieldISM();

		const original = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<?xml-stylesheet type="text/xsl" href="is.xsl" ?>
<!DOCTYPE msi [
	<!ELEMENT msi (summary?,table*)>
	<!ATTLIST msi version CDATA #REQUIRED>
	<!ENTITY nbsp "&#160;">
]>
<msi version="2.0" xmlns:dt="urn:schemas-microsoft-com:datatypes">

	<table name="Property">
		<row><td>ProductCode</td><td>b8faa440-f965-44fb-9fa5-d9ea10b9f500</td><td/></row>
		<row><td>ProductVersion</td><td>1.2.3</td><td/></row>
	</table>

</msi>
`;
		create.file(original, "setup.ism");

		await fileManager.write({ path: relativeTo("setup.ism"), version: "1.2.3" }, "4.5.6");

		expect(readFileSync(relativeTo("setup.ism"), "utf8")).toBe(
			original.replace("<td>1.2.3</td>", "<td>4.5.6</td>"),
		);
	});

	it("should read a version from a pretty printed row", async () => {
		const { create, relativeTo } = await setupTest("files install-shield-ism");
		const fileManager = new InstallShieldISM();

		create.file(
			`<msi version="2.0">
	<table name="Property">
		<row>
			<td>ProductVersion</td>
			<td>1.2.3</td>
			<td/>
		</row>
	</table>
</msi>
`,
			"setup.ism",
		);

		const file = await fileManager.read(relativeTo("setup.ism"));
		expect(file?.version).toBe("1.2.3");
	});

	it("should write to a self closing value cell", async () => {
		const { create, relativeTo } = await setupTest("files install-shield-ism");
		const fileManager = new InstallShieldISM();

		create.file(
			`<msi version="2.0">
	<table name="Property">
		<row><td>ProductVersion</td><td/><td/></row>
	</table>
</msi>
`,
			"setup.ism",
		);

		await fileManager.write({ path: relativeTo("setup.ism"), version: "" }, "4.5.6");

		const file = await fileManager.read(relativeTo("setup.ism"));
		expect(file?.version).toBe("4.5.6");
	});

	it("should match any property name containing ProductVersion", async () => {
		const { create, relativeTo } = await setupTest("files install-shield-ism");
		const fileManager = new InstallShieldISM();

		const original = `<msi version="2.0">
	<table name="Property">
		<row><td>ProductVersionDisplay</td><td>Version 1.2.3</td><td/></row>
		<row><td>ProductVersion</td><td>1.2.3</td><td/></row>
	</table>
</msi>
`;
		create.file(original, "setup.ism");

		// The name cell is matched as a substring, so the display row matches too and is kept in
		// step with the real property rather than being left behind.
		const file = await fileManager.read(relativeTo("setup.ism"));
		expect(file?.version).toBe("Version 1.2.3");

		await fileManager.write({ path: relativeTo("setup.ism"), version: "1.2.3" }, "4.5.6");

		expect(readFileSync(relativeTo("setup.ism"), "utf8")).toBe(
			original
				.replace("<td>Version 1.2.3</td>", "<td>4.5.6</td>")
				.replace("<td>1.2.3</td>", "<td>4.5.6</td>"),
		);
	});
});
