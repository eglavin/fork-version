import type { z } from "zod";
import type { ForkConfigSchema } from "./schema";
import type { getCliArguments } from "./cli-arguments";
import type { ParserOptions } from "../commit-parser/options";

export type ForkConfig = z.infer<typeof ForkConfigSchema> & {
	commitParserOptions?: Partial<ParserOptions>;
};

export type Config = Partial<ForkConfig>;

type CLIArguments = ReturnType<typeof getCliArguments>;

export interface ForkVersionCLIArgs {
	input: CLIArguments["input"];
	flags: Partial<CLIArguments["flags"]>;
}
