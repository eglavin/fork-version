import { DomUtils, parseDocument } from "htmlparser2";
import { isTag, type Document, type Element, type ParentNode } from "domhandler";

/**
 * A pending change to a source document, expressed as a range of the *original* text to
 * replace. Ranges are half open: `[start, end)`.
 */
export interface MarkupEdit {
	start: number;
	end: number;
	text: string;
}

export interface ParseMarkupOptions {
	/**
	 * Parse as XML rather than HTML. HTML mode lower cases tag and attribute names, allows void
	 * elements and infers missing close tags. See the note on {@link replaceText}.
	 * @default true
	 */
	xmlMode?: boolean;
}

/**
 * Thrown when the source document can't be edited safely, for example when an element has no
 * closing angle bracket because the file is truncated. Callers should leave the file untouched
 * rather than write a partially spliced document.
 */
export class MalformedMarkupException extends Error {
	constructor(message: string) {
		super(message);
		this.name = "MalformedMarkupException";
	}
}

/**
 * Parse a document, recording the source position of every node.
 *
 * Entities are deliberately left encoded so a version string round trips exactly as the user
 * wrote it, matching the behaviour fork-version has had since #40.
 */
export function parseMarkup(source: string, options?: ParseMarkupOptions): Document {
	return parseDocument(source, {
		xmlMode: options?.xmlMode ?? true,
		decodeEntities: false,
		withStartIndices: true,
		withEndIndices: true,
	});
}

/**
 * Read the text of an element and its descendants.
 */
export function textOf(element: ParentNode | undefined): string {
	return element ? DomUtils.textContent(element) : "";
}

/**
 * Find the direct children of `parent` with the given tag name, in document order.
 */
export function findChildren(parent: ParentNode | undefined, name: string): Element[] {
	if (!parent) {
		return [];
	}

	return parent.children.filter((child): child is Element => isTag(child) && child.name === name);
}

/**
 * Find the first direct child of `parent` with the given tag name.
 */
export function findChild(parent: ParentNode | undefined, name: string): Element | undefined {
	return findChildren(parent, name)[0];
}

/**
 * The index of the `>` that closes an element.
 *
 * `endIndex` normally points at that bracket, but when a closing tag carries trailing whitespace
 * (`</Version >`) the parser stops at the end of the tag name instead, so splicing on `endIndex`
 * alone would leave a stray `>` behind.
 */
export function endOf(source: string, element: Element): number {
	if (element.endIndex === null) {
		throw new MalformedMarkupException(
			`Unable to locate the end of the <${element.name}> element.`,
		);
	}

	if (source[element.endIndex] === ">") {
		return element.endIndex;
	}

	const closingBracket = source.indexOf(">", element.endIndex);
	if (closingBracket === -1) {
		throw new MalformedMarkupException(`The <${element.name}> element is not closed.`);
	}

	return closingBracket;
}

/**
 * The index of the `<` that opens an element.
 */
function startOf(source: string, element: Element): number {
	if (element.startIndex === null) {
		throw new MalformedMarkupException(
			`Unable to locate the start of the <${element.name}> element.`,
		);
	}

	return element.startIndex;
}

/**
 * The line ending used by a document, so inserted lines match the surrounding file.
 */
export function detectEol(source: string): string {
	return source.includes("\r\n") ? "\r\n" : "\n";
}

/**
 * The whitespace between the start of an element's line and the element itself.
 */
export function indentOf(source: string, element: Element): string {
	const start = startOf(source, element);

	let indentStart = start;
	while (indentStart > 0 && (source[indentStart - 1] === " " || source[indentStart - 1] === "\t")) {
		indentStart--;
	}

	// Only treat it as indentation if nothing else shares the line.
	const isStartOfLine =
		indentStart === 0 || source[indentStart - 1] === "\n" || source[indentStart - 1] === "\r";

	return isStartOfLine ? source.slice(indentStart, start) : "";
}

/**
 * Apply a set of edits to the original source.
 *
 * Edits are applied last to first so that every `start`/`end` still refers to a position in the
 * original text by the time it is used. Callers can therefore collect edits in whatever order is
 * convenient without tracking how earlier splices shift later offsets.
 */
export function applyEdits(source: string, edits: MarkupEdit[]): string {
	const ordered = [...edits].sort((a, z) => z.start - a.start);

	let result = source;
	let previousStart = source.length;

	for (const edit of ordered) {
		if (edit.end > previousStart) {
			throw new MalformedMarkupException("Overlapping edits cannot be applied to a document.");
		}

		result = result.slice(0, edit.start) + edit.text + result.slice(edit.end);
		previousStart = edit.start;
	}

	return result;
}

/**
 * Escape a value for use as element text.
 */
export function escapeText(value: string): string {
	return value.replace(/&/g, "&amp;").replace(/</g, "&lt;");
}

/**
 * An edit replacing the text content of an element.
 *
 * In HTML mode this is only safe for elements with an explicit closing tag - void elements
 * (`<br>`) and elements whose close tag was inferred (`<li>one<li>two`) report an end position
 * that runs into the following markup.
 */
export function replaceText(source: string, element: Element, value: string): MarkupEdit {
	const text = escapeText(value);
	const [firstChild] = element.children;

	if (firstChild) {
		const lastChild = element.children[element.children.length - 1];
		const end = isTag(lastChild) ? endOf(source, lastChild) + 1 : (lastChild.endIndex ?? 0) + 1;

		return {
			start: firstChild.startIndex ?? 0,
			end,
			text,
		};
	}

	const start = startOf(source, element);
	const end = endOf(source, element);
	const markup = source.slice(start, end + 1);

	// `<Version/>` has nowhere to put the text, so expand it into an open/close pair.
	if (markup.endsWith("/>")) {
		return {
			start,
			end: end + 1,
			text: `${markup.replace(/\s*\/>$/, ">")}${text}</${element.name}>`,
		};
	}

	// `<Version></Version>` - insert between the tags.
	const closingTag = source.lastIndexOf("<", end);

	return {
		start: closingTag,
		end: closingTag,
		text,
	};
}

/**
 * An edit inserting markup on its own line directly after an element.
 */
export function insertAfter(source: string, element: Element, markup: string): MarkupEdit {
	const end = endOf(source, element) + 1;

	return {
		start: end,
		end,
		text: `${detectEol(source)}${indentOf(source, element)}${markup}`,
	};
}

/**
 * An edit removing an element along with the line it sits on.
 */
export function removeElement(source: string, element: Element): MarkupEdit {
	let start = startOf(source, element);

	while (start > 0 && (source[start - 1] === " " || source[start - 1] === "\t")) {
		start--;
	}

	if (source[start - 1] === "\n") {
		start--;
		if (source[start - 1] === "\r") {
			start--;
		}
	} else if (source[start - 1] === "\r") {
		start--;
	}

	return {
		start,
		end: endOf(source, element) + 1,
		text: "",
	};
}
