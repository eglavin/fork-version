import type { MockInstance } from "vitest";
import { Logger } from "../../services/logger";

describe("logger", () => {
	let logSpy: MockInstance;
	let warnSpy: MockInstance;
	let errorSpy: MockInstance;
	let debugSpy: MockInstance;

	beforeEach(() => {
		logSpy = vi.spyOn(global.console, "log").mockImplementation(() => undefined);
		warnSpy = vi.spyOn(global.console, "warn").mockImplementation(() => undefined);
		errorSpy = vi.spyOn(global.console, "error").mockImplementation(() => undefined);
		debugSpy = vi.spyOn(global.console, "debug").mockImplementation(() => undefined);
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should log a message", () => {
		const logger = new Logger({ silent: false, debug: false });

		logger.log("log test");
		logger.warn("warn test");
		logger.error("error test");
		logger.debug("debug test");

		expect(logSpy).toHaveBeenCalledWith("log test");
		expect(warnSpy).toHaveBeenCalledWith("warn test");
		expect(errorSpy).toHaveBeenCalledWith("error test");
		expect(debugSpy).not.toHaveBeenCalledWith("debug test");
	});

	it("should not log if silent is true", () => {
		const logger = new Logger({ silent: true, debug: false });

		logger.log("log test");
		logger.warn("warn test");
		logger.error("error test");
		logger.debug("debug test");

		expect(logSpy).not.toHaveBeenCalled();
		expect(warnSpy).not.toHaveBeenCalled();
		expect(errorSpy).not.toHaveBeenCalled();
		expect(debugSpy).not.toHaveBeenCalled();
	});

	it("should log a debug message if debug is true", () => {
		const enabledDebugSpy = vi.spyOn(global.console, "debug").mockImplementation(() => undefined);

		const logger = new Logger({ silent: false, debug: true });
		logger.debug("debug test");

		expect(enabledDebugSpy).toHaveBeenCalledWith("debug test");
		enabledDebugSpy.mockRestore();
	});
});
