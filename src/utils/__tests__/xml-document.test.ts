import {
	MalformedMarkupException,
	applyEdits,
	detectEol,
	endOf,
	findChild,
	findChildren,
	indentOf,
	insertAfter,
	parseMarkup,
	removeElement,
	replaceText,
	textOf,
} from "../xml-document";

function firstElement(source: string, ...path: string[]) {
	let node = findChild(parseMarkup(source), path[0]);

	for (const name of path.slice(1)) {
		node = findChild(node, name);
	}

	if (!node) {
		throw new Error(`Unable to find ${path.join(" > ")} in the test document.`);
	}

	return node;
}

describe("xml-document", () => {
	describe("findChildren", () => {
		it("should only match direct children", () => {
			const document = parseMarkup("<Project><Target><Version>1.2.3</Version></Target></Project>");
			const project = findChild(document, "Project");

			expect(findChildren(project, "Version")).toHaveLength(0);
			expect(findChildren(project, "Target")).toHaveLength(1);
		});

		it("should match tag names case sensitively", () => {
			const document = parseMarkup("<Project><version>1.2.3</version></Project>");
			const project = findChild(document, "Project");

			expect(findChildren(project, "Version")).toHaveLength(0);
			expect(findChildren(project, "version")).toHaveLength(1);
		});

		it("should return every match in document order", () => {
			const document = parseMarkup(
				"<Project><Version>1.2.3</Version><Version>4.5.6</Version></Project>",
			);

			expect(findChildren(findChild(document, "Project"), "Version").map(textOf)).toEqual([
				"1.2.3",
				"4.5.6",
			]);
		});
	});

	describe("textOf", () => {
		it("should read text from nested elements, comments and cdata sections", () => {
			expect(textOf(firstElement("<Version>1.2.3</Version>", "Version"))).toBe("1.2.3");
			expect(textOf(firstElement("<Version>1.<b>2</b>.3</Version>", "Version"))).toBe("1.2.3");
			expect(textOf(firstElement("<Version>1.2<!--x-->.3</Version>", "Version"))).toBe("1.2.3");
			expect(textOf(firstElement("<Version><![CDATA[1.2.3]]></Version>", "Version"))).toBe("1.2.3");
		});

		it("should leave entities encoded", () => {
			expect(textOf(firstElement("<Version>1.0&amp;0</Version>", "Version"))).toBe("1.0&amp;0");
		});
	});

	describe("endOf", () => {
		it("should find the closing bracket when the close tag has trailing whitespace", () => {
			const source = "<Project><Version>1.2.3</Version ></Project>";
			const version = firstElement(source, "Project", "Version");

			expect(source[endOf(source, version)]).toBe(">");
		});

		it("should throw when the element is never closed", () => {
			const source = "<Project><Version>1.2.3";
			const version = firstElement(source, "Project", "Version");

			expect(() => endOf(source, version)).toThrow(MalformedMarkupException);
		});
	});

	describe("detectEol", () => {
		it("should detect the line ending used by the document", () => {
			expect(detectEol("<a>\n</a>")).toBe("\n");
			expect(detectEol("<a>\r\n</a>")).toBe("\r\n");
			expect(detectEol("<a></a>")).toBe("\n");
		});
	});

	describe("indentOf", () => {
		it("should return the whitespace preceding the element on its own line", () => {
			const source = "<Project>\n\t\t<Version>1.2.3</Version>\n</Project>";

			expect(indentOf(source, firstElement(source, "Project", "Version"))).toBe("\t\t");
		});

		it("should return nothing when the element shares a line", () => {
			const source = "<Project><Version>1.2.3</Version></Project>";

			expect(indentOf(source, firstElement(source, "Project", "Version"))).toBe("");
		});
	});

	describe("applyEdits", () => {
		it("should apply edits against positions in the original source", () => {
			const source = "abcdef";

			expect(
				applyEdits(source, [
					{ start: 0, end: 1, text: "AAAAA" },
					{ start: 4, end: 5, text: "E" },
				]),
			).toBe("AAAAAbcdEf");
		});

		it("should throw when edits overlap", () => {
			expect(() =>
				applyEdits("abcdef", [
					{ start: 0, end: 3, text: "x" },
					{ start: 2, end: 5, text: "y" },
				]),
			).toThrow(MalformedMarkupException);
		});
	});

	describe("replaceText", () => {
		it("should replace the text of an element", () => {
			const source = "<Project><Version>1.2.3</Version></Project>";

			expect(
				applyEdits(source, [
					replaceText(source, firstElement(source, "Project", "Version"), "4.5.6"),
				]),
			).toBe("<Project><Version>4.5.6</Version></Project>");
		});

		it("should fill an empty element", () => {
			const source = "<Project><Version></Version></Project>";

			expect(
				applyEdits(source, [
					replaceText(source, firstElement(source, "Project", "Version"), "4.5.6"),
				]),
			).toBe("<Project><Version>4.5.6</Version></Project>");
		});

		it("should expand a self closing element", () => {
			const source = '<Project><Version Foo="bar" /></Project>';

			expect(
				applyEdits(source, [
					replaceText(source, firstElement(source, "Project", "Version"), "4.5.6"),
				]),
			).toBe('<Project><Version Foo="bar">4.5.6</Version></Project>');
		});

		it("should escape characters that would otherwise be markup", () => {
			const source = "<Project><Version>1.2.3</Version></Project>";

			expect(
				applyEdits(source, [
					replaceText(source, firstElement(source, "Project", "Version"), "1&2<3"),
				]),
			).toBe("<Project><Version>1&amp;2&lt;3</Version></Project>");
		});
	});

	describe("insertAfter", () => {
		it("should match the indentation and line ending of the document", () => {
			const source = "<Project>\r\n\t<Version>1.2.3</Version>\r\n</Project>\r\n";
			const version = firstElement(source, "Project", "Version");

			expect(applyEdits(source, [insertAfter(source, version, "<Extra>x</Extra>")])).toBe(
				"<Project>\r\n\t<Version>1.2.3</Version>\r\n\t<Extra>x</Extra>\r\n</Project>\r\n",
			);
		});
	});

	describe("removeElement", () => {
		it("should remove the element along with the line it sits on", () => {
			const source = "<Project>\n\t<Version>1.2.3</Version>\n\t<Extra>x</Extra>\n</Project>\n";
			const extra = firstElement(source, "Project", "Extra");

			expect(applyEdits(source, [removeElement(source, extra)])).toBe(
				"<Project>\n\t<Version>1.2.3</Version>\n</Project>\n",
			);
		});

		it("should not leave an orphaned carriage return", () => {
			const source =
				"<Project>\r\n\t<Version>1.2.3</Version>\r\n\t<Extra>x</Extra>\r\n</Project>\r\n";
			const extra = firstElement(source, "Project", "Extra");

			expect(applyEdits(source, [removeElement(source, extra)])).toBe(
				"<Project>\r\n\t<Version>1.2.3</Version>\r\n</Project>\r\n",
			);
		});
	});
});
