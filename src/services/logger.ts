/* eslint-disable @typescript-eslint/no-explicit-any */

import { styleText } from "node:util";
import type { ForkConfig } from "../config/types";

interface LoggerConfig {
	silent?: ForkConfig["silent"];
	debug?: ForkConfig["debug"];
}

export class Logger {
	#silent: boolean;
	#debug: boolean;

	constructor(config: LoggerConfig) {
		this.#silent = config.silent ?? false;
		this.#debug = config.debug ?? false;

		this.log = this.log.bind(this);
		this.warn = this.warn.bind(this);
		this.error = this.error.bind(this);
		this.debug = this.debug.bind(this);
		this.skipping = this.skipping.bind(this);
	}

	log(message: string) {
		if (!this.#silent) {
			console.log(message);
		}
	}

	warn(message: string) {
		if (!this.#silent) {
			console.warn(styleText("yellowBright", message));
		}
	}

	error(message: string) {
		if (!this.#silent) {
			console.error(styleText("redBright", message));
		}
	}

	debug(message: string, ...optionalParams: any[]) {
		if (!this.#silent && this.#debug) {
			console.debug(styleText("cyanBright", message));
			if (optionalParams.length > 0) {
				console.debug(...optionalParams);
			}
		}
	}

	skipping(message: string) {
		if (!this.#silent) {
			console.log(styleText("magenta", message));
		}
	}
}
