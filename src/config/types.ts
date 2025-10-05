import type { z } from "zod";
import type { ForkConfigSchema } from "./schema";
import type { getCliArguments } from "./cli-arguments";

export type ForkConfig = z.infer<typeof ForkConfigSchema>;

export type Config = Partial<ForkConfig>;

type CLIArguments = ReturnType<typeof getCliArguments>;

export interface ForkVersionCLIArgs {
	input: CLIArguments["input"];
	flags: Partial<CLIArguments["flags"]>;
}
