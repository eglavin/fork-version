import { suppressExperimentalWarnings } from "../suppress-experimental-warnings";

describe("suppress-experimental-warnings", () => {
	const originalEmitWarning = process.emitWarning;

	afterEach(() => {
		process.emitWarning = originalEmitWarning;
	});

	it("should drop an ExperimentalWarning", () => {
		const emitWarningMock = vi.fn<typeof process.emitWarning>();
		process.emitWarning = emitWarningMock as typeof process.emitWarning;

		suppressExperimentalWarnings();
		process.emitWarning("glob is an experimental feature", "ExperimentalWarning");

		expect(emitWarningMock).not.toHaveBeenCalled();
	});

	it("should let other warnings through unchanged", () => {
		const emitWarningMock = vi.fn<typeof process.emitWarning>();
		process.emitWarning = emitWarningMock as typeof process.emitWarning;

		suppressExperimentalWarnings();
		process.emitWarning("a genuine deprecation notice", "DeprecationWarning");

		expect(emitWarningMock).toHaveBeenCalledWith(
			"a genuine deprecation notice",
			"DeprecationWarning",
		);
	});
});
