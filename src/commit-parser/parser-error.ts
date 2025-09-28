/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Error thrown when commit parser encounters an error.
 */
export class ParserError extends Error {
	detail: unknown;

	constructor(message: string, detail?: any) {
		super(message);
		this.name = "ParserError";
		this.detail = detail;
	}
}
