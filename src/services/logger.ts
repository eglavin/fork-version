/* eslint-disable @typescript-eslint/no-explicit-any */

import { styleText } from "node:util";
import type { ForkConfig } from "../config/types";

export class Logger {
	disableLogs = false;

	constructor(private config: Pick<ForkConfig, "silent" | "debug">) {
		this.log = this.log.bind(this);
		this.warn = this.warn.bind(this);
		this.error = this.error.bind(this);
		this.debug = this.debug.bind(this);
		this.skipping = this.skipping.bind(this);

		// Disable logs if silent
		this.disableLogs = this.config.silent;
	}

	public log(message: string) {
		if (!this.disableLogs) {
			console.log(message);
		}
	}

	public warn(message: string) {
		if (!this.disableLogs) {
			console.warn(styleText("yellowBright", message));
		}
	}

	public error(message: string) {
		if (!this.disableLogs) {
			console.error(styleText("redBright", message));
		}
	}

	public debug(message: string, ...optionalParams: any[]) {
		if (this.config.debug && !this.disableLogs) {
			console.debug(styleText("cyanBright", message));
			if (optionalParams.length > 0) {
				console.debug(...optionalParams);
			}
		}
	}

	public skipping(message: string) {
		if (!this.disableLogs) {
			console.log(styleText("magenta", message));
		}
	}
}
