import type { ForkConfig } from "../config/types";

export function validateConfig(config: ForkConfig): void {
	// Validation is done during config initialisation, so if we reach this point the config is valid.
	// The default flow already prints errors, so we just print the valid config here.

	console.log(`
⚙️ Configuration:
${JSON.stringify(config, null, 2)}

✅ Configuration is valid.
`);
}
