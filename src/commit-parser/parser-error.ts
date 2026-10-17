/**
 * Error thrown when commit parser encounters an error.
 */
export class ParserError extends Error {
	detail: unknown;

	// oxlint-disable-next-line typescript/no-explicit-any
	constructor(message: string, detail?: any) {
		super(message);
		this.name = "ParserError";
		this.detail = detail;
	}
}
