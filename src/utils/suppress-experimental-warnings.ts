/**
 * `util.styleText` (stable only from Node v22.13.0/v23.5.0) and `fs.promises.glob` (still warns on
 * some Node versions due to https://github.com/nodejs/node/issues/58343) both call
 * `process.emitWarning` with an `ExperimentalWarning`. A `"warning"` event listener can't stop
 * Node's own stderr printing, so we intercept `process.emitWarning` itself and drop just these,
 * leaving every other warning to print as normal.
 */
export function suppressExperimentalWarnings() {
	const emitWarning = process.emitWarning.bind(process);

	process.emitWarning = ((warning: string | Error, ...args: unknown[]) => {
		const name = typeof warning === "object" ? warning.name : args[0];
		if (name === "ExperimentalWarning") return;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(emitWarning as any)(warning, ...args);
	}) as typeof process.emitWarning;
}
