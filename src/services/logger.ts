/* eslint-disable @typescript-eslint/no-explicit-any */

import type { ForkConfig } from "../config/types";

export class Logger {
	disableLogs = false;

	constructor(private config: Pick<ForkConfig, "silent" | "debug" | "inspectVersion">) {
		this.log = this.log.bind(this);
		this.warn = this.warn.bind(this);
		this.error = this.error.bind(this);
		this.debug = this.debug.bind(this);

		// Disable logs if silent or inspectVersion is set
		this.disableLogs = this.config.silent || this.config.inspectVersion;
	}

	public log(...messages: any[]) {
		if (!this.disableLogs) {
			console.log(...messages);
		}
	}

	public warn(...messages: any[]) {
		if (!this.disableLogs) {
			console.warn(...messages);
		}
	}

	public error(...messages: any[]) {
		if (!this.disableLogs) {
			console.error(...messages);
		}
	}

	public debug(...messages: any[]) {
		if (this.config.debug && !this.disableLogs) {
			console.debug(...messages);
		}
	}
}
