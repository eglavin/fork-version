/* eslint-disable @typescript-eslint/no-explicit-any */

import type { ForkConfig } from "../config/schema";

export class Logger {
	constructor(private config: Pick<ForkConfig, "silent" | "debug">) {
		this.log = this.log.bind(this);
		this.warn = this.warn.bind(this);
		this.error = this.error.bind(this);
		this.debug = this.debug.bind(this);
	}

	public log(...messages: any[]) {
		if (!this.config.silent) {
			console.log(...messages);
		}
	}

	public warn(...messages: any[]) {
		if (!this.config.silent) {
			console.warn(...messages);
		}
	}

	public error(...messages: any[]) {
		if (!this.config.silent) {
			console.error(...messages);
		}
	}

	public debug(...messages: any[]) {
		if (this.config.debug && !this.config.silent) {
			console.debug(...messages);
		}
	}
}
