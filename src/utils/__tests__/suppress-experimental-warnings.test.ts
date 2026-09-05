import { suppressExperimentalWarnings } from "../suppress-experimental-warnings";

describe("suppress-experimental-warnings", () => {
	const originalEmitWarning = process.emitWarning;

	afterEach(() => {
		process.emitWarning = originalEmitWarning;
	});

	it("should drop an ExperimentalWarning", () => {
		const emitWarning = vi.fn();
		process.emitWarning = emitWarning;

		suppressExperimentalWarnings();
		process.emitWarning("glob is an experimental feature", "ExperimentalWarning");

		expect(emitWarning).not.toHaveBeenCalled();
	});

	it("should let other warnings through unchanged", () => {
		const emitWarning = vi.fn();
		process.emitWarning = emitWarning;

		suppressExperimentalWarnings();
		process.emitWarning("a genuine deprecation notice", "DeprecationWarning");

		expect(emitWarning).toHaveBeenCalledWith("a genuine deprecation notice", "DeprecationWarning");
	});
});
